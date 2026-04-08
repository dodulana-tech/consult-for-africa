import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { emailOwnGigPendingReview } from "@/lib/email";
import { getOwnGigEligibility, checkOwnGigLimits, checkBudgetWithinTierLimits } from "@/lib/consultantTier";
import { z } from "zod";

const createOwnGigSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  clientPhone: z.string().optional(),
  clientContactName: z.string().min(1, "Client contact name is required"),
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  serviceType: z.enum([
    "HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP", "CLINICAL_GOVERNANCE",
    "DIGITAL_HEALTH", "HEALTH_SYSTEMS", "DIASPORA_EXPERTISE", "EM_AS_SERVICE",
  ]),
  engagementType: z.enum([
    "PROJECT", "RETAINER", "SECONDMENT", "FRACTIONAL", "TRANSFORMATION", "TRANSACTION",
  ]).optional(),
  startDate: z.string().optional(),
  budgetAmount: z.number().optional(),
  budgetCurrency: z.enum(["USD", "NGN"]).optional().default("NGN"),
  feeModel: z.enum(["PERCENTAGE", "FLAT_MONTHLY"], { message: "feeModel must be PERCENTAGE or FLAT_MONTHLY" }),
  feePct: z.number().min(10).max(15).optional(),
  flatMonthlyFee: z.number().positive().optional(),
}).refine(
  (data) => data.feeModel !== "PERCENTAGE" || (data.feePct !== undefined && data.feePct >= 10 && data.feePct <= 15),
  { message: "feePct must be between 10 and 15 for PERCENTAGE model", path: ["feePct"] }
).refine(
  (data) => data.feeModel !== "FLAT_MONTHLY" || (data.flatMonthlyFee !== undefined && data.flatMonthlyFee > 0),
  { message: "flatMonthlyFee is required for FLAT_MONTHLY model", path: ["flatMonthlyFee"] }
);

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

