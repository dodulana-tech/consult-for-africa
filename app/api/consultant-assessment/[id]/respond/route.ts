import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.consultantAssessment.findUnique({
    where: { id },
  });

  if (!assessment) {
    return Response.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (assessment.status === "COMPLETED") {
    return Response.json({ error: "Assessment already completed" }, { status: 400 });
  }

  if (assessment.status === "EXPIRED" || assessment.expiresAt <= new Date()) {
    // Mark as expired if not already
    if (assessment.status !== "EXPIRED") {
      await prisma.consultantAssessment.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
    }
    return Response.json({ error: "Assessment has expired" }, { status: 400 });
  }

  const {
    part,
    questionId,
    questionText,
    answer,
    timeSpentSec,
    pasteEvents,
    tabSwitches,
    typingPattern,
    wordCount,
  } = await req.json();

  if (!part || !questionId || !questionText || !answer) {
    return Response.json(
      { error: "part, questionId, questionText, and answer are required" },
      { status: 400 }
    );
  }

  const validParts = ["scenario", "experience", "quickfire", "video"];
  if (!validParts.includes(part)) {
    return Response.json({ error: "Invalid part" }, { status: 400 });
  }

  // Upsert: allow overwriting during the assessment
  const existing = await prisma.consultantAssessmentResponse.findFirst({
    where: {
      assessmentId: id,
      questionId,
    },
  });

  let response;
  if (existing) {
    response = await prisma.consultantAssessmentResponse.update({
      where: { id: existing.id },
      data: {
        answer,
        timeSpentSec: timeSpentSec ?? null,
        pasteEvents: pasteEvents ?? 0,
        tabSwitches: tabSwitches ?? 0,
        typingPattern: typingPattern ?? null,
        wordCount: wordCount ?? null,
        answeredAt: new Date(),
      },
    });
  } else {
    response = await prisma.consultantAssessmentResponse.create({
      data: {
        assessmentId: id,
        part,
        questionId,
        questionText,
        answer,
        timeSpentSec: timeSpentSec ?? null,
        pasteEvents: pasteEvents ?? 0,
        tabSwitches: tabSwitches ?? 0,
        typingPattern: typingPattern ?? null,
        wordCount: wordCount ?? null,
      },
    });
  }

  // Move to IN_PROGRESS if this is the first response
  if (assessment.status === "NOT_STARTED") {
    await prisma.consultantAssessment.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
  }

  return Response.json({
    ok: true,
    response: {
      id: response.id,
      part: response.part,
      questionId: response.questionId,
      wordCount: response.wordCount,
      answeredAt: response.answeredAt,
    },
  });
}
