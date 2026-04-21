import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { FeeStructure, BillingCycle } from "@prisma/client";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

function serialise(bs: Record<string, unknown>) {
  const decimalFields = [
    "totalContractValue", "mobilizationPct", "mobilizationFixed",
    "holdbackPct", "successFeePct", "retainerAmount",
    "taxRatePct", "whtRatePct",
  ];
  const dateFields = ["createdAt", "updatedAt"];
  const out: Record<string, unknown> = { ...bs };
  for (const f of decimalFields) {
    if (out[f] != null) out[f] = Number(out[f]);
  }
  for (const f of dateFields) {
    if (out[f] instanceof Date) out[f] = (out[f] as Date).toISOString();
  }
  return out;
}

/* ── GET: billing schedule for engagement ──────────────────────────────────── */

export const GET = handler(async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canView = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canView) return new Response("Forbidden", { status: 403 });

  const { id: engagementId } = await params;

  // IDOR for EMs
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    const eng = await prisma.engagement.findUnique({
      where: { id: engagementId },
      select: { engagementManagerId: true },
    });
    if (!eng || eng.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const schedules = await prisma.billingSchedule.findMany({
    where: { engagementId },
    include: {
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          invoiceType: true,
          status: true,
          total: true,
          balanceDue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    schedules.map((bs) => {
      const out = serialise(bs as unknown as Record<string, unknown>);
      if (Array.isArray(out.invoices)) {
        out.invoices = (out.invoices as Record<string, unknown>[]).map((inv) => ({
          ...inv,
          total: inv.total != null ? Number(inv.total) : null,
          balanceDue: inv.balanceDue != null ? Number(inv.balanceDue) : null,
        }));
      }
      return out;
    })
  );
});

/* ── POST: create billing schedule (Director+ only) ────────────────────────── */

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) return new Response("Only Directors and above can create billing schedules", { status: 403 });

  const { id: engagementId } = await params;

  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    select: { id: true },
  });
  if (!engagement) return new Response("Engagement not found", { status: 404 });

  const body = await req.json();
  const {
    feeStructure,
    billingCycle,
    totalContractValue,
    currency = "NGN",
    mobilizationPct,
    mobilizationFixed,
    holdbackPct,
    successFeePct,
    successFeeTrigger,
    retainerAmount,
    paymentTermsDays = 30,
    taxRatePct = 0,
    whtRatePct = 0,
    notes,
  } = body;

  if (!feeStructure || !billingCycle || !totalContractValue) {
    return new Response("feeStructure, billingCycle, and totalContractValue are required", { status: 400 });
  }

  const validFee: FeeStructure[] = ["FIXED_FEE", "TIME_AND_MATERIALS", "RETAINER", "SUCCESS_FEE", "MILESTONE_BASED", "HYBRID"];
  const validCycle: BillingCycle[] = ["ONE_TIME", "MONTHLY", "QUARTERLY", "ON_MILESTONE", "ON_COMPLETION"];
  if (!validFee.includes(feeStructure)) return new Response("Invalid feeStructure", { status: 400 });
  if (!validCycle.includes(billingCycle)) return new Response("Invalid billingCycle", { status: 400 });

  if (typeof totalContractValue !== "number" || totalContractValue <= 0) {
    return new Response("totalContractValue must be a positive number", { status: 400 });
  }

  const schedule = await prisma.billingSchedule.create({
    data: {
      engagementId,
      feeStructure: feeStructure as FeeStructure,
      billingCycle: billingCycle as BillingCycle,
      totalContractValue,
      currency,
      mobilizationPct: mobilizationPct ?? null,
      mobilizationFixed: mobilizationFixed ?? null,
      holdbackPct: holdbackPct ?? null,
      successFeePct: successFeePct ?? null,
      successFeeTrigger: successFeeTrigger ?? null,
      retainerAmount: retainerAmount ?? null,
      paymentTermsDays,
      taxRatePct,
      whtRatePct,
      notes: notes ?? null,
    },
  });

  // Also update engagement feeStructure if not set
  await prisma.engagement.update({
    where: { id: engagementId },
    data: { feeStructure: feeStructure as FeeStructure },
  });

  return Response.json(serialise(schedule as unknown as Record<string, unknown>), { status: 201 });
});

/* ── PATCH: update billing schedule ────────────────────────────────────────── */

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) return new Response("Only Directors and above can update billing schedules", { status: 403 });

  const { id: engagementId } = await params;

  const body = await req.json();
  const { scheduleId, ...updates } = body;

  if (!scheduleId) {
    return new Response("scheduleId is required", { status: 400 });
  }

  // Verify schedule belongs to this engagement
  const schedule = await prisma.billingSchedule.findFirst({
    where: { id: scheduleId, engagementId },
  });
  if (!schedule) return new Response("Billing schedule not found for this engagement", { status: 404 });

  const allowedFields = [
    "feeStructure", "billingCycle", "totalContractValue", "currency",
    "mobilizationPct", "mobilizationFixed", "holdbackPct",
    "successFeePct", "successFeeTrigger", "retainerAmount",
    "paymentTermsDays", "taxRatePct", "whtRatePct", "notes", "isActive",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      data[key] = updates[key];
    }
  }

  const updated = await prisma.billingSchedule.update({
    where: { id: scheduleId },
    data,
  });

  return Response.json(serialise(updated as unknown as Record<string, unknown>));
});
