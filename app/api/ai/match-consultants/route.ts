import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function scoreExpertise(
  requiredExpertise: string[],
  consultantExpertise: string[],
  serviceType: string,
  yearsExperience: number,
  tier: string,
): number {
  if (requiredExpertise.length === 0) {
    // No specific requirements - base on tier + experience
    const tierBonus = { ELITE: 0.2, EXPERIENCED: 0.1, STANDARD: 0, EMERGING: -0.1 }[tier] ?? 0;
    return Math.min(1, 0.7 + tierBonus);
  }

  const required = new Set(requiredExpertise.map((s) => s.toLowerCase()));
  const has = new Set(consultantExpertise.map((s) => s.toLowerCase()));

  // Direct overlap
  const matched = [...required].filter((r) =>
    [...has].some((h) => h.includes(r) || r.includes(h))
  ).length;
  let score = matched / required.size;

  // Experience bonus
  if (yearsExperience >= 10) score += 0.1;
  else if (yearsExperience >= 5) score += 0.05;

  // Tier bonus
  if (tier === "ELITE") score += 0.1;
  else if (tier === "EXPERIENCED") score += 0.05;

  return Math.min(1, score);
}

function scorePerformance(
  averageRating: number | null,
  totalProjects: number,
  tier: string,
): number {
  // Base from rating (normalize 3-5 → 0-1)
  const rating = averageRating ?? 3.5;
  const ratingScore = Math.max(0, (rating - 3.0) / 2.0);

  // Project volume bonus
  let volumeBonus = 0;
  if (totalProjects >= 20) volumeBonus = 0.2;
  else if (totalProjects >= 10) volumeBonus = 0.12;
  else if (totalProjects >= 5) volumeBonus = 0.06;

  // Tier factor
  const tierFactor = { ELITE: 1.0, EXPERIENCED: 0.9, STANDARD: 0.75, EMERGING: 0.6 }[tier] ?? 0.75;

  return Math.min(1, (ratingScore * 0.6 + volumeBonus) * tierFactor + (1 - tierFactor) * ratingScore * 0.3);
}

function scoreAvailability(
  availabilityStatus: string,
  hoursPerWeek: number | null,
  estimatedWeeklyHours: number,
): number {
  if (availabilityStatus === "UNAVAILABLE" || availabilityStatus === "ON_LEAVE") return 0.05;

  const available = hoursPerWeek ?? 40;
  const capacityRatio = Math.min(1, available / Math.max(estimatedWeeklyHours, 1));

  if (availabilityStatus === "AVAILABLE") return Math.min(1, 0.6 + capacityRatio * 0.4);
  if (availabilityStatus === "PARTIALLY_AVAILABLE") return Math.min(0.75, 0.3 + capacityRatio * 0.45);
  return 0.4;
}

function scoreCost(
  hourlyRateUSD: number | null,
  monthlyRateNGN: number | null,
  budgetAmount: number,
  budgetCurrency: string,
  durationWeeks: number,
): number {
  const NGN_PER_USD = 1600;

  // Estimate total cost
  let estimatedCostNGN = 0;
  if (hourlyRateUSD) {
    const totalHours = durationWeeks * 20; // ~20h/week
    estimatedCostNGN = hourlyRateUSD * NGN_PER_USD * totalHours;
  } else if (monthlyRateNGN) {
    const months = durationWeeks / 4;
    estimatedCostNGN = monthlyRateNGN * months;
  } else {
    return 0.7; // Unknown rate = neutral
  }

  const budgetNGN = budgetCurrency === "USD" ? budgetAmount * NGN_PER_USD : budgetAmount;
  const ratio = estimatedCostNGN / budgetNGN;

  if (ratio <= 0.3) return 1.0;      // Very affordable
  if (ratio <= 0.5) return 0.85;     // Good value
  if (ratio <= 0.7) return 0.7;      // Reasonable
  if (ratio <= 1.0) return 0.5;      // At budget
  if (ratio <= 1.3) return 0.25;     // Over budget
  return 0.05;                        // Way over
}

