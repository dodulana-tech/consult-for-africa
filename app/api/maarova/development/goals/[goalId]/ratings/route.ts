import { getMaarovaSession } from "@/lib/maarovaAuth";
import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/maarova/development/goals/[goalId]/ratings
 * Get all ratings for a goal.
 *
 * POST /api/maarova/development/goals/[goalId]/ratings
 * Add a rating. Determines raterType from the session type.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> },
) {
  // Either portal session or coach session can read
  const portalSession = await getMaarovaSession();
  const coachSession = await getMaarovaCoachSession();

  if (!portalSession && !coachSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goalId } = await params;

  const ratings = await prisma.maarovaGoalRating.findMany({
    where: { goalId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ ratings });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> },
) {
  const portalSession = await getMaarovaSession();
  const coachSession = await getMaarovaCoachSession();

  if (!portalSession && !coachSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { goalId } = await params;
  const body = await req.json();
  const { score, note } = body;

  if (score === undefined || score < 0 || score > 100) {
    return Response.json({ error: "score must be between 0 and 100" }, { status: 400 });
  }

  // Find the goal
  const goal = await prisma.maarovaDevelopmentGoal.findUnique({
    where: { id: goalId },
    select: { userId: true, user: { select: { managerId: true } } },
  });

  if (!goal) {
    return Response.json({ error: "Goal not found" }, { status: 404 });
  }

  let raterType: string;
  let ratedById: string;

  if (coachSession) {
    // Coach rating
    const match = await prisma.maarovaCoachingMatch.findFirst({
      where: { coachId: coachSession.sub, userId: goal.userId, status: { in: ["MATCHED", "ACTIVE"] } },
      select: { id: true },
    });
    if (!match) {
      return Response.json({ error: "You are not coaching this user" }, { status: 403 });
    }
    raterType = "coach";
    ratedById = coachSession.sub;
  } else if (portalSession) {
    if (portalSession.sub === goal.userId) {
      // Self rating
      raterType = "self";
      ratedById = portalSession.sub;
    } else if (
      goal.user.managerId === portalSession.sub &&
      ["MANAGER", "HR_ADMIN"].includes(portalSession.role)
    ) {
      // Manager rating
      raterType = "manager";
      ratedById = portalSession.sub;
    } else {
      return Response.json({ error: "You do not have access to rate this goal" }, { status: 403 });
    }
  } else {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rating = await prisma.maarovaGoalRating.create({
    data: {
      goalId,
      ratedById,
      raterType,
      score: Math.round(score),
      note: note?.trim() || null,
    },
  });

  return Response.json(rating, { status: 201 });
}
