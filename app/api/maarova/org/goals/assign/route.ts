import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * POST /api/maarova/org/goals/assign
 * Assign a development goal to a user. Auth: HR_ADMIN only.
 */
export async function POST(req: NextRequest) {
  const session = await getMaarovaSession();
  if (!session || session.role !== "HR_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, title, description, dimension, targetDate } = body;

  if (!userId || !title || !description || !dimension) {
    return Response.json({ error: "userId, title, description, and dimension are required" }, { status: 400 });
  }

  // Verify user is in the same org
  const user = await prisma.maarovaUser.findFirst({
    where: { id: userId, organisationId: session.organisationId },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "User not found in your organisation" }, { status: 404 });
  }

  const goal = await prisma.maarovaDevelopmentGoal.create({
    data: {
      userId,
      title,
      description,
      dimension,
      targetDate: targetDate ? new Date(targetDate) : null,
      source: "manager",
      sourceNote: session.name,
    },
  });

  return Response.json(goal, { status: 201 });
}
