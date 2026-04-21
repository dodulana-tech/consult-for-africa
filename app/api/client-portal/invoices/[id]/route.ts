import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/client-portal/invoices/[id]
 * Single invoice detail, verified against client's organization.
 */
export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientPortalSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItemRecords: {
        orderBy: { sortOrder: "asc" },
      },
      payments: {
        where: { status: "CONFIRMED" },
        orderBy: { paymentDate: "desc" },
        select: {
          id: true,
          amount: true,
          currency: true,
          paymentDate: true,
          paymentMethod: true,
          reference: true,
          status: true,
          receiptUrl: true,
        },
      },
      engagement: {
        select: { id: true, name: true },
      },
      client: {
        select: { id: true, name: true },
      },
    },
  });

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  // Verify ownership
  if (invoice.clientId !== session.clientId) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    whtAmount: invoice.whtAmount,
    discountAmount: invoice.discountAmount,
    total: invoice.total,
    paidAmount: invoice.paidAmount,
    balanceDue: invoice.balanceDue,
    currency: invoice.currency,
    status: invoice.status,
    issuedDate: invoice.issuedDate,
    dueDate: invoice.dueDate,
    paidDate: invoice.paidDate,
    viewedAt: invoice.viewedAt,
    clientNotes: invoice.clientNotes,
    bankDetails: invoice.bankDetails,
    lineItemRecords: invoice.lineItemRecords.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      amount: li.amount,
      category: li.category,
      sortOrder: li.sortOrder,
    })),
    payments: invoice.payments,
    engagement: invoice.engagement,
    client: invoice.client,
    createdAt: invoice.createdAt,
  });
});

/**
 * PATCH /api/client-portal/invoices/[id]
 * Mark invoice as VIEWED (sets viewedAt if first view).
 */
export const PATCH = handler(async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientPortalSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, clientId: true, status: true, viewedAt: true },
  });

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  if (invoice.clientId !== session.clientId) {
    return new Response("Forbidden", { status: 403 });
  }

  // Only update status to VIEWED if currently SENT (first view)
  const updates: Record<string, unknown> = {};

  if (!invoice.viewedAt) {
    updates.viewedAt = new Date();
  }

  if (invoice.status === "SENT") {
    updates.status = "VIEWED";
  }

  if (Object.keys(updates).length > 0) {
    await prisma.invoice.update({
      where: { id },
      data: updates,
    });
  }

  return Response.json({ ok: true });
});
