import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getQuestionBank, getAssessmentExpiry } from "@/lib/consultantAssessment/questions";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { specialty } = await req.json();

  if (!specialty) {
    return Response.json({ error: "Specialty is required" }, { status: 400 });
  }

  // Get the candidate's track from their talent application
  const talentApp = await prisma.talentApplication.findFirst({
    where: { convertedToUserId: session.user.id },
    select: { track: true },
    orderBy: { createdAt: "desc" },
  });
  const track = talentApp?.track ?? "CONSULTANT";

  const questionBank = getQuestionBank(specialty, track);
  if (!questionBank) {
    return Response.json({ error: "Invalid specialty" }, { status: 400 });
  }

  // Check for an active (non-expired, non-completed) assessment
  const existing = await prisma.consultantAssessment.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return Response.json(
      { error: "You already have an active assessment. Complete or wait for it to expire." },
      { status: 409 }
    );
  }

  // Expire any stale assessments
  await prisma.consultantAssessment.updateMany({
    where: {
      userId: session.user.id,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      expiresAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  const expiresAt = new Date(Date.now() + getAssessmentExpiry(track));

  const assessment = await prisma.consultantAssessment.create({
    data: {
      userId: session.user.id,
      specialty,
      expiresAt,
    },
  });

  return Response.json({
    ok: true,
    assessment: {
      id: assessment.id,
      specialty: assessment.specialty,
      status: assessment.status,
      expiresAt: assessment.expiresAt,
    },
    questions: questionBank,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Expire stale assessments first
  await prisma.consultantAssessment.updateMany({
    where: {
      userId: session.user.id,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      expiresAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  const assessments = await prisma.consultantAssessment.findMany({
    where: { userId: session.user.id },
    include: {
      responses: {
        select: {
          id: true,
          part: true,
          questionId: true,
          wordCount: true,
          timeSpentSec: true,
          answeredAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (assessments.length === 0) {
    return Response.json({ assessment: null });
  }

  const latest = assessments[0];

  return Response.json({
    assessment: {
      id: latest.id,
      specialty: latest.specialty,
      status: latest.status,
      startedAt: latest.startedAt,
      completedAt: latest.completedAt,
      expiresAt: latest.expiresAt,
      tabSwitchCount: latest.tabSwitchCount,
      pasteEventCount: latest.pasteEventCount,
      aiContentScore: latest.aiContentScore,
      aiIntegrityScore: latest.aiIntegrityScore,
      aiBreakdown: latest.aiBreakdown,
      videoUrl: latest.videoUrl,
      videoDurationSec: latest.videoDurationSec,
      adminScore: latest.adminScore,
      adminTier: latest.adminTier,
      responses: latest.responses,
    },
    questions: latest.status !== "COMPLETED" ? getQuestionBank(latest.specialty) : null,
    history: assessments.map((a) => ({
      id: a.id,
      specialty: a.specialty,
      status: a.status,
      completedAt: a.completedAt,
      aiContentScore: a.aiContentScore,
      adminTier: a.adminTier,
    })),
  });
}
