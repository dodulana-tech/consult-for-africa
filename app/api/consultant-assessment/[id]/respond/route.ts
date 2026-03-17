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
    if (assessment.status !== "EXPIRED") {
      await prisma.consultantAssessment.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
    }
    return Response.json({ error: "Assessment has expired" }, { status: 400 });
  }

  const body = await req.json();

  // Support both batch { responses: [...] } and single { part, questionId, ... }
  const items: Array<{
    part: string;
    questionId: string;
    questionText: string;
    answer: string;
    timeSpentSec?: number;
    pasteEvents?: number;
    tabSwitches?: number;
    typingPattern?: unknown;
    wordCount?: number;
  }> = Array.isArray(body.responses) ? body.responses : [body];

  const validParts = ["scenario", "experience", "quickfire", "video"];
  const results = [];

  for (const item of items) {
    if (!item.part || !item.questionId || !item.answer) continue;
    if (!validParts.includes(item.part)) continue;

    const existing = await prisma.consultantAssessmentResponse.findFirst({
      where: { assessmentId: id, questionId: item.questionId },
    });

    let response;
    if (existing) {
      response = await prisma.consultantAssessmentResponse.update({
        where: { id: existing.id },
        data: {
          answer: item.answer,
          timeSpentSec: item.timeSpentSec ?? null,
          pasteEvents: item.pasteEvents ?? 0,
          tabSwitches: item.tabSwitches ?? 0,
          typingPattern: item.typingPattern ? JSON.parse(JSON.stringify(item.typingPattern)) : undefined,
          wordCount: item.wordCount ?? null,
          answeredAt: new Date(),
        },
      });
    } else {
      response = await prisma.consultantAssessmentResponse.create({
        data: {
          assessmentId: id,
          part: item.part,
          questionId: item.questionId,
          questionText: item.questionText ?? "",
          answer: item.answer,
          timeSpentSec: item.timeSpentSec ?? null,
          pasteEvents: item.pasteEvents ?? 0,
          tabSwitches: item.tabSwitches ?? 0,
          typingPattern: item.typingPattern ? JSON.parse(JSON.stringify(item.typingPattern)) : undefined,
          wordCount: item.wordCount ?? null,
        },
      });
    }

    results.push({
      id: response.id,
      part: response.part,
      questionId: response.questionId,
      wordCount: response.wordCount,
      answeredAt: response.answeredAt,
    });
  }

  // Move to IN_PROGRESS if this is the first response
  if (assessment.status === "NOT_STARTED" && results.length > 0) {
    await prisma.consultantAssessment.update({
      where: { id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
  }

  return Response.json({ ok: true, saved: results.length });
}
