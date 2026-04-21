import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/maarova/manager/reports/[userId]/goals
 * View a direct report's goals. Auth: MANAGER or HR_ADMIN, must be their manager.
 *
 * POST /api/maarova/manager/reports/[userId]/goals
 * Assign a goal to a direct report.
 */
export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getMaarovaSession();
  if (!session || !["MANAGER", "HR_ADMIN"].includes(session.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await params;

  // Verify this user reports to the manager
  const user = await prisma.maarovaUser.findFirst({
    where: { id: userId, managerId: session.sub, organisationId: session.organisationId },
    select: { id: true, name: true, title: true },
  });

  if (!user) {
    return Response.json({ error: "User is not your direct report" }, { status: 403 });
  }

  const goals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { userId },
    include: {
      ratings: {
        orderBy: { createdAt: "desc" },
        select: { id: true, raterType: true, score: true, note: true, createdAt: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return Response.json({ user, goals: goals.map((g) => JSON.parse(JSON.stringify(g))) });
});

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await getMaarovaSession();
  if (!session || !["MANAGER", "HR_ADMIN"].includes(session.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await params;

  // Verify this user reports to the manager
  const user = await prisma.maarovaUser.findFirst({
    where: { id: userId, managerId: session.sub, organisationId: session.organisationId },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "User is not your direct report" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, dimension, targetDate } = body;

  if (!title || !description || !dimension) {
    return Response.json({ error: "title, description, and dimension are required" }, { status: 400 });
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
});
