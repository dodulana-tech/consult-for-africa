import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/maarova/coach/clients/[matchId]/chemistry-call
 * Coach schedules or completes a chemistry call with a prospective coachee.
 *
 * Schedule: { action: "schedule", scheduledAt: ISO string, link: string }
 * Complete: { action: "complete", notes?: string, rating?: number (1-5), proceed: boolean }
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await params;
  const body = await req.json();
  const { action } = body;

  if (!action || !["schedule", "complete"].includes(action)) {
    return Response.json(
      { error: "action must be 'schedule' or 'complete'" },
      { status: 400 },
    );
  }

  // Verify the match belongs to this coach
  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: { id: matchId, coachId: session.sub },
    select: { id: true, status: true, userId: true },
  });

  if (!match) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  // --- Schedule a chemistry call ---
  if (action === "schedule") {
    if (match.status !== "PENDING_MATCH") {
      return Response.json(
        { error: "Chemistry call can only be scheduled for PENDING_MATCH engagements" },
        { status: 400 },
      );
    }

    const { scheduledAt, link } = body;

    if (!scheduledAt || !link) {
      return Response.json(
        { error: "scheduledAt and link are required" },
        { status: 400 },
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return Response.json({ error: "Invalid date" }, { status: 400 });
    }

    const updated = await prisma.maarovaCoachingMatch.update({
      where: { id: matchId },
      data: {
        chemistryCallScheduledAt: scheduledDate,
        chemistryCallLink: link.trim(),
      },
    });

    return Response.json({
      match: {
        id: updated.id,
        status: updated.status,
        chemistryCallScheduledAt: updated.chemistryCallScheduledAt,
        chemistryCallLink: updated.chemistryCallLink,
      },
    });
  }

  // --- Complete a chemistry call ---
  if (action === "complete") {
    if (match.status !== "PENDING_MATCH") {
      return Response.json({ error: "Chemistry call can only be completed on a pending match" }, { status: 400 });
    }

    const { notes, rating, proceed } = body;

    if (typeof proceed !== "boolean") {
      return Response.json(
        { error: "proceed (boolean) is required" },
        { status: 400 },
      );
    }

    if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return Response.json(
        { error: "rating must be a number between 1 and 5" },
        { status: 400 },
      );
    }

    const newStatus = proceed ? "MATCHED" : "CANCELLED";

    const updated = await prisma.maarovaCoachingMatch.update({
      where: { id: matchId },
      data: {
        status: newStatus,
        chemistryCallCompletedAt: new Date(),
        chemistryCallNotes: notes?.trim() || null,
        chemistryCallRating: rating ?? null,
      },
    });

    if (!proceed) {
      // Decrement coach's active clients since match was created with increment
      await prisma.maarovaCoach.update({
        where: { id: session.sub },
        data: { activeClients: { decrement: 1 } },
      });
    }

    return Response.json({
      match: {
        id: updated.id,
        status: updated.status,
        chemistryCallCompletedAt: updated.chemistryCallCompletedAt,
        chemistryCallNotes: updated.chemistryCallNotes,
        chemistryCallRating: updated.chemistryCallRating,
      },
    });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
});
