import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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
 * POST /api/own-gig — create an own gig engagement
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "CONSULTANT") {
    return Response.json({ error: "Only consultants can create own gigs" }, { status: 403 });
  }

  const body = await req.json();
  const {
    clientName, clientEmail, clientPhone, clientContactName,
    projectName, description, serviceType,
    engagementType: rawType,
    startDate, budgetAmount, budgetCurrency,
    feeModel, feePct, flatMonthlyFee,
  } = body;

  if (!clientName || !clientEmail || !clientContactName || !projectName || !serviceType) {
    return Response.json({ error: "clientName, clientEmail, clientContactName, projectName, and serviceType are required" }, { status: 400 });
  }

  if (!feeModel || !["PERCENTAGE", "FLAT_MONTHLY"].includes(feeModel)) {
    return Response.json({ error: "feeModel must be PERCENTAGE or FLAT_MONTHLY" }, { status: 400 });
  }

  if (feeModel === "PERCENTAGE" && (!feePct || feePct < 10 || feePct > 15)) {
    return Response.json({ error: "feePct must be between 10 and 15" }, { status: 400 });
  }

  if (feeModel === "FLAT_MONTHLY" && (!flatMonthlyFee || flatMonthlyFee <= 0)) {
    return Response.json({ error: "flatMonthlyFee is required for FLAT_MONTHLY model" }, { status: 400 });
  }

  const engagementType = rawType ?? "PROJECT";

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

    // Create engagement
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
      },
    });

    // Auto-assign consultant as lead
    await tx.assignment.create({
      data: {
        engagementId: engagement.id,
        consultantId: session.user.id,
        role: "Lead Consultant",
        responsibilities: "Own gig lead — full project delivery",
        status: "ACTIVE",
        startDate: startDate ? new Date(startDate) : new Date(),
        rateAmount: 0,
        rateCurrency: budgetCurrency ?? "NGN",
        rateType: "FIXED_PROJECT",
      },
    });

    return engagement;
  });

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
      createdAt: true,
      client: { select: { id: true, name: true } },
      ownGigOwner: { select: { id: true, name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(gigs);
}
