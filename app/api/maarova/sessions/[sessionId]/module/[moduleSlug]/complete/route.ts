import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMaarovaSession } from "@/lib/maarovaAuth";
import { scoreModule } from "@/lib/maarova/scoring";
import { handler } from "@/lib/api-handler";

interface RouteParams {
  params: Promise<{ sessionId: string; moduleSlug: string }>;
}

/**
 * POST /api/maarova/sessions/[sessionId]/module/[moduleSlug]/complete
 * Mark a module as complete, run scoring, and check if all modules are done.
 */
export const POST = handler(async function POST(_req: NextRequest, { params }: RouteParams) {
  const auth = await getMaarovaSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, moduleSlug } = await params;

  // Verify session belongs to user
  const session = await prisma.maarovaAssessmentSession.findFirst({
    where: { id: sessionId, userId: auth.sub },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Session has expired" }, { status: 410 });
  }

  // Find module
  const module = await prisma.maarovaModule.findUnique({
    where: { slug: moduleSlug },
  });

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // Find module response with all item responses
  const moduleResponse = await prisma.maarovaModuleResponse.findFirst({
    where: { sessionId, moduleId: module.id },
    include: {
      itemResponses: {
        include: { question: true },
      },
    },
  });

  if (!moduleResponse) {
    return NextResponse.json(
      { error: "Module response record not found" },
      { status: 404 }
    );
  }

  if (moduleResponse.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Module is already completed" },
      { status: 400 }
    );
  }

  // Check minimum responses
  const totalQuestions = await prisma.maarovaQuestion.count({
    where: {
      group: { moduleId: module.id },
      isActive: true,
    },
  });

  const answeredCount = moduleResponse.itemResponses.length;
  const minRequired = Math.ceil(totalQuestions * 0.8); // Must answer at least 80%

  if (answeredCount < minRequired) {
    return NextResponse.json(
      {
        error: `Please answer at least ${minRequired} of ${totalQuestions} questions before completing this module.`,
        answeredCount,
        totalQuestions,
        minRequired,
      },
      { status: 400 }
    );
  }

  // Run scoring
  const scoringConfig = module.scoringConfig as Record<string, unknown> | null;
  const itemResponses = moduleResponse.itemResponses.map((ir) => ({
    questionId: ir.questionId,
    answer: ir.answer,
  }));

  let rawScores: Record<string, unknown> = {};
  try {
    rawScores = scoreModule(
      module.type as Parameters<typeof scoreModule>[0],
      itemResponses,
      scoringConfig ?? undefined
    );
  } catch (err) {
    console.error(`[maarova] Scoring failed for ${module.type}:`, err);
    rawScores = { error: "Scoring error", answeredCount };
  }

  // Compute scaled scores (normalised, flat form for storage and display)
  let scaledScores: Record<string, unknown> = { ...rawScores };

  // Flatten Culture & Team nested structure for consistent display
  if (module.type === "CULTURE_TEAM" && rawScores.culture && typeof rawScores.culture === "object") {
    const culture = rawScores.culture as Record<string, unknown>;
    scaledScores = {
      collaborate: culture.collaborate,
      create: culture.create,
      compete: culture.compete,
      control: culture.control,
      dominant: culture.dominant,
      teamEffectiveness: rawScores.teamEffectiveness,
      engagementDrivers: rawScores.engagementDrivers,
    };
  }

  // Calculate time spent
  const startedAt = moduleResponse.startedAt ?? session.startedAt ?? new Date();
  const timeSpentSeconds = Math.round(
    (Date.now() - new Date(startedAt).getTime()) / 1000
  );

  // Update module response
  await prisma.maarovaModuleResponse.update({
    where: { id: moduleResponse.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      timeSpentSeconds,
      rawScores: rawScores as object,
      scaledScores: scaledScores as object,
    },
  });

  // Check if all CORE modules (excluding 360) are now completed
  const allModuleResponses = await prisma.maarovaModuleResponse.findMany({
    where: { sessionId },
    include: { module: { select: { type: true } } },
  });

  const coreModules = allModuleResponses.filter(
    (mr) => mr.module.type !== "THREE_SIXTY"
  );
  const coreCompleted = coreModules.every((mr) => mr.status === "COMPLETED");
  const allCompleted = allModuleResponses.every((mr) => mr.status === "COMPLETED");

  // Mark session complete when all 5 core modules are done (360 is async/optional)
  if (coreCompleted && session.status !== "COMPLETED") {
    await prisma.maarovaAssessmentSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        totalTimeMinutes: Math.round(
          coreModules.reduce(
            (sum, mr) => sum + (mr.timeSpentSeconds ?? 0),
            0
          ) / 60
        ),
      },
    });
  }

  return NextResponse.json({
    status: "COMPLETED",
    rawScores,
    scaledScores,
    coreModulesComplete: coreCompleted,
    allModulesComplete: allCompleted,
    moduleType: module.type,
  });
});
