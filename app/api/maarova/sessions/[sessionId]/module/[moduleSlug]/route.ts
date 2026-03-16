import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMaarovaSession } from "@/lib/maarovaAuth";

interface RouteParams {
  params: Promise<{ sessionId: string; moduleSlug: string }>;
}

/**
 * GET /api/maarova/sessions/[sessionId]/module/[moduleSlug]
 * Return questions for this module, grouped by question group.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
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

  // Find the module by slug
  const module = await prisma.maarovaModule.findUnique({
    where: { slug: moduleSlug },
    include: {
      questionGroups: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // Get existing responses for this module in this session
  const moduleResponse = await prisma.maarovaModuleResponse.findFirst({
    where: { sessionId, moduleId: module.id },
    include: {
      itemResponses: true,
    },
  });

  if (!moduleResponse) {
    return NextResponse.json({ error: "Module response record not found" }, { status: 404 });
  }

  // Build response map for existing answers
  const existingAnswers: Record<string, unknown> = {};
  for (const ir of moduleResponse.itemResponses) {
    existingAnswers[ir.questionId] = ir.answer;
  }

  return NextResponse.json({
    module: {
      id: module.id,
      type: module.type,
      name: module.name,
      slug: module.slug,
      description: module.description,
      estimatedMinutes: module.estimatedMinutes,
    },
    moduleResponseId: moduleResponse.id,
    status: moduleResponse.status,
    questionGroups: module.questionGroups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      context: g.context,
      order: g.order,
      questions: g.questions.map((q) => ({
        id: q.id,
        format: q.format,
        text: q.text,
        options: q.options,
        dimension: q.dimension,
        order: q.order,
        existingAnswer: existingAnswers[q.id] ?? null,
      })),
    })),
    totalQuestions: module.questionGroups.reduce(
      (sum, g) => sum + g.questions.length,
      0
    ),
    answeredCount: moduleResponse.itemResponses.length,
  });
}

/**
 * POST /api/maarova/sessions/[sessionId]/module/[moduleSlug]
 * Save/auto-save item responses. Can be called multiple times.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await getMaarovaSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, moduleSlug } = await params;

  // Verify session
  const session = await prisma.maarovaAssessmentSession.findFirst({
    where: { id: sessionId, userId: auth.sub },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Session has expired" }, { status: 410 });
  }

  if (session.status === "COMPLETED") {
    return NextResponse.json({ error: "Session is already completed" }, { status: 400 });
  }

  const module = await prisma.maarovaModule.findUnique({
    where: { slug: moduleSlug },
  });

  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const moduleResponse = await prisma.maarovaModuleResponse.findFirst({
    where: { sessionId, moduleId: module.id },
  });

  if (!moduleResponse) {
    return NextResponse.json({ error: "Module response record not found" }, { status: 404 });
  }

  if (moduleResponse.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Module is already completed" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const responses = body.responses as
    | { questionId: string; answer: unknown; responseTimeMs?: number }[]
    | undefined;

  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json(
      { error: "No responses provided" },
      { status: 400 }
    );
  }

  // Upsert each item response
  const upserts = responses.map((r) =>
    prisma.maarovaItemResponse.upsert({
      where: {
        moduleResponseId_questionId: {
          moduleResponseId: moduleResponse.id,
          questionId: r.questionId,
        },
      },
      update: {
        answer: r.answer as object,
        responseTimeMs: r.responseTimeMs ?? null,
        answeredAt: new Date(),
      },
      create: {
        moduleResponseId: moduleResponse.id,
        questionId: r.questionId,
        answer: r.answer as object,
        responseTimeMs: r.responseTimeMs ?? null,
      },
    })
  );

  await prisma.$transaction(upserts);

  // Update module response status to IN_PROGRESS if NOT_STARTED
  if (moduleResponse.status === "NOT_STARTED") {
    await prisma.maarovaModuleResponse.update({
      where: { id: moduleResponse.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  }

  // Also mark session as IN_PROGRESS if needed
  if (session.status === "NOT_STARTED") {
    await prisma.maarovaAssessmentSession.update({
      where: { id: sessionId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  }

  // Count total saved
  const savedCount = await prisma.maarovaItemResponse.count({
    where: { moduleResponseId: moduleResponse.id },
  });

  return NextResponse.json({
    saved: responses.length,
    totalSaved: savedCount,
  });
}
