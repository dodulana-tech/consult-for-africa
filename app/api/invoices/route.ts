import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serialise } from "@/lib/serialization";
import { ELEVATED_ROLES, EM_AND_ABOVE } from "@/lib/constants";
import { NextRequest } from "next/server";
import type { InvoiceType, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { handler } from "@/lib/api-handler";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  category: z.string().optional(),
  paymentMilestoneId: z.string().optional(),
  timeEntryIds: z.array(z.string()).optional(),
});

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  engagementId: z.string().optional(),
  projectId: z.string().optional(),
  invoiceType: z.enum([
    "STANDARD", "PROFORMA", "CREDIT_NOTE", "DEBIT_NOTE",
    "MOBILIZATION", "MILESTONE", "RETAINER", "FINAL_SETTLEMENT",
  ]).optional().default("STANDARD"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  taxPercent: z.number().min(0).optional(),
  whtRatePct: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  currency: z.enum(["USD", "NGN"]).optional().default("NGN"),
  dueInDays: z.number().optional(),
  notes: z.string().nullable().optional(),
  clientNotes: z.string().nullable().optional(),
  billingScheduleId: z.string().nullable().optional(),
  billingPeriodStart: z.string().nullable().optional(),
  billingPeriodEnd: z.string().nullable().optional(),
  bankDetails: z.any().nullable().optional(),
});

/* ── Invoice number prefix map ─────────────────────────────────────────────── */

const PREFIX_MAP: Record<string, string> = {
  STANDARD: "C4A-INV",
  PROFORMA: "C4A-PRO",
  CREDIT_NOTE: "C4A-CN",
  DEBIT_NOTE: "C4A-DN",
  MOBILIZATION: "C4A-MOB",
  MILESTONE: "C4A-MS",
  RETAINER: "C4A-RET",
  FINAL_SETTLEMENT: "C4A-FS",
};

/* ── GET: list invoices with filters + optional summary ────────────────────── */

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isElevated = ELEVATED_ROLES.includes(session.user.role as typeof ELEVATED_ROLES[number]);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";

  if (!isElevated && !isEM) return Response.json({ error: "Forbidden" }, { status: 403 });

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

  return Response.json(invoices.map((inv) => serialise(inv)));
});

/* ── POST: create invoice with InvoiceLineItem records ─────────────────────── */

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  paymentMilestoneId?: string;
  timeEntryIds?: string[];
}

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = EM_AND_ABOVE.includes(session.user.role as typeof EM_AND_ABOVE[number]);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createInvoiceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    clientId,
    engagementId,
    projectId,
    invoiceType,
    lineItems,
    taxPercent,
    whtRatePct,
    discountAmount: rawDiscount,
    currency,
    dueInDays,
    notes,
    clientNotes,
    billingScheduleId,
    billingPeriodStart,
    billingPeriodEnd,
    bankDetails,
  } = parsed.data;

  const engId = engagementId || projectId || null;

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  // Compute amounts using Decimal to avoid floating-point precision loss
  const subtotal = (lineItems as LineItemInput[]).reduce(
    (sum, item) => sum.add(new Decimal(item.quantity).mul(new Decimal(item.unitPrice))),
    new Decimal(0)
  );
  const taxRate = typeof taxPercent === "number" && taxPercent >= 0
    ? new Decimal(taxPercent).div(100)
    : new Decimal(0);
  const tax = subtotal.mul(taxRate);
  const whtRate = typeof whtRatePct === "number" && whtRatePct >= 0
    ? new Decimal(whtRatePct).div(100)
    : new Decimal(0);
  const whtAmount = subtotal.mul(whtRate);
  const discountAmount = typeof rawDiscount === "number" && rawDiscount >= 0
    ? new Decimal(rawDiscount)
    : new Decimal(0);
  const total = subtotal.add(tax).sub(whtAmount).sub(discountAmount);
  const balanceDue = total;

  // Generate invoice number + create invoice atomically to prevent race conditions
  const now = new Date();
  const year = now.getFullYear();
  const typePrefix = PREFIX_MAP[invoiceType] || "C4A-INV";
  const searchPrefix = `${typePrefix}-${year}`;

  // Compute due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (typeof dueInDays === "number" ? dueInDays : 30));

  const lineItemData = (lineItems as LineItemInput[]).map((item, i) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: new Decimal(item.quantity).mul(new Decimal(item.unitPrice)),
    sortOrder: i,
    category: item.category ?? null,
    paymentMilestoneId: item.paymentMilestoneId ?? null,
    timeEntryIds: item.timeEntryIds ?? [],
  }));

  let invoice;
  let attempts = 0;

  while (attempts < 10) {
    try {
      invoice = await prisma.$transaction(async (tx) => {
        // Count existing invoices for this prefix inside the transaction
        const count = await tx.invoice.count({
          where: { invoiceNumber: { startsWith: searchPrefix } },
        });

        let invoiceNumber = `${searchPrefix}-${String(count + 1).padStart(4, "0")}`;

        // Double-check uniqueness (handles edge cases like deleted invoices)
        const exists = await tx.invoice.findFirst({
          where: { invoiceNumber },
          select: { id: true },
        });

        if (exists) {
          // Find actual max sequence to recover from gaps/collisions
          const latest = await tx.invoice.findMany({
            where: { invoiceNumber: { startsWith: searchPrefix } },
            select: { invoiceNumber: true },
            orderBy: { invoiceNumber: "desc" },
            take: 1,
          });

          let nextSeq = count + 2;
          if (latest.length > 0) {
            const lastSeq = parseInt(latest[0].invoiceNumber.split("-").pop() ?? "0", 10);
            nextSeq = lastSeq + 1;
          }

          invoiceNumber = `${searchPrefix}-${String(nextSeq).padStart(4, "0")}`;
        }

        return tx.invoice.create({
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
            lineItems: lineItemData.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              amount: li.amount.toNumber(),
              sortOrder: li.sortOrder,
            })),
            lineItemRecords: {
              create: lineItemData,
            },
          },
          include: {
            lineItemRecords: { orderBy: { sortOrder: "asc" } },
            client: { select: { id: true, name: true } },
            engagement: { select: { id: true, name: true } },
          },
        });
      }, {
        isolationLevel: "Serializable",
      });

      break; // success, exit retry loop
    } catch (err: unknown) {
      attempts++;
      const message = err instanceof Error ? err.message : String(err);
      const isRetryable =
        message.includes("P2002") ||
        message.includes("could not serialize") ||
        message.includes("deadlock");

      if (!isRetryable || attempts >= 10) {
        console.error("[invoices] Failed to create invoice after retries:", err);
        return Response.json({ error: "Failed to generate unique invoice number. Try again." }, { status: 500 });
      }
      // Brief exponential backoff before retry
      await new Promise((r) => setTimeout(r, 50 * attempts));
    }
  }

  if (!invoice) {
    return Response.json({ error: "Failed to generate unique invoice number. Try again." }, { status: 500 });
  }

  return Response.json(serialise(invoice as unknown as Record<string, unknown>), { status: 201 });
});
