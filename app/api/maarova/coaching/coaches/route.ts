import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { rankCoaches, type CoachCandidate, type UserMatchContext } from "@/lib/coachMatching";

/**
 * GET /api/maarova/coaching/coaches
 * Returns smart-matched coach recommendations for the authenticated user.
 * Uses assessment results (development areas, coaching priorities) plus
 * organisation context (country, type) to score and rank coaches.
 */
export async function GET() {
  const session = await getMaarovaSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch user with their organisation context
  const user = await prisma.maarovaUser.findUnique({
    where: { id: session.sub },
    include: {
      organisation: { select: { country: true, type: true } },
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Get the user's most recent completed report for coaching priorities
  const report = await prisma.maarovaReport.findFirst({
    where: {
      userId: session.sub,
      status: "DELIVERED",
    },
    orderBy: { generatedAt: "desc" },
    select: {
      coachingPriorities: true,
      developmentAreas: true,
      dimensionScores: true,
    },
  });

  // 3. Extract coaching priorities from report
  const coachingPriorities = extractCoachingPriorities(report);

  // 4. Get all approved coaches with capacity
  const coaches = await prisma.maarovaCoach.findMany({
    where: {
      isActive: true,
      vettingStatus: "APPROVED",
    },
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
      languages: true,
      timezone: true,
      healthcareExperience: true,
      developmentFocus: true,
      activeClients: true,
      maxClients: true,
    },
  });

  // Filter to coaches with remaining capacity
  const available: CoachCandidate[] = coaches
    .filter((c) => c.activeClients < c.maxClients)
    .map(({ activeClients, maxClients, ...coach }) => coach);

  // 5. Build context and rank
  const ctx: UserMatchContext = {
    coachingPriorities,
    orgCountry: user.organisation.country,
    orgType: user.organisation.type,
  };

  const { recommended, others } = rankCoaches(available, ctx);

  return Response.json({ recommended, others });
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract a flat list of coaching priority strings from the report.
 * coachingPriorities is stored as JSON, typically an array of strings
 * or an array of objects with a `name` or `area` field.
 */
function extractCoachingPriorities(
  report: { coachingPriorities: unknown; developmentAreas: string | null; dimensionScores: unknown } | null
): string[] {
  if (!report) return [];

  // Try coachingPriorities first (structured JSON)
  const cp = report.coachingPriorities;
  if (Array.isArray(cp)) {
    const priorities: string[] = [];
    for (const item of cp) {
      if (typeof item === "string") {
        priorities.push(item);
      } else if (item && typeof item === "object") {
        // Handle { name: "..." } or { area: "..." } or { dimension: "..." }
        const val = (item as Record<string, unknown>).name
          ?? (item as Record<string, unknown>).area
          ?? (item as Record<string, unknown>).dimension;
        if (typeof val === "string") priorities.push(val);
      }
    }
    if (priorities.length > 0) return priorities;
  }

  // Fallback: try to extract from dimensionScores (pick lowest-scoring dimensions)
  const ds = report.dimensionScores;
  if (ds && typeof ds === "object" && !Array.isArray(ds)) {
    const entries = Object.entries(ds as Record<string, number>)
      .filter(([, v]) => typeof v === "number")
      .sort(([, a], [, b]) => a - b);
    // Return bottom 3 dimensions as development focus areas
    return entries.slice(0, 3).map(([key]) => key);
  }

  return [];
}