// ─── Main route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canMatch = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canMatch) return new Response("Forbidden", { status: 403 });

  const {
    projectId,
    trackId,
    requiredExpertise = [],
    serviceType = "",
    durationWeeks = 12,
  } = await req.json();

  if (!projectId) return new Response("projectId required", { status: 400 });

  // Optionally fetch track context to enrich matching
  let trackContext = "";
  if (trackId) {
    const track = await prisma.engagementTrack.findUnique({
      where: { id: trackId },
      include: {
        staffingRequests: {
          where: { status: "OPEN" },
          select: { skillsRequired: true, role: true },
        },
      },
    });
    if (track) {
      const trackSkills = track.staffingRequests.flatMap((sr) => sr.skillsRequired);
      const uniqueSkills = [...new Set(trackSkills)];
      trackContext = `Matching for the "${track.name}" workstream${uniqueSkills.length > 0 ? ` which requires ${uniqueSkills.join(", ")}` : ""}`;
    }
  }

  // Fetch project
  const project = await prisma.engagement.findUnique({
    where: { id: projectId },
    select: {
      id: true, name: true, description: true,
      serviceType: true, budgetAmount: true, budgetCurrency: true,
      startDate: true, endDate: true,
      client: { select: { name: true, type: true } },
    },
  });
  if (!project) return new Response("Project not found", { status: 404 });

  // Fetch available consultants not already assigned
  const alreadyAssigned = await prisma.assignment.findMany({
    where: { engagementId: projectId, status: { in: ["ACTIVE", "PENDING"] } },
    select: { consultantId: true },
  });
  const assignedIds = new Set(alreadyAssigned.map((a) => a.consultantId));

  const consultants = await prisma.consultantProfile.findMany({
    where: {
      availabilityStatus: { in: ["AVAILABLE", "PARTIALLY_AVAILABLE"] },
      userId: { notIn: [...assignedIds] },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ratings: {
        select: { overallRating: true, technicalQuality: true, timeliness: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (consultants.length === 0) {
    return Response.json({ matches: [], message: "No available consultants found." });
  }

  // Compute duration from project dates if not provided
  const projDuration = durationWeeks ||
    Math.round(
      ((project.endDate ? new Date(project.endDate).getTime() : (new Date(project.startDate).getTime() + 365 * 86400000)) - new Date(project.startDate).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );

  // Score all consultants
  const expertiseRequired = requiredExpertise.length > 0 ? requiredExpertise :
    serviceType ? [serviceType.replace(/_/g, " ")] : [];

  const estimatedWeeklyHours = 20;

  const scored = consultants.map((c) => {
    const expertise = scoreExpertise(
      expertiseRequired, c.expertiseAreas,
      serviceType || project.serviceType, c.yearsExperience, c.tier,
    );
    const performance = scorePerformance(
      c.averageRating ? Number(c.averageRating) : null,
      c.totalProjects, c.tier,
    );
    const availability = scoreAvailability(
      c.availabilityStatus, c.hoursPerWeek, estimatedWeeklyHours,
    );
    const cost = scoreCost(
      c.hourlyRateUSD ? Number(c.hourlyRateUSD) : null,
      c.monthlyRateNGN ? Number(c.monthlyRateNGN) : null,
      Number(project.budgetAmount), project.budgetCurrency, projDuration,
    );

    // Recent performance trend from ratings
    const recentRatings = c.ratings.slice(0, 5);
    const avgRecentRating = recentRatings.length > 0
      ? recentRatings.reduce((s, r) => s + r.overallRating, 0) / recentRatings.length
      : 3.5;
    const fit = Math.min(1, ((avgRecentRating - 3) / 2) * 0.7 + expertise * 0.3);

    const overallScore =
      expertise * 0.35 +
      performance * 0.25 +
      availability * 0.20 +
      cost * 0.10 +
      fit * 0.10;

    return {
      consultant: c,
      scores: { expertise, performance, availability, cost, fit },
      overallScore,
    };
  });

  // Top 5
  const top5 = scored
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);

  // Use Claude to generate explanations for top 5
  let explanations: string[] = top5.map((_, i) => `Match #${i + 1}`);
  try {
    const consultantSummaries = top5.map((c, i) => ({
      rank: i + 1,
      name: c.consultant.user.name,
      expertise: c.consultant.expertiseAreas.join(", ") || "General",
      years: c.consultant.yearsExperience,
      tier: c.consultant.tier,
      rating: c.consultant.averageRating ? Number(c.consultant.averageRating).toFixed(1) : "N/A",
      projects: c.consultant.totalProjects,
      location: c.consultant.location,
      isDiaspora: c.consultant.isDiaspora,
      scores: {
        expertise: Math.round(c.scores.expertise * 100),
        performance: Math.round(c.scores.performance * 100),
        availability: Math.round(c.scores.availability * 100),
        cost: Math.round(c.scores.cost * 100),
      },
    }));

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are matching consultants for a consulting project. Write a single concise sentence (max 20 words) explaining why each consultant is a good match. Be specific. Use plain language. No em dashes.

Project: "${project.name}" (${project.serviceType.replace(/_/g, " ")} for ${project.client.name}, ${project.client.type.replace(/_/g, " ")})
${trackContext ? `Track context: ${trackContext}\n` : ""}Required expertise: ${expertiseRequired.join(", ") || "General consulting"}

Consultants:
${JSON.stringify(consultantSummaries, null, 2)}

Return a JSON array of ${top5.length} strings, one explanation per consultant in rank order. Example format: ["Reason for #1", "Reason for #2", ...]`,
        },
      ],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length === top5.length) {
        explanations = parsed;
      }
    }
  } catch {
    // Fallback explanations
    explanations = top5.map((c) => {
      const parts = [];
      if (c.scores.expertise > 0.7) parts.push(`${c.consultant.yearsExperience} years of relevant expertise`);
      if (c.scores.performance > 0.8) parts.push(`strong track record (${c.consultant.averageRating ? Number(c.consultant.averageRating).toFixed(1) : "N/A"}/5.0)`);
      if (c.scores.availability > 0.7) parts.push("available to start");
      if (c.scores.cost > 0.8) parts.push("within budget");
      return parts.join(", ") || "Good overall fit for this engagement.";
    });
  }

  // Save match scores and build response
  const matches = await Promise.all(
    top5.map(async (c, i) => {
      await prisma.consultantMatchScore.upsert({
        where: { engagementId_consultantId: { engagementId: projectId, consultantId: c.consultant.id } },
        create: {
          engagementId: projectId,
          consultantId: c.consultant.id,
          matchScore: Math.round(c.overallScore * 100),
          rankPosition: i + 1,
          expertiseScore: c.scores.expertise,
          performanceScore: c.scores.performance,
          availabilityScore: c.scores.availability,
          costScore: c.scores.cost,
          fitScore: c.scores.fit,
          explanation: explanations[i],
          confidenceLevel: Math.min(1, 0.6 + c.overallScore * 0.4),
        },
        update: {
          matchScore: Math.round(c.overallScore * 100),
          rankPosition: i + 1,
          expertiseScore: c.scores.expertise,
          performanceScore: c.scores.performance,
          availabilityScore: c.scores.availability,
          costScore: c.scores.cost,
          fitScore: c.scores.fit,
          explanation: explanations[i],
          confidenceLevel: Math.min(1, 0.6 + c.overallScore * 0.4),
          selected: false,
        },
      });

      return {
        consultantId: c.consultant.userId,
        consultantProfileId: c.consultant.id,
        name: c.consultant.user.name,
        email: c.consultant.user.email,
        title: c.consultant.title,
        location: c.consultant.location,
        isDiaspora: c.consultant.isDiaspora,
        tier: c.consultant.tier,
        expertiseAreas: c.consultant.expertiseAreas,
        yearsExperience: c.consultant.yearsExperience,
        averageRating: c.consultant.averageRating ? Number(c.consultant.averageRating) : null,
        totalProjects: c.consultant.totalProjects,
        availabilityStatus: c.consultant.availabilityStatus,
        hoursPerWeek: c.consultant.hoursPerWeek,
        hourlyRateUSD: c.consultant.hourlyRateUSD ? Number(c.consultant.hourlyRateUSD) : null,
        matchScore: Math.round(c.overallScore * 100),
        rankPosition: i + 1,
        scores: {
          expertise: Math.round(c.scores.expertise * 100),
          performance: Math.round(c.scores.performance * 100),
          availability: Math.round(c.scores.availability * 100),
          cost: Math.round(c.scores.cost * 100),
          fit: Math.round(c.scores.fit * 100),
        },
        explanation: explanations[i],
        confidence: Math.round(Math.min(1, 0.6 + c.overallScore * 0.4) * 100),
      };
    })
  );

  return Response.json({ matches, totalCandidates: consultants.length });
}
