import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * PATCH /api/maarova/coaching/match/[id]
 * Update a coaching match (status changes, including cancellation for coach switch).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getMaarovaSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  // Find the match and verify ownership
  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: { id, userId: session.sub },
  });

  if (!match) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  // Handle cancellation (coach change)
  if (status === "CANCELLED") {
    // Only allow cancellation before programme starts or within first 2 sessions
    const canCancel =
      match.status === "PENDING_MATCH" ||
      match.status === "MATCHED" ||
      (match.status === "ACTIVE" && match.sessionsCompleted <= 2);

    if (!canCancel) {
      return Response.json(
        { error: "Coach changes are only available before the programme starts or within the first 2 sessions." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.maarovaCoachingMatch.update({
        where: { id },
        data: { status: "CANCELLED" },
      }),
      // Decrement coach's active client count
      prisma.maarovaCoach.update({
        where: { id: match.coachId },
        data: { activeClients: { decrement: 1 } },
      }),
    ]);

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid status update" }, { status: 400 });
}
