import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { InvoiceType, Prisma } from "@prisma/client";

/* ── Invoice number prefix map ─────────────────────────────────────────────── */

const PREFIX_MAP: Record<string, string> = {
  STANDARD: "CFA-INV",
  PROFORMA: "CFA-PRO",
  CREDIT_NOTE: "CFA-CN",
  DEBIT_NOTE: "CFA-DN",
  MOBILIZATION: "CFA-MOB",
  MILESTONE: "CFA-MS",
  RETAINER: "CFA-RET",
  FINAL_SETTLEMENT: "CFA-FS",
};

/* ── Serialise Decimal fields for JSON responses ───────────────────────────── */

function serialise(inv: Record<string, unknown>) {
  const decimalFields = [
    "subtotal", "tax", "whtAmount", "discountAmount",
    "total", "paidAmount", "balanceDue",
  ];
  const dateFields = [
    "issuedDate", "dueDate", "paidDate", "viewedAt", "approvedAt",
    "billingPeriodStart", "billingPeriodEnd", "createdAt", "updatedAt",
  ];
  const out: Record<string, unknown> = { ...inv };
  for (const f of decimalFields) {
    if (out[f] != null) out[f] = Number(out[f]);
  }
  for (const f of dateFields) {
    if (out[f] instanceof Date) out[f] = (out[f] as Date).toISOString();
    else if (out[f] == null) out[f] = null;
  }

  // Serialise nested line item records
  if (Array.isArray(out.lineItemRecords)) {
    out.lineItemRecords = (out.lineItemRecords as Record<string, unknown>[]).map((li) => ({
      ...li,
      quantity: li.quantity != null ? Number(li.quantity) : null,
      unitPrice: li.unitPrice != null ? Number(li.unitPrice) : null,
      amount: li.amount != null ? Number(li.amount) : null,
      createdAt: li.createdAt instanceof Date ? (li.createdAt as Date).toISOString() : li.createdAt,
    }));
  }

  // Serialise nested payments
  if (Array.isArray(out.payments)) {
    out.payments = (out.payments as Record<string, unknown>[]).map((p) => ({
      ...p,
      amount: p.amount != null ? Number(p.amount) : null,
      paymentDate: p.paymentDate instanceof Date ? (p.paymentDate as Date).toISOString() : p.paymentDate,
      confirmedAt: p.confirmedAt instanceof Date ? (p.confirmedAt as Date).toISOString() : p.confirmedAt,
      createdAt: p.createdAt instanceof Date ? (p.createdAt as Date).toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? (p.updatedAt as Date).toISOString() : p.updatedAt,
    }));
  }

  return out;
}

/* ── GET: list invoices with filters + optional summary ────────────────────── */

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";

  if (!isElevated && !isEM) return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const engagementId = searchParams.get("engagementId") || searchParams.get("projectId");
  const status = searchParams.get("status");
  const invoiceType = searchParams.get("invoiceType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const summary = searchParams.get("summary");

  const where: Prisma.InvoiceWhereInput = {};
  if (clientId) where.clientId = clientId;
  if (engagementId) where.engagementId = engagementId;
  if (status) where.status = status as Prisma.InvoiceWhereInput["status"];
  if (invoiceType) where.invoiceType = invoiceType as InvoiceType;

  if (dateFrom || dateTo) {
    where.issuedDate = {};
    if (dateFrom) (where.issuedDate as Prisma.DateTimeNullableFilter).gte = new Date(dateFrom);
    if (dateTo) (where.issuedDate as Prisma.DateTimeNullableFilter).lte = new Date(dateTo);
  }

  // EMs can only see invoices for their engagements
  if (isEM) {
    where.engagement = { engagementManagerId: session.user.id };
  }

  // ── Summary mode: dashboard stats ──────────────────────────────────────────
  if (summary === "true") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [outstanding, overdue, collectedThisMonth, draftCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...where, status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] } },
        _sum: { balanceDue: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: "OVERDUE" },
        _sum: { balanceDue: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: {
          invoice: where,
          status: "CONFIRMED",
          paymentDate: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { ...where, status: "DRAFT" },
      }),
    ]);

    return Response.json({
      totalOutstanding: Number(outstanding._sum.balanceDue ?? 0),
      outstandingCount: outstanding._count,
      totalOverdue: Number(overdue._sum.balanceDue ?? 0),
      overdueCount: overdue._count,
      collectedThisMonth: Number(collectedThisMonth._sum.amount ?? 0),
      draftCount,
    });
  }

  // ── Standard list ──────────────────────────────────────────────────────────
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      engagement: { select: { id: true, name: true } },
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json(invoices.map((inv) => serialise(inv as unknown as Record<string, unknown>)));
}

