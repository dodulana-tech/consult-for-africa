import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConsultantTier = "INTERN" | "EMERGING" | "STANDARD" | "EXPERIENCED" | "ELITE";

export interface OwnGigOverride {
  enabled: boolean;
  maxConcurrent: number;
  maxBudgetNGN: number;
  maxBudgetUSD: number;
  minFeePct: number;
  reason: string;
  grantedBy: string;
  grantedAt: string;
}

export interface OwnGigEligibility {
  eligible: boolean;
  maxConcurrent: number;
  maxBudgetNGN: number;
  maxBudgetUSD: number;
  minFeePct: number;
  reason: string;
  isOverride: boolean;
}

export interface NextTierRequirements {
  tier: ConsultantTier;
  hoursNeeded: number;
  ratingsNeeded: number;
  projectsNeeded: number;
  monthsNeeded: number;
}

export interface TierScore {
  consultantId: string;
  currentTier: ConsultantTier;
  suggestedTier: ConsultantTier;
  totalPlatformHours: number;
  completedProjects: number;
  averageRating: number;
  totalRatings: number;
  approvedDeliverables: number;
  monthsOnPlatform: number;
  ownGigEligibility: OwnGigEligibility;
  nextTierRequirements: NextTierRequirements | null;
  override: OwnGigOverride | null;
}

// ─── Tier privilege map ──────────────────────────────────────────────────────

const TIER_PRIVILEGES: Record<
  ConsultantTier,
  { maxConcurrent: number; maxBudgetNGN: number; maxBudgetUSD: number; minFeePct: number }
> = {
  INTERN:      { maxConcurrent: 0, maxBudgetNGN: 0,        maxBudgetUSD: 0,     minFeePct: 12 },
  EMERGING:    { maxConcurrent: 0, maxBudgetNGN: 0,        maxBudgetUSD: 0,     minFeePct: 12 },
  STANDARD:    { maxConcurrent: 1, maxBudgetNGN: 5_000_000, maxBudgetUSD: 3_500,  minFeePct: 10 },
  EXPERIENCED: { maxConcurrent: 3, maxBudgetNGN: 20_000_000, maxBudgetUSD: 15_000, minFeePct: 10 },
  ELITE:       { maxConcurrent: 999, maxBudgetNGN: 999_999_999, maxBudgetUSD: 999_999, minFeePct: 8 },
};

// ─── Tier promotion thresholds ───────────────────────────────────────────────

interface TierThreshold {
  hours: number;
  avgRating: number | null;
  completedProjects: number;
  months: number;
}

const TIER_THRESHOLDS: Record<ConsultantTier, TierThreshold> = {
  INTERN:      { hours: 0,    avgRating: null, completedProjects: 0,  months: 0 },
  EMERGING:    { hours: 50,   avgRating: null, completedProjects: 1,  months: 0 },
  STANDARD:    { hours: 200,  avgRating: 3.5,  completedProjects: 2,  months: 3 },
  EXPERIENCED: { hours: 500,  avgRating: 4.0,  completedProjects: 5,  months: 6 },
  ELITE:       { hours: 1000, avgRating: 4.5,  completedProjects: 10, months: 12 },
};

const TIER_ORDER: ConsultantTier[] = ["INTERN", "EMERGING", "STANDARD", "EXPERIENCED", "ELITE"];

// ─── Tier badge styling ──────────────────────────────────────────────────────

export const TIER_BADGES: Record<ConsultantTier, { bg: string; color: string; label: string }> = {
  INTERN:      { bg: "#F3F4F6", color: "#6B7280", label: "Intern" },
  EMERGING:    { bg: "#DBEAFE", color: "#1D4ED8", label: "Emerging" },
  STANDARD:    { bg: "#D1FAE5", color: "#065F46", label: "Standard" },
  EXPERIENCED: { bg: "#FEF3C7", color: "#92400E", label: "Experienced" },
  ELITE:       { bg: "#0F2744", color: "#D4A574", label: "Elite" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseOverride(raw: unknown): OwnGigOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.enabled) return null;
  return {
    enabled: true,
    maxConcurrent: Number(o.maxConcurrent ?? 1),
    maxBudgetNGN: Number(o.maxBudgetNGN ?? 5_000_000),
    maxBudgetUSD: Number(o.maxBudgetUSD ?? 3_500),
    minFeePct: Number(o.minFeePct ?? 10),
    reason: String(o.reason ?? ""),
    grantedBy: String(o.grantedBy ?? ""),
    grantedAt: String(o.grantedAt ?? ""),
  };
}

