import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

// GET: Fetch module content + progress for a specific module
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const moduleSlug = searchParams.get("module");
  if (!moduleSlug) return Response.json({ error: "module slug required" }, { status: 400 });

  const mod = await prisma.trainingModule.findUnique({
    where: { slug: moduleSlug },
    include: {
      questions: { orderBy: { order: "asc" } },
      track: { select: { id: true, name: true, slug: true, level: true } },
    },
  });

  if (!mod) return Response.json({ error: "Module not found" }, { status: 404 });

  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: { userId_trackId: { userId: session.user.id, trackId: mod.track.id } },
    include: {
      moduleProgress: { where: { moduleId: mod.id } },
    },
  });

  return Response.json({ module: mod, enrollment, progress: enrollment?.moduleProgress[0] ?? null });
});

// POST: Submit quiz answers and update progress
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId, answers, timeSpentMinutes } = await req.json();
  if (!moduleId || !answers) {
    return Response.json({ error: "moduleId and answers required" }, { status: 400 });
  }

  const mod = await prisma.trainingModule.findUnique({
    where: { id: moduleId },
    include: {
      questions: true,
      track: { include: { modules: { orderBy: { order: "asc" } } } },
    },
  });

  if (!mod) return Response.json({ error: "Module not found" }, { status: 404 });

  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: { userId_trackId: { userId: session.user.id, trackId: mod.trackId } },
    include: { moduleProgress: true },
  });

  if (!enrollment) return Response.json({ error: "Not enrolled" }, { status: 400 });

  const progress = enrollment.moduleProgress.find((p) => p.moduleId === moduleId);
  if (!progress) return Response.json({ error: "Module not in enrollment" }, { status: 400 });

  // Grade answers
  let totalPoints = 0;
  let earnedPoints = 0;
  const answerRecords: { questionId: string; answer: string; isCorrect: boolean; pointsEarned: number }[] = [];

  for (const q of mod.questions) {
    totalPoints += q.points;
    const userAnswer = answers[q.id];
    if (!userAnswer) continue;

    let isCorrect = false;
    const rawOpts = q.options;
    const parsedOpts: { id: string; isCorrect: boolean }[] | null =
      rawOpts == null ? null
      : typeof rawOpts === "string" ? JSON.parse(rawOpts)
      : Array.isArray(rawOpts) ? rawOpts as { id: string; isCorrect: boolean }[]
      : null;
    if (q.type === "MULTIPLE_CHOICE" && parsedOpts) {
      const correctOpt = parsedOpts.find((o) => o.isCorrect);
      isCorrect = correctOpt?.id === userAnswer;
    } else if (q.type === "MULTI_SELECT" && parsedOpts) {
      const correctIds = parsedOpts.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const userIds = (Array.isArray(userAnswer) ? userAnswer : []).sort();
      isCorrect = JSON.stringify(correctIds) === JSON.stringify(userIds);
    } else if (q.type === "CASE_STUDY" || q.type === "SHORT_ANSWER") {
      // Case studies and short answers are marked as correct for now (manual review)
      isCorrect = true;
    }

    const pts = isCorrect ? q.points : 0;
    earnedPoints += pts;
    answerRecords.push({ questionId: q.id, answer: String(userAnswer), isCorrect, pointsEarned: pts });
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= mod.passingScore;

  // Save answers and update progress
  await prisma.$transaction(async (tx) => {
    // Clear previous answers for this attempt (handles retries)
    await tx.questionAnswer.deleteMany({
      where: { progressId: progress.id },
    });

    // Save answers
    if (answerRecords.length > 0) {
      await tx.questionAnswer.createMany({
        data: answerRecords.map((a) => ({ progressId: progress.id, ...a })),
      });
    }

    // Update module progress
    await tx.moduleProgress.update({
      where: { id: progress.id },
      data: {
        status: passed ? "COMPLETED" : "IN_PROGRESS",
        score,
        attempts: { increment: 1 },
        timeSpentMinutes: { increment: timeSpentMinutes || 0 },
        completedAt: passed ? new Date() : undefined,
        lastAccessedAt: new Date(),
      },
    });

    // Unlock next module if passed
    if (passed) {
      const currentIndex = mod.track.modules.findIndex((m) => m.id === moduleId);
      const nextModule = mod.track.modules[currentIndex + 1];
      if (nextModule) {
        const nextProgress = enrollment.moduleProgress.find((p) => p.moduleId === nextModule.id);
        if (nextProgress && nextProgress.status === "LOCKED") {
          await tx.moduleProgress.update({
            where: { id: nextProgress.id },
            data: { status: "AVAILABLE" },
          });
        }
      }

      // Check if all modules completed
      const allModuleIds = mod.track.modules.map((m) => m.id);
      const completedCount = enrollment.moduleProgress.filter(
        (p) => p.status === "COMPLETED" || (p.moduleId === moduleId && passed)
      ).length;

      if (completedCount >= allModuleIds.length) {
        await tx.trainingEnrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "CERTIFIED",
            completedAt: new Date(),
            certifiedAt: new Date(),
            overallScore: score,
            expiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
          },
        });
      }
    }
  });

  return Response.json({ score, passed, totalPoints, earnedPoints });
});
