import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getQuestionBank } from "@/lib/consultantAssessment/questions";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.consultantAssessment.findUnique({
    where: { id },
    include: {
      responses: {
        select: {
          part: true,
          questionId: true,
          answer: true,
        },
      },
    },
  });

  if (!assessment) {
    return Response.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check expiry
  if (assessment.status !== "COMPLETED" && assessment.status !== "EXPIRED" && assessment.expiresAt <= new Date()) {
    await prisma.consultantAssessment.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
    return Response.json({ status: "EXPIRED" });
  }

  const questionBank = getQuestionBank(assessment.specialty);

  // Transform to the structure the assessment page expects
  const scenarioQ = questionBank?.scenario[0];
  const experienceQs = questionBank?.experience ?? [];
  const quickfireQs = questionBank?.quickfire ?? [];
  const videoQ = questionBank?.video[0];

  return Response.json({
    id: assessment.id,
    specialty: assessment.specialty,
    status: assessment.status,
    expiresAt: assessment.expiresAt.toISOString(),
    scenario: scenarioQ
      ? { text: scenarioQ.text, title: `${assessment.specialty.replace(/_/g, " ")} Scenario` }
      : { text: "", title: "Scenario" },
    experienceQuestions: experienceQs.map((q) => ({ id: q.id, text: q.text })),
    quickfireQuestions: quickfireQs.map((q) => ({ id: q.id, text: q.text })),
    videoPrompt: videoQ?.text ?? "Summarise your approach to the scenario from Part 1 in a 2-minute video.",
    responses: assessment.responses,
    videoUrl: assessment.videoUrl,
  });
});
