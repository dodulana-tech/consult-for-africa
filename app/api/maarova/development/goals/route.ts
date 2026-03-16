import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getMaarovaSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const goals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { userId: session.sub },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return Response.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getMaarovaSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { title, description, dimension, targetDate, aiGenerated } = body;

  if (!title?.trim() || !description?.trim() || !dimension?.trim()) {
    return new Response("title, description, and dimension are required", {
      status: 400,
    });
  }

  const goal = await prisma.maarovaDevelopmentGoal.create({
    data: {
      userId: session.sub,
      title: title.trim(),
      description: description.trim(),
      dimension: dimension.trim(),
      targetDate: targetDate ? new Date(targetDate) : null,
      aiGenerated: aiGenerated === true,
    },
  });

  return Response.json(goal, { status: 201 });
}
