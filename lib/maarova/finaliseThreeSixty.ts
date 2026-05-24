import { prisma } from "@/lib/prisma";
import { scoreThreeSixty, type RaterResponse } from "./scoring/threeSixty";
import { generateMaarovaReport } from "./generateReport";

export interface FinaliseThreeSixtyResult {
  ok: boolean;
  reason?: string;
  requestId?: string;
  moduleResponseId?: string;
  raterCount?: number;
  reportRegenerated?: boolean;
}

/**
 * Finalise a Maarova 360 request once enough rater responses are in.
 *
 *   - Aggregates completed rater invites for the request
 *   - Computes scores via scoreThreeSixty (questions provide dimensions)
 *   - Upserts the THREE_SIXTY MaarovaModuleResponse on the subject's most
 *     recent COMPLETED session with status=COMPLETED + raw + scaled scores
 *   - Marks the Maarova360Request as COMPLETE
 *   - Triggers report regeneration so the 360 narrative section appears
 *
 * Safe to call repeatedly. Returns reason=not_ready if the rater threshold
 * has not been met yet.
 */
export async function finaliseThreeSixtyForRequest(
  requestId: string,
  opts: { regenerateReport?: boolean } = {},
): Promise<FinaliseThreeSixtyResult> {
  const regenerate = opts.regenerateReport ?? true;

  const request = await prisma.maarova360Request.findUnique({
    where: { id: requestId },
    include: {
      invites: {
        select: {
          id: true,
          role: true,
          status: true,
          responses: true,
          completedAt: true,
        },
      },
      subject: {
        select: {
          id: true,
          sessions: {
            where: { status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  if (!request) return { ok: false, reason: "request_not_found" };

  const completedInvites = request.invites.filter(
    (i) => i.status === "COMPLETED" && i.responses,
  );

  // Non-self count is what drives the "enough raters" decision. A pure self
  // rating is not a 360.
  const nonSelfCompleted = completedInvites.filter((i) => i.role !== "SELF");
  if (nonSelfCompleted.length < request.minRaters) {
    return {
      ok: false,
      reason: "not_ready",
      requestId,
      raterCount: nonSelfCompleted.length,
    };
  }

  if (request.subject.sessions.length === 0) {
    return { ok: false, reason: "no_completed_session", requestId };
  }
  const sessionId = request.subject.sessions[0].id;

  const module = await prisma.maarovaModule.findFirst({
    where: { type: "THREE_SIXTY", isActive: true },
    include: {
      questionGroups: {
        include: {
          questions: {
            where: { isActive: true },
            select: { id: true, dimension: true, format: true },
          },
        },
      },
    },
  });
  if (!module) return { ok: false, reason: "no_three_sixty_module", requestId };

  // Question id -> dimension map. Trust server-side dimension, not the client.
  const questionDim = new Map<string, string | null>();
  for (const g of module.questionGroups) {
    for (const q of g.questions) {
      questionDim.set(q.id, q.dimension);
    }
  }

  // Convert each completed invite's answers into the shape scoreThreeSixty wants.
  const raterResponses: RaterResponse[] = [];
  const selfRaterResponses: { questionId: string; answer: unknown }[] = [];

  for (const invite of completedInvites) {
    const payload = invite.responses as { answers?: Record<string, unknown> } | null;
    const answers = payload?.answers;
    if (!answers || typeof answers !== "object") continue;

    const items: { questionId: string; answer: unknown }[] = [];
    for (const [questionId, raw] of Object.entries(answers)) {
      if (typeof raw !== "number") continue; // skip free-text entries mixed into answers
      const dim = questionDim.get(questionId);
      if (!dim) continue;
      items.push({
        questionId,
        answer: { value: raw, dimension: dim },
      });
    }
    if (items.length === 0) continue;

    if (invite.role === "SELF") {
      selfRaterResponses.push(...items);
    } else {
      raterResponses.push({
        raterId: invite.id,
        raterRole: invite.role as "SUPERVISOR" | "PEER" | "DIRECT_REPORT",
        responses: items,
      });
    }
  }

  const result = scoreThreeSixty(raterResponses, selfRaterResponses);
  const rawScores = JSON.parse(JSON.stringify({ dimensions: result.dimensions }));
  const scaledScores = JSON.parse(
    JSON.stringify({
      dimensions: result.dimensions,
      blindSpots: result.blindSpots,
      hiddenStrengths: result.hiddenStrengths,
    }),
  );

  // Upsert the module response on the subject's most recent completed session.
  const moduleResponse = await prisma.maarovaModuleResponse.upsert({
    where: { sessionId_moduleId: { sessionId, moduleId: module.id } },
    create: {
      sessionId,
      moduleId: module.id,
      status: "COMPLETED",
      startedAt: new Date(),
      completedAt: new Date(),
      rawScores,
      scaledScores,
    },
    update: {
      status: "COMPLETED",
      completedAt: new Date(),
      rawScores,
      scaledScores,
    },
  });

  if (request.status !== "COMPLETE") {
    await prisma.maarova360Request.update({
      where: { id: request.id },
      data: { status: "COMPLETE" },
    });
  }

  let reportRegenerated = false;
  if (regenerate) {
    const regen = await generateMaarovaReport(sessionId, { force: true });
    reportRegenerated = regen.ok;
    if (!regen.ok) {
      console.error("[finaliseThreeSixty] report regeneration failed:", regen.error);
    }
  }

  return {
    ok: true,
    requestId,
    moduleResponseId: moduleResponse.id,
    raterCount: nonSelfCompleted.length,
    reportRegenerated,
  };
}
