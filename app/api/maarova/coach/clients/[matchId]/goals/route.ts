import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * POST /api/maarova/coach/clients/[matchId]/goals
 * Assign a goal to a coaching client. Source: "coach".
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await getMaarovaCoachSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await params;

  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: { id: matchId, coachId: session.sub, status: { in: ["MATCHED", "ACTIVE"] } },
    select: { userId: true },
  });

  if (!match) {
    return Response.json({ error: "Client not found or not active" }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, dimension, targetDate } = body;

  if (!title || !description || !dimension) {
    return Response.json({ error: "title, description, and dimension are required" }, { status: 400 });
  }

  const goal = await prisma.maarovaDevelopmentGoal.create({
    data: {
      userId: match.userId,
      title,
      description,
      dimension,
      targetDate: targetDate ? new Date(targetDate) : null,
      source: "coach",
      sourceNote: session.name,
    },
  });

  return Response.json(goal, { status: 201 });
}
