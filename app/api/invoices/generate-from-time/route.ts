import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { engagementId, periodStart, periodEnd, trackId } = await req.json();

  if (!engagementId || !periodStart || !periodEnd) {
    return Response.json({ error: "engagementId, periodStart, and periodEnd are required" }, { status: 400 });
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return Response.json({ error: "Invalid date format" }, { status: 400 });
  }
  if (start >= end) {
    return Response.json({ error: "periodStart must be before periodEnd" }, { status: 400 });
  }

  // Fetch engagement + client
  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    include: {
      client: { select: { id: true, name: true, paymentTerms: true, currency: true } },
    },
  });
  if (!engagement) return Response.json({ error: "Engagement not found" }, { status: 404 });

  // IDOR check for EMs
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated && engagement.engagementManagerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate trackId belongs to this engagement if provided
  if (trackId) {
    const track = await prisma.engagementTrack.findFirst({
      where: { id: trackId, engagementId },
    });
    if (!track) {
      return Response.json({ error: "Track not found or does not belong to this engagement" }, { status: 400 });
    }
  }

  // Find APPROVED time entries in the period that are not already invoiced
  // "Not already invoiced" = not referenced in any InvoiceLineItem.timeEntryIds
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      assignment: { engagementId },
      status: "APPROVED",
      date: { gte: start, lte: end },
      isForBilling: true,
      ...(trackId ? { trackId } : {}),
    },
    include: {
      consultant: { select: { id: true, name: true } },
      assignment: { select: { rateAmount: true, rateCurrency: true, rateType: true } },
      track: { select: { name: true } },
    },
  });

  if (timeEntries.length === 0) {
    return Response.json({ error: "No approved billable time entries found for this period" }, { status: 400 });
  }

  // Check which time entries are already invoiced
  const existingLineItems = await prisma.invoiceLineItem.findMany({
    where: {
      invoice: { engagementId, status: { notIn: ["CANCELLED", "WRITTEN_OFF"] } },
      timeEntryIds: { isEmpty: false },
    },
    select: { timeEntryIds: true },
  });

  const invoicedIds = new Set(existingLineItems.flatMap((li) => li.timeEntryIds));
  const uninvoiced = timeEntries.filter((te) => !invoicedIds.has(te.id));

  if (uninvoiced.length === 0) {
    return Response.json({ error: "All time entries in this period have already been invoiced" }, { status: 400 });
  }

  // Group by consultant + track
  const byConsultantTrack = new Map<string, {
    name: string;
    hours: Decimal;
    rate: Decimal;
    currency: string;
    entryIds: string[];
    trackName: string | null;
  }>();

  for (const te of uninvoiced) {
    const trackName = te.track?.name ?? null;
    const key = `${te.consultantId}::${trackName ?? "__none__"}`;
    const existing = byConsultantTrack.get(key);
    const hours = new Decimal(te.hours as unknown as Decimal);
    const rate = new Decimal(te.assignment.rateAmount as unknown as Decimal);

    if (existing) {
      existing.hours = existing.hours.add(hours);
      existing.entryIds.push(te.id);
    } else {
      byConsultantTrack.set(key, {
        name: te.consultant.name,
        hours,
        rate,
        currency: te.assignment.rateCurrency,
        entryIds: [te.id],
        trackName,
      });
    }
  }

  // Build line items
  const lineItemsData = Array.from(byConsultantTrack.values()).map((c, i) => {
    const amount = c.hours.mul(c.rate);
    return {
      description: `Consulting services - ${c.name}${c.trackName ? ` [${c.trackName}]` : ""} - ${c.hours.toFixed(1)}h @ ${c.currency === "USD" ? "$" : "\u20A6"}${c.rate.toNumber().toLocaleString()}`,
      quantity: c.hours,
      unitPrice: c.rate,
      amount,
      sortOrder: i,
      category: "consulting_fee",
      timeEntryIds: c.entryIds,
    };
  });

  const subtotal = lineItemsData.reduce((sum, li) => sum.add(li.amount), new Decimal(0));
  const currency = engagement.client.currency;

  // Check for billing schedule to get tax/WHT rates
  const billingSchedule = await prisma.billingSchedule.findFirst({
    where: { engagementId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const taxRate = billingSchedule
    ? new Decimal(billingSchedule.taxRatePct ?? 0).div(100)
    : new Decimal(0);
  const whtRate = billingSchedule
    ? new Decimal(billingSchedule.whtRatePct ?? 0).div(100)
    : new Decimal(0);
  const tax = subtotal.mul(taxRate);
  const whtAmount = subtotal.mul(whtRate);
  const total = subtotal.add(tax).sub(whtAmount);

  // Generate invoice number
  const year = new Date().getFullYear();
  const searchPrefix = `C4A-INV-${year}`;

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
      return Response.json({ error: "Failed to generate unique invoice number. Try again." }, { status: 500 });
    }
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (engagement.client.paymentTerms ?? 30));

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      clientId: engagement.clientId,
      engagementId,
      invoiceNumber,
      invoiceType: "STANDARD",
      subtotal,
      tax,
      whtAmount,
      discountAmount: 0,
      total,
      paidAmount: 0,
      balanceDue: total,
      currency,
      status: "DRAFT",
      dueDate,
      billingScheduleId: billingSchedule?.id ?? null,
      billingPeriodStart: start,
      billingPeriodEnd: end,
      notes: `Auto-generated from time entries for period ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
      lineItems: lineItemsData.map((li) => ({
        description: li.description,
        quantity: li.quantity.toNumber(),
        unitPrice: li.unitPrice.toNumber(),
        amount: li.amount.toNumber(),
        sortOrder: li.sortOrder,
      })),
      lineItemRecords: {
        create: lineItemsData,
      },
    },
    include: {
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
      client: { select: { id: true, name: true } },
      engagement: { select: { id: true, name: true } },
    },
  });

  return Response.json(
    {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      whtAmount: Number(invoice.whtAmount),
      discountAmount: Number(invoice.discountAmount),
      total: Number(invoice.total),
      paidAmount: Number(invoice.paidAmount),
      balanceDue: Number(invoice.balanceDue),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      billingPeriodStart: invoice.billingPeriodStart?.toISOString() ?? null,
      billingPeriodEnd: invoice.billingPeriodEnd?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      timeEntriesLinked: uninvoiced.length,
      lineItemRecords: invoice.lineItemRecords.map((li) => ({
        ...li,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        amount: Number(li.amount),
        createdAt: li.createdAt.toISOString(),
      })),
    },
    { status: 201 }
  );
});
