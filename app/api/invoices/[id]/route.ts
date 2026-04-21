import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serialise } from "@/lib/serialization";
import { ELEVATED_ROLES, EM_AND_ABOVE } from "@/lib/constants";
import { NextRequest } from "next/server";
import type { InvoiceStatus, Prisma } from "@prisma/client";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

/* ── Approval threshold ────────────────────────────────────────────────────── */

const APPROVAL_THRESHOLD: Record<string, number> = {
  NGN: 5_000_000,
  USD: 5_000,
};

/* ── Valid status transitions ──────────────────────────────────────────────── */

type TransitionCheck = {
  from: InvoiceStatus[];
  requireRole?: string[];
  auto?: boolean;
};

const STATUS_TRANSITIONS: Record<string, TransitionCheck> = {
  DRAFT: { from: ["SENT", "PENDING_APPROVAL"], requireRole: ["DIRECTOR", "PARTNER", "ADMIN"] },
  PENDING_APPROVAL: { from: ["DRAFT"] },
  SENT: { from: ["DRAFT", "PENDING_APPROVAL"] },
  VIEWED: { from: ["SENT"] },
  PARTIALLY_PAID: { from: ["SENT", "VIEWED"], auto: true },
  PAID: { from: ["PARTIALLY_PAID"], auto: true },
  OVERDUE: { from: ["SENT", "VIEWED", "PARTIALLY_PAID"] },
  CANCELLED: { from: ["DRAFT", "PENDING_APPROVAL", "SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE", "DISPUTED"] },
  DISPUTED: { from: ["OVERDUE"] },
  WRITTEN_OFF: { from: ["OVERDUE", "DISPUTED"], requireRole: ["PARTNER"] },
};

/* ── GET: full invoice detail ──────────────────────────────────────────────── */

export const GET = handler(async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isElevated = ELEVATED_ROLES.includes(session.user.role as typeof ELEVATED_ROLES[number]);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";
  if (!isElevated && !isEM) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true, primaryContact: true, address: true, paymentTerms: true } },
      engagement: { select: { id: true, name: true, serviceType: true, engagementManagerId: true } },
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paymentDate: "desc" } },
      reminders: { orderBy: { sentAt: "desc" } },
      creditNotesIssued: true,
      billingSchedule: true,
      approvedBy: { select: { id: true, name: true } },
    },
  });

  if (!invoice) return new Response("Not found", { status: 404 });

  // IDOR check for EMs
  if (isEM && invoice.engagement?.engagementManagerId !== session.user.id) {
    // Need to re-fetch with EM check
    const withEM = await prisma.invoice.findUnique({
      where: { id },
      select: { engagement: { select: { engagementManagerId: true } } },
    });
    if (!withEM?.engagement || withEM.engagement.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return Response.json(serialise(invoice));
});