/* ── POST: create invoice with InvoiceLineItem records ─────────────────────── */

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  paymentMilestoneId?: string;
  timeEntryIds?: string[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const body = await req.json();
  const {
    clientId,
    engagementId,
    projectId, // alias
    invoiceType = "STANDARD",
    lineItems,
    taxPercent,
    whtRatePct,
    discountAmount: rawDiscount,
    currency = "NGN",
    dueInDays,
    notes,
    clientNotes,
    billingScheduleId,
    billingPeriodStart,
    billingPeriodEnd,
    bankDetails,
  } = body;

  const engId = engagementId || projectId || null;

  if (!clientId || !lineItems?.length) {
    return new Response("clientId and lineItems required", { status: 400 });
  }

  // Validate line items
  for (const item of lineItems as LineItemInput[]) {
    if (!item.description || typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
      return new Response("Each line item needs description, quantity, unitPrice", { status: 400 });
    }
    if (item.quantity <= 0) {
      return new Response("Quantity must be greater than zero", { status: 400 });
    }
    if (item.unitPrice < 0) {
      return new Response("Unit price cannot be negative", { status: 400 });
    }
  }

  // Validate invoiceType
  const validTypes: InvoiceType[] = [
    "STANDARD", "PROFORMA", "CREDIT_NOTE", "DEBIT_NOTE",
    "MOBILIZATION", "MILESTONE", "RETAINER", "FINAL_SETTLEMENT",
  ];
  if (!validTypes.includes(invoiceType)) {
    return new Response("Invalid invoiceType", { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return new Response("Client not found", { status: 404 });

  // Compute amounts
  const subtotal = (lineItems as LineItemInput[]).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxRate = typeof taxPercent === "number" && taxPercent >= 0 ? taxPercent / 100 : 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const whtRate = typeof whtRatePct === "number" && whtRatePct >= 0 ? whtRatePct / 100 : 0;
  const whtAmount = Math.round(subtotal * whtRate * 100) / 100;
  const discountAmount = typeof rawDiscount === "number" && rawDiscount >= 0 ? rawDiscount : 0;
  const total = Math.round((subtotal + tax - whtAmount - discountAmount) * 100) / 100;
  const balanceDue = total;

  // Generate invoice number with race-condition retry
  const now = new Date();
  const year = now.getFullYear();
  const typePrefix = PREFIX_MAP[invoiceType] || "CFA-INV";
  const searchPrefix = `${typePrefix}-${year}`;

  let invoiceNumber: string;
  let attempts = 0;
  while (true) {
    const count = await prisma.invoice.count({
      where: { invoiceNumber: { startsWith: searchPrefix } },
    });
    invoiceNumber = `${searchPrefix}-${String(count + 1).padStart(4, "0")}`;

    const exists = await prisma.invoice.findFirst({
      where: { invoiceNumber },
      select: { id: true },
    });
    if (!exists) break;

    attempts++;
    if (attempts > 10) {
      return new Response("Failed to generate unique invoice number. Try again.", { status: 500 });
    }
  }

  // Compute due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (typeof dueInDays === "number" ? dueInDays : 30));

  // Create invoice + line items in a transaction
  const invoice = await prisma.invoice.create({
    data: {
      clientId,
      engagementId: engId,
      invoiceNumber,
      invoiceType: invoiceType as InvoiceType,
      subtotal,
      tax,
      whtAmount,
      discountAmount,
      total,
      paidAmount: 0,
      balanceDue,
      currency,
      status: "DRAFT",
      dueDate,
      notes: notes ?? null,
      clientNotes: clientNotes ?? null,
      billingScheduleId: billingScheduleId ?? null,
      billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : null,
      billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : null,
      bankDetails: bankDetails ?? null,
      lineItems: (lineItems as LineItemInput[]).map((item, i) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
        sortOrder: i,
      })),
      lineItemRecords: {
        create: (lineItems as LineItemInput[]).map((item, i) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          sortOrder: i,
          category: item.category ?? null,
          paymentMilestoneId: item.paymentMilestoneId ?? null,
          timeEntryIds: item.timeEntryIds ?? [],
        })),
      },
    },
    include: {
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
      client: { select: { id: true, name: true } },
      engagement: { select: { id: true, name: true } },
    },
  });

  return Response.json(serialise(invoice as unknown as Record<string, unknown>), { status: 201 });
}
