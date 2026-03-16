import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getMaarovaSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // Check for existing active match
  const existingMatch = await prisma.maarovaCoachingMatch.findFirst({
    where: {
      userId: session.sub,
      status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE"] },
    },
  });

  if (existingMatch) {
    return Response.json({
      message: "You already have an active coaching match.",
      matchId: existingMatch.id,
      status: existingMatch.status,
    });
  }

  // Check user has a completed report (prerequisite for coaching)
  const report = await prisma.maarovaReport.findFirst({
    where: { userId: session.sub, status: "READY" },
  });

  if (!report) {
    return Response.json(
      {
        message:
          "Complete your assessment before requesting a coaching match.",
      },
      { status: 400 }
    );
  }

  // Placeholder: In future, this will fetch coaches, score compatibility,
  // and use Claude to generate match rationale.
  // For now, return a message that matching is in progress.

  return Response.json({
    message:
      "Coaching match request received. Our team will review your assessment results and match you with the most suitable coach. You will be notified once matched.",
    status: "PENDING",
  });
}
