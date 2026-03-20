import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/maarova/coaching/match
 * Returns current active coaching match for the user.
 */
export async function GET() {
  const session = await getMaarovaSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const match = await prisma.maarovaCoachingMatch.findFirst({
    where: {
      userId: session.sub,
      status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE"] },
    },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          title: true,
          bio: true,
          specialisms: true,
          certifications: true,
          country: true,
          city: true,
          yearsExperience: true,
          avatarUrl: true,
        },
      },
      sessions: {
        orderBy: { scheduledAt: "desc" },
        take: 5,
      },
    },
  });

  return Response.json({ match });
}

/**
 * POST /api/maarova/coaching/match
 * Select a coach and create a coaching match.
 */
export async function POST(req: NextRequest) {
  const session = await getMaarovaSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { coachId, programme } = body;

  if (!coachId) {
    return Response.json({ error: "coachId is required" }, { status: 400 });
  }

  // Check for existing active match
  const existingMatch = await prisma.maarovaCoachingMatch.findFirst({
    where: {
      userId: session.sub,
      status: { in: ["PENDING_MATCH", "MATCHED", "ACTIVE"] },
    },
  });

  if (existingMatch) {
    return Response.json(
      { error: "You already have an active coaching engagement.", matchId: existingMatch.id },
      { status: 409 },
    );
  }

  // Verify coach exists and has capacity
  const coach = await prisma.maarovaCoach.findUnique({
    where: { id: coachId },
  });

  if (!coach || !coach.isActive) {
    return Response.json({ error: "Coach not found or unavailable" }, { status: 404 });
  }

  if (coach.activeClients >= coach.maxClients) {
    return Response.json({ error: "This coach is currently at capacity. Please select another." }, { status: 400 });
  }

  // Check user has completed assessment
  const report = await prisma.maarovaReport.findFirst({
    where: { userId: session.sub, status: "READY" },
    select: { signatureStrengths: true, leadershipArchetype: true },
  });

  const validProgrammes = ["coaching_lite_3_month", "standard_6_month", "intensive_12_month"];
  const selectedProgramme = validProgrammes.includes(programme) ? programme : "standard_6_month";
  const durationMonths = selectedProgramme === "coaching_lite_3_month" ? 3 : selectedProgramme === "intensive_12_month" ? 12 : 6;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  // Create the match
  const match = await prisma.maarovaCoachingMatch.create({
    data: {
      userId: session.sub,
      coachId: coach.id,
      status: "PENDING_MATCH",
      programme: selectedProgramme,
      startDate,
      endDate,
      matchRationale: report
        ? `Matched based on leadership profile: ${report.leadershipArchetype ?? "Assessment completed"}`
        : "Matched by user selection",
      sessionsScheduled: selectedProgramme === "coaching_lite_3_month" ? 6 : selectedProgramme === "intensive_12_month" ? 24 : 12,
    },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          title: true,
          bio: true,
          specialisms: true,
          certifications: true,
          country: true,
          city: true,
          yearsExperience: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Increment coach's active clients
  await prisma.maarovaCoach.update({
    where: { id: coach.id },
    data: { activeClients: { increment: 1 } },
  });

  return Response.json({ match }, { status: 201 });
}
