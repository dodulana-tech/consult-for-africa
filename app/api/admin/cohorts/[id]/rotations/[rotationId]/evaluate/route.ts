import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rotationId: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canEvaluate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canEvaluate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { rotationId } = await params;
  const body = await req.json();
  const { period, technicalSkills, communication, professionalism, initiative, teamwork, strengths, areasForDevelopment, supervisorComments, recommendPromotion } = body;

  if (!period || !technicalSkills || !communication || !professionalism || !initiative || !teamwork) {
    return Response.json({ error: "All scoring fields are required" }, { status: 400 });
  }

  const scores = [technicalSkills, communication, professionalism, initiative, teamwork].map(Number);
  const overallScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);

  const evaluation = await prisma.internEvaluation.create({
    data: {
      rotationId,
      evaluatorId: session.user.id,
      period,
      technicalSkills: Number(technicalSkills),
      communication: Number(communication),
      professionalism: Number(professionalism),
      initiative: Number(initiative),
      teamwork: Number(teamwork),
      overallScore,
      strengths: Array.isArray(strengths) ? strengths : [],
      areasForDevelopment: Array.isArray(areasForDevelopment) ? areasForDevelopment : [],
      supervisorComments: supervisorComments?.trim() || null,
      recommendPromotion: !!recommendPromotion,
    },
  });

  return Response.json({ evaluation: JSON.parse(JSON.stringify(evaluation)) }, { status: 201 });
}