function monthsBetween(a: Date, b: Date): number {
  const years = b.getFullYear() - a.getFullYear();
  const months = b.getMonth() - a.getMonth();
  return Math.max(0, years * 12 + months);
}

function meetsTierThreshold(
  tier: ConsultantTier,
  hours: number,
  avgRating: number,
  completedProjects: number,
  months: number,
): boolean {
  const t = TIER_THRESHOLDS[tier];
  if (hours < t.hours) return false;
  if (t.avgRating !== null && avgRating < t.avgRating) return false;
  if (completedProjects < t.completedProjects) return false;
  if (months < t.months) return false;
  return true;
}

function suggestTier(
  hours: number,
  avgRating: number,
  completedProjects: number,
  months: number,
): ConsultantTier {
  let suggested: ConsultantTier = "INTERN";
  for (const tier of TIER_ORDER) {
    if (meetsTierThreshold(tier, hours, avgRating, completedProjects, months)) {
      suggested = tier;
    }
  }
  return suggested;
}

function getNextTier(current: ConsultantTier): ConsultantTier | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1];
}

// ─── Core functions ──────────────────────────────────────────────────────────

/**
 * Full tier score breakdown for a consultant.
 */
export async function calculateTierScore(consultantId: string): Promise<TierScore> {
  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: consultantId },
    select: { tier: true, ownGigOverride: true },
  });

  const override = parseOverride(profile?.ownGigOverride);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: consultantId },
    select: { createdAt: true },
  });

  const currentTier = (profile?.tier ?? "INTERN") as ConsultantTier;
  const monthsOnPlatform = monthsBetween(user.createdAt, new Date());

  // Total approved hours
  const hoursAgg = await prisma.timeEntry.aggregate({
    where: { consultantId, status: "APPROVED" },
    _sum: { hours: true },
  });
  const totalPlatformHours = Number(hoursAgg._sum.hours ?? 0);

  // Completed projects (assignments with COMPLETED status)
  const completedProjects = await prisma.assignment.count({
    where: { consultantId, status: "COMPLETED" },
  });

  // Ratings
  const profileRecord = await prisma.consultantProfile.findUnique({
    where: { userId: consultantId },
    select: { id: true },
  });

  let averageRating = 0;
  let totalRatings = 0;

  if (profileRecord) {
    const ratingAgg = await prisma.consultantRating.aggregate({
      where: { consultantId: profileRecord.id },
      _avg: { overallRating: true },
      _count: { id: true },
    });
    averageRating = ratingAgg._avg.overallRating ?? 0;
    totalRatings = ratingAgg._count.id;
  }

  // Approved deliverables
  const approvedDeliverables = await prisma.deliverable.count({
    where: {
      assignment: { consultantId },
      status: { in: ["APPROVED", "DELIVERED_TO_CLIENT"] },
    },
  });

  const suggestedTier = suggestTier(totalPlatformHours, averageRating, completedProjects, monthsOnPlatform);

  // Eligibility (override takes precedence)
  let ownGigEligibility: OwnGigEligibility;

  if (override) {
    ownGigEligibility = {
      eligible: true,
      maxConcurrent: override.maxConcurrent,
      maxBudgetNGN: override.maxBudgetNGN,
      maxBudgetUSD: override.maxBudgetUSD,
      minFeePct: override.minFeePct,
      reason: `Own gig access granted by admin: ${override.reason}`,
      isOverride: true,
    };
  } else {
    const priv = TIER_PRIVILEGES[currentTier];
    const eligible = priv.maxConcurrent > 0;
    let reason: string;
    if (!eligible) {
      const nextRequired = TIER_THRESHOLDS.STANDARD;
      reason = `Own gigs unlock at the Standard tier. You need ${Math.max(0, nextRequired.hours - totalPlatformHours)} more hours, ${Math.max(0, nextRequired.completedProjects - completedProjects)} more completed projects, and a ${nextRequired.avgRating}+ rating.`;
    } else {
      reason = `As a ${currentTier.toLowerCase()} consultant, you can run up to ${priv.maxConcurrent >= 999 ? "unlimited" : priv.maxConcurrent} concurrent own gig${priv.maxConcurrent !== 1 ? "s" : ""}.`;
    }
    ownGigEligibility = {
      eligible,
      maxConcurrent: priv.maxConcurrent >= 999 ? -1 : priv.maxConcurrent,
      maxBudgetNGN: priv.maxBudgetNGN >= 999 ? -1 : priv.maxBudgetNGN,
      maxBudgetUSD: priv.maxBudgetUSD >= 999 ? -1 : priv.maxBudgetUSD,
      minFeePct: priv.minFeePct,
      reason,
      isOverride: false,
    };
  }

  // Next tier requirements
  const next = getNextTier(currentTier);
  let nextTierRequirements: NextTierRequirements | null = null;
  if (next) {
    const nt = TIER_THRESHOLDS[next];
    nextTierRequirements = {
      tier: next,
      hoursNeeded: Math.max(0, nt.hours - totalPlatformHours),
      ratingsNeeded: nt.avgRating !== null ? Math.max(0, Math.round((nt.avgRating - averageRating) * 10) / 10) : 0,
      projectsNeeded: Math.max(0, nt.completedProjects - completedProjects),
      monthsNeeded: Math.max(0, nt.months - monthsOnPlatform),
    };
  }

  return {
    consultantId,
    currentTier,
    suggestedTier,
    totalPlatformHours,
    completedProjects,
    averageRating,
    totalRatings,
    approvedDeliverables,
    monthsOnPlatform,
    ownGigEligibility,
    nextTierRequirements,
    override,
  };
}

