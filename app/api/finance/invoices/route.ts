import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { InvoiceType } from "@prisma/client";

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
  if (Array.isArray(out.lineItemRecords)) {
    out.lineItemRecords = (out.lineItemRecords as Record<string, unknown>[]).map((li) => ({
      ...li,
      quantity: li.quantity != null ? Number(li.quantity) : null,
      unitPrice: li.unitPrice != null ? Number(li.unitPrice) : null,
      amount: li.amount != null ? Number(li.amount) : null,
      createdAt: li.createdAt instanceof Date ? (li.createdAt as Date).toISOString() : li.createdAt,
    }));
  }
  return out;
}

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  category?: string;
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
    invoiceType = "STANDARD",
    lineItems,
    taxRate: taxPercent,
    whtRate: whtRatePct,
    discountAmount: rawDiscount,
    currency = "NGN",
    paymentTermsDays,
    notes,
    clientNotes,
    sendImmediately,
  } = body;

  if (!clientId || !lineItems?.length) {
    return new Response("clientId and lineItems required", { status: 400 });
  }

  for (const item of lineItems as LineItemInput[]) {
    if (!item.description || typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
      return new Response("Each line item needs description, quantity, unitPrice", { status: 400 });
    }
  }

  const validTypes: InvoiceType[] = [
    "STANDARD", "PROFORMA", "CREDIT_NOTE", "DEBIT_NOTE",
    "MOBILIZATION", "MILESTONE", "RETAINER", "FINAL_SETTLEMENT",
  ];
  if (!validTypes.includes(invoiceType)) {
    return new Response("Invalid invoiceType", { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return new Response("Client not found", { status: 404 });

  const subtotal = (lineItems as LineItemInput[]).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice, 0
  );
  const taxRateVal = typeof taxPercent === "number" && taxPercent >= 0 ? taxPercent / 100 : 0;
  const tax = Math.round(subtotal * taxRateVal * 100) / 100;
  const whtRateVal = typeof whtRatePct === "number" && whtRatePct >= 0 ? whtRatePct / 100 : 0;
  const whtAmount = Math.round(subtotal * whtRateVal * 100) / 100;
  const discountAmount = typeof rawDiscount === "number" && rawDiscount >= 0 ? rawDiscount : 0;
  const total = Math.round((subtotal + tax - whtAmount - discountAmount) * 100) / 100;

  // Generate invoice number
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
      return new Response("Failed to generate unique invoice number", { status: 500 });
    }
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (typeof paymentTermsDays === "number" ? paymentTermsDays : 30));

  const invoice = await prisma.invoice.create({
    data: {
      clientId,
      engagementId: engagementId || null,
      invoiceNumber,
      invoiceType: invoiceType as InvoiceType,
      subtotal,
      tax,
      whtAmount,
      discountAmount,
      total,
      paidAmount: 0,
      balanceDue: total,
      currency,
      status: sendImmediately ? "SENT" : "DRAFT",
      issuedDate: sendImmediately ? now : null,
      dueDate,
      notes: notes ?? null,
      clientNotes: clientNotes ?? null,
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