async function generateOwnGigCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OG-${year}-`;

  const latest = await prisma.engagement.findFirst({
    where: { engagementCode: { startsWith: prefix } },
    orderBy: { engagementCode: "desc" },
    select: { engagementCode: true },
  });

  let sequence = 1;
  if (latest?.engagementCode) {
    const parts = latest.engagementCode.split("-");
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

/**
 * POST /api/own-gig — create an own gig engagement (pending approval)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "CONSULTANT") {
    return Response.json({ error: "Only consultants can create own gigs" }, { status: 403 });
  }

  // ─── Tier eligibility checks ──────────────────────────────────────────────
  const eligibility = await getOwnGigEligibility(session.user.id);
  if (!eligibility.eligible) {
    return Response.json({ error: eligibility.reason }, { status: 403 });
  }

  const limits = await checkOwnGigLimits(session.user.id);
  if (!limits.allowed) {
    return Response.json({ error: limits.reason }, { status: 400 });
  }

  const parsed = createOwnGigSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    clientName, clientEmail, clientPhone, clientContactName,
    projectName, description, serviceType,
    engagementType: rawType,
    startDate, budgetAmount, budgetCurrency,
    feeModel, feePct, flatMonthlyFee,
  } = parsed.data;

  // ─── Budget tier limit check (respects override) ─────────────────────────
  if (budgetAmount && Number(budgetAmount) > 0) {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: session.user.id },
      select: { tier: true, ownGigOverride: true },
    });
    const tier = (profile?.tier ?? "INTERN") as "INTERN" | "EMERGING" | "STANDARD" | "EXPERIENCED" | "ELITE";
    const currency = (budgetCurrency ?? "NGN") as "NGN" | "USD";
    const override = profile?.ownGigOverride as { enabled: boolean; maxBudgetNGN: number; maxBudgetUSD: number; minFeePct: number } | null;
    const activeOverride = override?.enabled ? override as Parameters<typeof checkBudgetWithinTierLimits>[3] : null;
    const budgetCheck = checkBudgetWithinTierLimits(tier, Number(budgetAmount), currency, activeOverride);
    if (!budgetCheck.allowed) {
      return Response.json({ error: budgetCheck.reason }, { status: 400 });
    }
  }

  // ─── Min fee percentage from tier ─────────────────────────────────────────
  if (feeModel === "PERCENTAGE" && feePct != null && feePct < eligibility.minFeePct) {
    return Response.json({ error: `Minimum platform fee for your tier is ${eligibility.minFeePct}%` }, { status: 400 });
  }

  const engagementType = rawType ?? "PROJECT";

  // Conflict check: fuzzy match on client name or email domain
  const emailDomain = clientEmail.split("@")[1]?.toLowerCase() ?? "";
  const existingClients = await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: clientName, mode: "insensitive" } },
        ...(emailDomain ? [{ email: { endsWith: `@${emailDomain}`, mode: "insensitive" as const } }] : []),
      ],
    },
    select: { id: true, name: true, email: true },
    take: 5,
  });

  const hasConflict = existingClients.length > 0;
  const conflictNote = hasConflict
    ? `Potential overlap with existing client(s): ${existingClients.map((c) => `${c.name} (${c.email})`).join(", ")}`
    : null;

  // Auto-assign least-loaded EM
  const ems = await prisma.user.findMany({
    where: { role: "ENGAGEMENT_MANAGER" },
    select: {
      id: true,
      _count: { select: { managedEngagements: { where: { status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] } } } } },
    },
    orderBy: { managedEngagements: { _count: "asc" } },
    take: 1,
  });

  if (ems.length === 0) {
    return Response.json({ error: "No engagement managers available" }, { status: 500 });
  }

  const emId = ems[0].id;
  const engagementCode = await generateOwnGigCode();

  const result = await prisma.$transaction(async (tx) => {
    // Create client
    const client = await tx.client.create({
      data: {
        name: clientName,
        type: "PRIVATE_MIDTIER",
        primaryContact: clientContactName,
        email: clientEmail,
        phone: clientPhone ?? "",
        address: "",
        currency: budgetCurrency ?? "NGN",
        status: "ACTIVE",
      },
    });

    // Create client contact (portal-enabled)
    await tx.clientContact.create({
      data: {
        clientId: client.id,
        name: clientContactName,
        email: clientEmail,
        phone: clientPhone ?? null,
        isPrimary: true,
        isPortalEnabled: true,
      },
    });

    // Create engagement (pending approval, no assignment yet)
    const engagement = await tx.engagement.create({
      data: {
        clientId: client.id,
        engagementManagerId: emId,
        name: projectName,
        description: description ?? "",
        serviceType,
        engagementType,
        status: "PLANNING",
        startDate: startDate ? new Date(startDate) : new Date(),
        budgetAmount: budgetAmount ? Number(budgetAmount) : 0,
        budgetCurrency: budgetCurrency ?? "NGN",
        engagementCode,
        isOwnGig: true,
        ownGigOwnerId: session.user.id,
        ownGigFeeModel: feeModel,
        ownGigFeePct: feeModel === "PERCENTAGE" ? Number(feePct) : null,
        ownGigFlatMonthlyFee: feeModel === "FLAT_MONTHLY" ? Number(flatMonthlyFee) : null,
        ownGigApprovalStatus: "PENDING",
        ownGigSubmittedAt: new Date(),
        ownGigConflictFlag: hasConflict,
        ownGigConflictNote: conflictNote,
      },
    });

    return engagement;
  });

  // Notify admins about pending own gig
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["DIRECTOR", "PARTNER", "ADMIN"] } },
      select: { email: true, name: true },
    });
    for (const admin of admins) {
      await emailOwnGigPendingReview({
        adminEmail: admin.email!,
        adminName: admin.name ?? "Admin",
        consultantName: session.user.name ?? "A consultant",
        projectName,
        clientName,
        engagementId: result.id,
        hasConflict,
      });
    }
  } catch (err) {
    console.error("[own-gig] Failed to send admin notification emails:", err);
  }

  return Response.json(result, { status: 201 });
}

/**
 * GET /api/own-gig — list own gigs
 */
export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isElevated = ELEVATED.includes(session.user.role);
  const isConsultant = session.user.role === "CONSULTANT";

  if (!isElevated && !isConsultant) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const where = isElevated
    ? { isOwnGig: true }
    : { isOwnGig: true, ownGigOwnerId: session.user.id };

  const gigs = await prisma.engagement.findMany({
    where,
    select: {
      id: true,
      name: true,
      status: true,
      engagementCode: true,
      startDate: true,
      budgetAmount: true,
      budgetCurrency: true,
      ownGigFeeModel: true,
      ownGigFeePct: true,
      ownGigFlatMonthlyFee: true,
      ownGigApprovalStatus: true,
      ownGigApprovalNote: true,
      ownGigConflictFlag: true,
      ownGigSubmittedAt: true,
      createdAt: true,
      client: { select: { id: true, name: true } },
      ownGigOwner: { select: { id: true, name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(gigs);
}
