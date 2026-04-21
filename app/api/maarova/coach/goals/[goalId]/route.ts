import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * PATCH /api/maarova/coach/goals/[goalId]
 * Update coach notes on a goal. Auth: coach, must be coaching the goal's user.
 */
export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> },
) {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goalId } = await params;

  // Find goal and verify coach relationship
  const goal = await prisma.maarovaDevelopmentGoal.findUnique({
    where: { id: goalId },
    select: { userId: true },
  });

  if (!goal) {
    return Response.json({ error: "Goal not found" }, { status: 404 });
  }

  // Verify the coach has an active match with this user
  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: {
      coachId: session.sub,
      userId: goal.userId,
      status: { in: ["MATCHED", "ACTIVE"] },
    },
    select: { id: true },
  });

  if (!match) {
    return Response.json({ error: "You are not coaching this user" }, { status: 403 });
  }

  const body = await req.json();
  const { coachNotes } = body;

  const updated = await prisma.maarovaDevelopmentGoal.update({
    where: { id: goalId },
    data: { coachNotes },
    select: { id: true, coachNotes: true },
  });

  return Response.json(updated);
});
