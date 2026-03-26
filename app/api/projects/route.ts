import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { Prisma, ServiceType, EngagementStatus, RiskLevel, EngagementType, DealStructure, MandateType } from "@prisma/client";

/**
 * GET /api/projects
 * List engagements accessible to the current user.
 * Used by NDA Manager to populate "Link to Project" dropdown.
 */
export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = {};
  if (role === "CONSULTANT") {
    where = { assignments: { some: { consultantId: session.user.id } } };
  } else if (role === "ENGAGEMENT_MANAGER") {
    where = { engagementManagerId: session.user.id };
  }
  // DIRECTOR, PARTNER, ADMIN see all

  const engagements = await prisma.engagement.findMany({
    where,
    select: {
      id: true,
      name: true,
      clientId: true,
      status: true,
      client: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return Response.json({
    engagements: engagements.map((e) => ({
      id: e.id,
      name: `${e.name} (${e.client.name})`,
      clientId: e.clientId,
      status: e.status,
    })),
  });
}

const VALID_ENGAGEMENT_TYPES: EngagementType[] = [
  "PROJECT", "RETAINER", "SECONDMENT", "FRACTIONAL", "TRANSFORMATION", "TRANSACTION",
];

const VALID_SERVICE_TYPES: ServiceType[] = [
  "HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP",
  "CLINICAL_GOVERNANCE", "DIGITAL_HEALTH", "HEALTH_SYSTEMS",
  "DIASPORA_EXPERTISE", "EM_AS_SERVICE",
];

async function generateEngagementCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C4A-${year}-`;

  // Find the latest engagement code for any year to get the global sequence
  const latest = await prisma.engagement.findFirst({
    where: { engagementCode: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { engagementCode: true },
  });

  let nextSeq = 1;
  if (latest?.engagementCode) {
    const match = latest.engagementCode.match(/C4A-\d{4}-(\d+)/);
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const body = await req.json();

  const {
    clientId,
    engagementManagerId,
    name,
    description,
    serviceType,
    status,
    startDate,
    endDate,
    riskLevel,
    notes,
    engagementType: rawEngagementType,
  } = body;

  // Validate required fields
  if (!clientId || !name || !serviceType) {
    return new Response("clientId, name, and serviceType are required", { status: 400 });
  }

  if (!VALID_SERVICE_TYPES.includes(serviceType)) {
    return new Response("Invalid serviceType", { status: 400 });
  }

  const engagementType: EngagementType = rawEngagementType ?? "PROJECT";
  if (!VALID_ENGAGEMENT_TYPES.includes(engagementType)) {
    return new Response("Invalid engagementType. Must be one of: PROJECT, RETAINER, SECONDMENT, FRACTIONAL, TRANSFORMATION, TRANSACTION", { status: 400 });
  }

  // For RETAINER, startDate is required but endDate is optional
  // For PROJECT, keep existing validation
  if (engagementType === "RETAINER" && !startDate) {
    return new Response("startDate is required for RETAINER engagements", { status: 400 });
  }

  // If EM creating, default to themselves
  const emId: string = engagementManagerId ??
    (session.user.role === "ENGAGEMENT_MANAGER" ? session.user.id : session.user.id);

  if (!emId) {
    return new Response("engagementManagerId is required", { status: 400 });
  }

  // Generate engagement code
  const engagementCode = await generateEngagementCode();

  // Build type-specific data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeData: Record<string, any> = {};

  if (engagementType === "PROJECT") {
    const { budgetAmount, budgetCurrency, methodologyId, budgetSensitivity, consultantTierMin, consultantTierMax, internEligible, pricingNotes } = body;
    typeData.budgetAmount = budgetAmount ? Number(budgetAmount) : 0;
    typeData.budgetCurrency = budgetCurrency ?? "NGN";
    typeData.budgetSensitivity = budgetSensitivity ?? null;
    typeData.consultantTierMin = consultantTierMin ?? null;
    typeData.consultantTierMax = consultantTierMax ?? null;
    typeData.internEligible = !!internEligible;
    typeData.pricingNotes = pricingNotes ?? null;
    if (methodologyId) {
      typeData.methodologyTemplate = { connect: { id: methodologyId } };
    }
  }

  if (engagementType === "RETAINER") {
    const { retainerMonthlyFee, retainerHoursPool, retainerAutoRenew, retainerNoticePeriodDays, budgetCurrency } = body;
    typeData.retainerMonthlyFee = retainerMonthlyFee ? Number(retainerMonthlyFee) : null;
    typeData.retainerHoursPool = retainerHoursPool ? Number(retainerHoursPool) : null;
    typeData.retainerAutoRenew = retainerAutoRenew ?? null;
    typeData.retainerNoticePeriodDays = retainerNoticePeriodDays ? Number(retainerNoticePeriodDays) : null;
    typeData.budgetAmount = retainerMonthlyFee ? Number(retainerMonthlyFee) : 0;
    typeData.budgetCurrency = budgetCurrency ?? "NGN";
  }

  if (engagementType === "SECONDMENT") {
    const { secondeeMonthlyFee, secondeeClientLineManager, secondeeRecallClauseDays, budgetCurrency } = body;
    typeData.secondeeMonthlyFee = secondeeMonthlyFee ? Number(secondeeMonthlyFee) : null;
    typeData.secondeeClientLineManager = secondeeClientLineManager ?? null;
    typeData.secondeeRecallClauseDays = secondeeRecallClauseDays ? Number(secondeeRecallClauseDays) : null;
    typeData.budgetAmount = secondeeMonthlyFee ? Number(secondeeMonthlyFee) : 0;
    typeData.budgetCurrency = budgetCurrency ?? "NGN";
  }

  if (engagementType === "FRACTIONAL") {
    const { fractionalPlacedName, fractionalRoleTitle, fractionalCommissionPct, fractionalArrangementFee, budgetCurrency } = body;
    typeData.fractionalPlacedName = fractionalPlacedName ?? null;
    typeData.fractionalRoleTitle = fractionalRoleTitle ?? null;
    typeData.fractionalCommissionPct = fractionalCommissionPct ? Number(fractionalCommissionPct) : null;
    typeData.fractionalArrangementFee = fractionalArrangementFee ? Number(fractionalArrangementFee) : null;
    typeData.budgetAmount = fractionalArrangementFee ? Number(fractionalArrangementFee) : 0;
    typeData.budgetCurrency = budgetCurrency ?? "NGN";
  }

  if (engagementType === "TRANSFORMATION") {
    const { transformEquityPct, transformDealStructure, transformEntryValuation, transformBoardSeat, transformStepInTrigger, transformExitMonths, budgetCurrency } = body;
    typeData.transformEquityPct = transformEquityPct ? Number(transformEquityPct) : null;
    typeData.transformDealStructure = transformDealStructure ? (transformDealStructure as DealStructure) : null;
    typeData.transformEntryValuation = transformEntryValuation ? Number(transformEntryValuation) : null;
    typeData.transformBoardSeat = transformBoardSeat ?? null;
    typeData.transformStepInTrigger = transformStepInTrigger ? Number(transformStepInTrigger) : null;
    typeData.transformExitMonths = transformExitMonths ? Number(transformExitMonths) : null;
    typeData.budgetAmount = transformEntryValuation ? Number(transformEntryValuation) : 0;
    typeData.budgetCurrency = budgetCurrency ?? "NGN";
  }

  if (engagementType === "TRANSACTION") {
    const { transactionMandateType, transactionTargetCompany, transactionDealSize, transactionSuccessFeePct, transactionUpfrontRetainer, budgetCurrency } = body;
    typeData.transactionMandateType = transactionMandateType ? (transactionMandateType as MandateType) : null;
    typeData.transactionTargetCompany = transactionTargetCompany ?? null;
    typeData.transactionDealSize = transactionDealSize ? Number(transactionDealSize) : null;
    typeData.transactionSuccessFeePct = transactionSuccessFeePct ? Number(transactionSuccessFeePct) : null;
    typeData.transactionUpfrontRetainer = transactionUpfrontRetainer ? Number(transactionUpfrontRetainer) : null;
    // Auto-calculate success fee amount preview but do NOT store yet (only on close)
    typeData.budgetAmount = transactionUpfrontRetainer ? Number(transactionUpfrontRetainer) : 0;
    typeData.budgetCurrency = budgetCurrency ?? "NGN";
  }

  // For non-PROJECT types that didn't set budgetCurrency, default it
  if (!typeData.budgetCurrency) {
    typeData.budgetCurrency = body.budgetCurrency ?? "NGN";
  }
  if (typeData.budgetAmount === undefined) {
    typeData.budgetAmount = 0;
  }

  const createData = {
    client: { connect: { id: clientId } },
    engagementManager: { connect: { id: emId } },
    name,
    description: description ?? null,
    serviceType: serviceType as ServiceType,
    engagementType,
    engagementCode,
    status: (status as EngagementStatus) ?? "PLANNING",
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : (engagementType === "RETAINER" ? null : new Date(Date.now() + 365 * 86400000)),
    budgetAmount: 0,
    budgetCurrency: body.budgetCurrency ?? "NGN",
    riskLevel: (riskLevel as RiskLevel) ?? "LOW",
    healthScore: 5,
    actualSpent: 0,
    notes: notes ?? null,
    ...typeData,
  } as Prisma.EngagementCreateInput;

  const project = await prisma.engagement.create({
    data: createData,
    include: {
      client: { select: { name: true } },
      engagementManager: { select: { name: true } },
    },
  });

  // Auto-generate project phases from methodology template (PROJECT type only)
  if (engagementType === "PROJECT" && body.methodologyId) {
    const methodology = await prisma.methodologyTemplate.findUnique({
      where: { id: body.methodologyId },
      include: { phases: { orderBy: { order: "asc" } } },
    });
    if (methodology) {
      await prisma.engagementPhase.createMany({
        data: methodology.phases.map((p) => ({
          engagementId: project.id,
          name: p.name,
          description: p.description,
          order: p.order,
          status: "PENDING" as const,
          percentComplete: 0,
        })),
      });
    }
  }

  return Response.json({
    ...project,
    budgetAmount: Number(project.budgetAmount),
    actualSpent: Number(project.actualSpent),
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}