/**
 * Quick eligibility check for own gig creation.
 */
export async function getOwnGigEligibility(consultantId: string): Promise<OwnGigEligibility> {
  const score = await calculateTierScore(consultantId);
  return score.ownGigEligibility;
}

/**
 * Check whether the consultant can create another own gig within tier limits.
 */
export async function checkOwnGigLimits(
  consultantId: string,
): Promise<{ allowed: boolean; reason: string; activeCount: number }> {
  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: consultantId },
    select: { tier: true, ownGigOverride: true },
  });

  const override = parseOverride(profile?.ownGigOverride);
  const tier = (profile?.tier ?? "INTERN") as ConsultantTier;
  const priv = override
    ? { maxConcurrent: override.maxConcurrent, maxBudgetNGN: override.maxBudgetNGN, maxBudgetUSD: override.maxBudgetUSD, minFeePct: override.minFeePct }
    : TIER_PRIVILEGES[tier];
  const maxConcurrent = priv.maxConcurrent;

  if (maxConcurrent === 0) {
    return { allowed: false, reason: "Your current tier does not allow own gigs.", activeCount: 0 };
  }

  const activeCount = await prisma.engagement.count({
    where: {
      isOwnGig: true,
      ownGigOwnerId: consultantId,
      status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] },
    },
  });

  if (maxConcurrent < 999 && activeCount >= maxConcurrent) {
    return {
      allowed: false,
      reason: `You have reached the maximum of ${maxConcurrent} concurrent own gig${maxConcurrent !== 1 ? "s" : ""}.`,
      activeCount,
    };
  }

  const remaining = maxConcurrent >= 999 ? "unlimited" : maxConcurrent - activeCount;
  return {
    allowed: true,
    reason: `You can create ${remaining} more own gig${remaining !== 1 ? "s" : ""}.`,
    activeCount,
  };
}

/**
 * Validate that a budget amount is within tier limits.
 */
export function checkBudgetWithinTierLimits(
  tier: ConsultantTier,
  budgetAmount: number,
  currency: "NGN" | "USD",
  override?: OwnGigOverride | null,
): { allowed: boolean; reason: string } {
  const src = override
    ? { maxBudgetNGN: override.maxBudgetNGN, maxBudgetUSD: override.maxBudgetUSD }
    : TIER_PRIVILEGES[tier];
  const maxBudget = currency === "NGN" ? src.maxBudgetNGN : src.maxBudgetUSD;
  const symbol = currency === "NGN" ? "N" : "$";

  if (maxBudget >= 999) {
    return { allowed: true, reason: "No budget cap for your tier." };
  }

  if (budgetAmount > maxBudget) {
    return {
      allowed: false,
      reason: `Budget exceeds the ${symbol}${maxBudget.toLocaleString()} limit for the ${tier.toLowerCase()} tier.`,
    };
  }

  return { allowed: true, reason: `Budget is within the ${symbol}${maxBudget.toLocaleString()} limit.` };
}

/**
 * Minimum fee percentage allowed for a tier.
 */
export function getMinFeePct(tier: ConsultantTier, override?: OwnGigOverride | null): number {
  return override ? override.minFeePct : TIER_PRIVILEGES[tier].minFeePct;
}
