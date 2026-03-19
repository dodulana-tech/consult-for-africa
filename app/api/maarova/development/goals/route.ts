import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getMaarovaSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { userId: session.sub },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return Response.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getMaarovaSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, dimension, targetDate, aiGenerated, source, sourceNote } = body;

  if (!title?.trim() || !description?.trim() || !dimension?.trim()) {
    return Response.json(
      { error: "title, description, and dimension are required" },
      { status: 400 },
    );
  }

  const validSources = ["self", "assessment", "coach", "manager"];
  const goalSource = validSources.includes(source) ? source : (aiGenerated ? "assessment" : "self");

  const goal = await prisma.maarovaDevelopmentGoal.create({
    data: {
      userId: session.sub,
      title: title.trim(),
      description: description.trim(),
      dimension: dimension.trim(),
      targetDate: targetDate ? new Date(targetDate) : null,
      aiGenerated: aiGenerated === true,
      source: goalSource,
      sourceNote: sourceNote?.trim() || null,
    },
  });

  return Response.json(goal, { status: 201 });
}
