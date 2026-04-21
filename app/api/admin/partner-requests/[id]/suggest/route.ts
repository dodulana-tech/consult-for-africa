import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

// Tier hierarchy (higher index = higher tier)
const TIER_RANK: Record<string, number> = {
  INTERN: 0,
  EMERGING: 1,
  STANDARD: 2,
  EXPERIENCED: 3,
  ELITE: 4,
};

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const { id: requestId } = await params;

  // Load the staffing request
  const request = await prisma.partnerStaffingRequest.findUnique({
    where: { id: requestId },
  });
  if (!request)
    return new Response("Staffing request not found", { status: 404 });

  const requestedSkills = [
    ...request.skillsRequired,
    ...request.serviceTypes,
  ].map((s) => s.toUpperCase());

  const requestedTierRank = request.seniority
    ? TIER_RANK[request.seniority.toUpperCase()] ?? 2
    : 2; // default STANDARD

  // Get IDs of consultants already on active partner deployments
  const activeDeployments = await prisma.partnerDeployment.findMany({
    where: {
      status: { in: ["PROPOSED", "ACCEPTED", "ACTIVE"] },
    },
    select: { consultantId: true, hoursPerWeek: true },
  });

  const deployedConsultantIds = new Set(
    activeDeployments.map((d) => d.consultantId)
  );

  // Build a map of current hours/week per consultant from active deployments
  const currentHoursMap = new Map<string, number>();
  for (const dep of activeDeployments) {
    const prev = currentHoursMap.get(dep.consultantId) || 0;
    currentHoursMap.set(dep.consultantId, prev + (dep.hoursPerWeek || 0));
  }

  // Query all available consultant profiles
  const consultants = await prisma.consultantProfile.findMany({
    where: {
      availabilityStatus: { in: ["AVAILABLE", "PARTIALLY_AVAILABLE"] },
    },
    include: {
      user: { select: { id: true } },
    },
  });

  // Filter out fully-deployed consultants (unless partially available) and score
  const scored: ScoredConsultant[] = [];

  for (const c of consultants) {
    // Skip consultants already on active deployments
    if (deployedConsultantIds.has(c.userId)) continue;

    const consultantTierRank = TIER_RANK[c.tier] ?? 2;

    // Expertise match (40 points)
    const allExpertise = [
      ...c.expertiseAreas,
      ...c.specialties,
    ].map((e) => e.toUpperCase());

    let matchCount = 0;
    for (const skill of requestedSkills) {
      if (allExpertise.includes(skill)) matchCount++;
    }

    const expertiseScore =
      requestedSkills.length > 0
        ? Math.round((matchCount / requestedSkills.length) * 40)
        : 20; // if no skills specified, give baseline

    // Tier fit (20 points)
    let tierScore = 0;
    const tierDiff = consultantTierRank - requestedTierRank;
    if (tierDiff === 0) tierScore = 20;
    else if (tierDiff === 1) tierScore = 15;
    else if (tierDiff >= 2) tierScore = 10;
    else tierScore = 0; // lower tier than requested

    // Availability (20 points)
    const availabilityScore =
      c.availabilityStatus === "AVAILABLE" ? 20 : 10;

    // Track record (20 points)
    const rating = c.averageRating ? Number(c.averageRating) : 0;
    const trackRecordScore = Math.min(Math.round(rating * 4), 20);

    const totalScore =
      expertiseScore + tierScore + availabilityScore + trackRecordScore;

    // Skip very low matches
    if (totalScore < 10) continue;

    // Utilisation check
    const currentHours = currentHoursMap.get(c.userId) || 0;
    const requestedHours = request.hoursPerWeek || 0;
    const projectedHours = currentHours + requestedHours;
    const weeklyCapacity = c.weeklyCapacityHours || 40;
    const projectedUtilisation =
      weeklyCapacity > 0
        ? Math.round((projectedHours / weeklyCapacity) * 100)
        : 0;
    const capacityWarning = projectedUtilisation > 80;

    scored.push({
      consultantId: c.userId,
      matchScore: totalScore,
      scoreBreakdown: {
        expertiseMatch: expertiseScore,
        tierFit: tierScore,
        availability: availabilityScore,
        trackRecord: trackRecordScore,
      },
      anonymisedProfile: {
        tier: c.tier,
        yearsExperience: c.yearsExperience,
        expertiseAreas: c.expertiseAreas,
        bioSnippet: c.bio ? c.bio.substring(0, 100) : "",
        rating: rating > 0 ? rating : null,
      },
      ...(capacityWarning
        ? {
            capacityWarning: true,
            currentUtilisation: projectedUtilisation,
          }
        : {}),
    });
  }

  // Sort by score descending, take top 10
  scored.sort((a, b) => b.matchScore - a.matchScore);
  const top10 = scored.slice(0, 10);

  return Response.json({ ok: true, matches: top10 });
});

interface ScoredConsultant {
  consultantId: string;
  matchScore: number;
  scoreBreakdown: {
    expertiseMatch: number;
    tierFit: number;
    availability: number;
    trackRecord: number;
  };
  anonymisedProfile: {
    tier: string;
    yearsExperience: number;
    expertiseAreas: string[];
    bioSnippet: string;
    rating: number | null;
  };
  capacityWarning?: boolean;
  currentUtilisation?: number;
}
