import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest } from "next/server";

/**
 * PATCH /api/maarova/coaching/sessions/[sessionId]/feedback
 * User-facing endpoint: rate and leave feedback on a completed coaching session.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getMaarovaSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await req.json();
  const { rating, feedback } = body;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return Response.json(
      { error: "rating must be a number between 1 and 5" },
      { status: 400 },
    );
  }

  // Find the session and verify it belongs to the user via the match
  const coachingSession = await prisma.maarovaCoachingSession.findUnique({
    where: { id: sessionId },
    include: {
      match: {
        select: { id: true, userId: true, coachId: true },
      },
    },
  });

  if (!coachingSession || coachingSession.match.userId !== session.sub) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (coachingSession.status !== "COMPLETED") {
    return Response.json(
      { error: "Feedback can only be submitted for completed sessions" },
      { status: 400 },
    );
  }

  if (coachingSession.coacheeRating !== null) {
    return Response.json(
      { error: "Feedback has already been submitted for this session" },
      { status: 400 },
    );
  }

  // Save the feedback
  const updated = await prisma.maarovaCoachingSession.update({
    where: { id: sessionId },
    data: {
      coacheeRating: rating,
      coacheeFeedback: feedback?.trim() || null,
    },
  });

  // Update coach rolling average: recalculate from all rated sessions
  const coachId = coachingSession.match.coachId;
  const ratingAgg = await prisma.maarovaCoachingSession.aggregate({
    where: {
      match: { coachId },
      coacheeRating: { not: null },
    },
    _avg: { coacheeRating: true },
  });

  const newAvg = ratingAgg._avg.coacheeRating;
  if (newAvg !== null) {
    await prisma.maarovaCoach.update({
      where: { id: coachId },
      data: { avgSessionRating: new Decimal(newAvg.toFixed(2)) },
    });
  }

  return Response.json({
    session: {
      id: updated.id,
      coacheeRating: updated.coacheeRating,
      coacheeFeedback: updated.coacheeFeedback,
    },
  });
}