/* ── PATCH: status transitions + draft editing ─────────────────────────────── */

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canUpdate = EM_AND_ABOVE.includes(session.user.role as typeof EM_AND_ABOVE[number]);
  if (!canUpdate) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const isElevated = ELEVATED_ROLES.includes(session.user.role as typeof ELEVATED_ROLES[number]);

  // Fetch existing invoice
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: {
      engagement: { select: { engagementManagerId: true } },
      lineItemRecords: true,
    },
  });
  if (!existing) return new Response("Not found", { status: 404 });

  // IDOR: verify ownership for non-elevated roles
  if (!isElevated) {
    if (!existing.engagement || existing.engagement.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const body = await req.json();
  const { status, lineItems, notes, clientNotes, dueDate, billingPeriodStart, billingPeriodEnd, taxRate: bodyTaxRate, whtRate: bodyWhtRate, discountAmount: bodyDiscount } = body;

  const data: Prisma.InvoiceUpdateInput = {};

  // ── Status transition ─────────────────────────────────────────────────────
  if (status && status !== existing.status) {
    const transition = STATUS_TRANSITIONS[status as string];
    if (!transition) {
      return new Response(`Invalid target status: ${status}`, { status: 400 });
    }

    if (!transition.from.includes(existing.status)) {
      return new Response(
        `Cannot transition from ${existing.status} to ${status}`,
        { status: 400 }
      );
    }

    // Role checks for specific transitions
    if (transition.requireRole && !transition.requireRole.includes(session.user.role)) {
      return new Response(
        `Only ${transition.requireRole.join("/")} can set status to ${status}`,
        { status: 403 }
      );
    }

    // PENDING_APPROVAL: only if above threshold
    if (status === "PENDING_APPROVAL") {
      const threshold = APPROVAL_THRESHOLD[existing.currency] ?? APPROVAL_THRESHOLD.NGN;
      if (Number(existing.total) <= threshold) {
        return new Response(
          `Invoice total is below the approval threshold (${existing.currency} ${threshold.toLocaleString()}). Send directly instead.`,
          { status: 400 }
        );
      }
    }

    // SENT: check approval requirement
    if (status === "SENT") {
      if (existing.status === "DRAFT") {
        const threshold = APPROVAL_THRESHOLD[existing.currency] ?? APPROVAL_THRESHOLD.NGN;
        if (Number(existing.total) > threshold && !existing.approvedById) {
          return new Response(
            `Invoice total exceeds ${existing.currency} ${threshold.toLocaleString()}. Requires approval before sending.`,
            { status: 400 }
          );
        }
      }
      if (existing.status === "PENDING_APPROVAL") {
        // Must be Director+ to approve and send
        if (!isElevated) {
          return new Response("Director or above required to approve invoices", { status: 403 });
        }
        data.approvedBy = { connect: { id: session.user.id } };
        data.approvedAt = new Date();
      }
      data.issuedDate = existing.issuedDate ?? new Date();
    }

    if (status === "VIEWED") {
      data.viewedAt = new Date();
    }

    if (status === "PAID") {
      data.paidDate = new Date();
    }

    data.status = status as InvoiceStatus;
  }

  // ── Draft editing: line items, notes, dates ───────────────────────────────
  if (existing.status === "DRAFT") {
    if (notes !== undefined) data.notes = notes;
    if (clientNotes !== undefined) data.clientNotes = clientNotes;
    if (dueDate) data.dueDate = new Date(dueDate);
    if (billingPeriodStart) data.billingPeriodStart = new Date(billingPeriodStart);
    if (billingPeriodEnd) data.billingPeriodEnd = new Date(billingPeriodEnd);

    // Update line items if provided
    if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
      // Validate
      for (const item of lineItems) {
        if (!item.description || typeof item.quantity !== "number" || typeof item.unitPrice !== "number") {
          return new Response("Each line item needs description, quantity, unitPrice", { status: 400 });
        }
        if (item.quantity <= 0) return new Response("Quantity must be greater than zero", { status: 400 });
        if (item.unitPrice < 0) return new Response("Unit price cannot be negative", { status: 400 });
      }

      // Recalculate amounts - use explicit rates if provided, else derive from existing
      const subtotal = lineItems.reduce(
        (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
        0
      );
      const taxRate = typeof bodyTaxRate === "number" ? bodyTaxRate / 100 : Number(existing.tax) / (Number(existing.subtotal) || 1);
      const tax = Math.round(subtotal * taxRate * 100) / 100;
      const whtRate = typeof bodyWhtRate === "number" ? bodyWhtRate / 100 : Number(existing.whtAmount) / (Number(existing.subtotal) || 1);
      const whtAmount = Math.round(subtotal * whtRate * 100) / 100;
      const discountAmount = typeof bodyDiscount === "number" ? bodyDiscount : Number(existing.discountAmount);
      const total = Math.round((subtotal + tax - whtAmount - discountAmount) * 100) / 100;

      data.subtotal = subtotal;
      data.tax = tax;
      data.whtAmount = whtAmount;
      data.discountAmount = discountAmount;
      data.total = total;
      data.balanceDue = total - Number(existing.paidAmount);
      data.lineItems = lineItems.map((item: { description: string; quantity: number; unitPrice: number }, i: number) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
        sortOrder: i,
      }));

      // Delete existing line item records and recreate
      await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
      data.lineItemRecords = {
        create: lineItems.map((item: { description: string; quantity: number; unitPrice: number; category?: string; paymentMilestoneId?: string; timeEntryIds?: string[] }, i: number) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          sortOrder: i,
          category: item.category ?? null,
          paymentMilestoneId: item.paymentMilestoneId ?? null,
          timeEntryIds: item.timeEntryIds ?? [],
        })),
      };
    }
  } else if (lineItems) {
    return new Response("Line items can only be edited on DRAFT invoices", { status: 400 });
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data,
    include: {
      client: { select: { id: true, name: true } },
      engagement: { select: { id: true, name: true } },
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  return Response.json(serialise(invoice));
});
