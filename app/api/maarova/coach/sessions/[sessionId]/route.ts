import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * PATCH /api/maarova/coach/sessions/[sessionId]
 * Update a session: complete it, add notes, update meeting link, cancel, reschedule.
 *
 * On completion:
 *  - Increments match.sessionsCompleted and coach.totalSessions
 *  - Updates match.lastSessionAt
 *  - If all sessions completed, marks match COMPLETED and updates coach stats
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Find session and verify coach ownership
  const coachingSession = await prisma.maarovaCoachingSession.findUnique({
    where: { id: sessionId },
    include: {
      match: {
        select: {
          id: true,
          coachId: true,
          sessionsCompleted: true,
          sessionsScheduled: true,
          status: true,
        },
      },
    },
  });

  if (!coachingSession || coachingSession.match.coachId !== session.sub) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json();
  const { status, notes, duration, focusAreas, meetingLink, actionItems, scheduledAt } = body;

  const updateData: Record<string, unknown> = {};

  // Complete the session
  if (status === "COMPLETED") {
    if (coachingSession.status === "COMPLETED") {
      return Response.json({ error: "Session is already completed" }, { status: 400 });
    }
    if (coachingSession.status === "CANCELLED") {
      return Response.json({ error: "Cannot complete a cancelled session" }, { status: 400 });
    }

    updateData.status = "COMPLETED";
    updateData.completedAt = new Date();
    if (duration) updateData.duration = parseInt(String(duration), 10);
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (Array.isArray(focusAreas)) updateData.focusAreas = focusAreas;
    if (Array.isArray(actionItems)) updateData.actionItems = actionItems;

    const newCompleted = coachingSession.match.sessionsCompleted + 1;
    const isEngagementComplete = newCompleted >= coachingSession.match.sessionsScheduled;

    await prisma.$transaction(async (tx) => {
      // Update match: increment completed count, update lastSessionAt
      const matchUpdate: Record<string, unknown> = {
        sessionsCompleted: { increment: 1 },
        lastSessionAt: new Date(),
      };

      if (isEngagementComplete) {
        matchUpdate.status = "COMPLETED";
        matchUpdate.endDate = new Date();
      }

      // Find next scheduled session for nextSessionAt
      const nextSession = await tx.maarovaCoachingSession.findFirst({
        where: {
          matchId: coachingSession.matchId,
          status: "SCHEDULED",
          id: { not: sessionId },
          scheduledAt: { gt: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        select: { scheduledAt: true },
      });

      matchUpdate.nextSessionAt = nextSession?.scheduledAt ?? null;

      await tx.maarovaCoachingMatch.update({
        where: { id: coachingSession.matchId },
        data: matchUpdate,
      });

      // Update coach stats: increment totalSessions
      const coachUpdate: Record<string, unknown> = {
        totalSessions: { increment: 1 },
      };

      // If the engagement just completed, update coach engagement counters
      if (isEngagementComplete) {
        const coach = await tx.maarovaCoach.findUnique({
          where: { id: session.sub },
          select: { activeClients: true },
        });
        coachUpdate.completedEngagements = { increment: 1 };
        coachUpdate.activeClients = Math.max(0, (coach?.activeClients ?? 1) - 1);
      }

      await tx.maarovaCoach.update({
        where: { id: session.sub },
        data: coachUpdate,
      });
    });
  }

  // Cancel the session
  if (status === "CANCELLED") {
    if (coachingSession.status === "CANCELLED") {
      return Response.json({ error: "Session is already cancelled" }, { status: 400 });
    }
    if (coachingSession.status === "COMPLETED") {
      return Response.json({ error: "Cannot cancel a completed session" }, { status: 400 });
    }

    updateData.status = "CANCELLED";
  }

  // Update fields without status change
  if (notes !== undefined && status !== "COMPLETED") updateData.notes = notes?.trim() || null;
  if (meetingLink !== undefined) updateData.meetingLink = meetingLink?.trim() || null;
  if (Array.isArray(focusAreas) && status !== "COMPLETED") updateData.focusAreas = focusAreas;
  if (Array.isArray(actionItems) && status !== "COMPLETED") updateData.actionItems = actionItems;
  if (scheduledAt) {
    const newDate = new Date(scheduledAt);
    if (!isNaN(newDate.getTime())) {
      updateData.scheduledAt = newDate;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.maarovaCoachingSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  return Response.json({ session: JSON.parse(JSON.stringify(updated)) });
}

/**
 * DELETE /api/maarova/coach/sessions/[sessionId]
 * Cancel/delete a scheduled session.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const coachingSession = await prisma.maarovaCoachingSession.findUnique({
    where: { id: sessionId },
    include: {
      match: { select: { coachId: true } },
    },
  });

  if (!coachingSession || coachingSession.match.coachId !== session.sub) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (coachingSession.status === "COMPLETED") {
    return Response.json({ error: "Cannot delete a completed session" }, { status: 400 });
  }

  await prisma.maarovaCoachingSession.delete({ where: { id: sessionId } });

  return Response.json({ success: true });
}
