import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";

/**
 * GET /api/client-portal/invoices
 * List invoices for the authenticated client contact's organization.
 * Optional query params: ?status=SENT,OVERDUE
 */
export async function GET(req: Request) {
  const session = await getClientPortalSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const where: Record<string, unknown> = {
    clientId: session.clientId,
    status: { not: "DRAFT" }, // never show drafts to clients
  };

  if (statusFilter) {
    const statuses = statusFilter.split(",").map((s) => s.trim());
    where.status = { in: statuses };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      lineItemRecords: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
          amount: true,
          category: true,
          sortOrder: true,
        },
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
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute summary stats
  const outstanding = invoices
    .filter((inv) =>
      ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status)
    )
    .reduce((sum, inv) => sum + Number(inv.balanceDue), 0);

  const nextDueInvoice = invoices
    .filter(
      (inv) =>
        ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status) &&
        inv.dueDate
    )
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )[0];

  return Response.json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      subtotal: inv.subtotal,
      tax: inv.tax,
      whtAmount: inv.whtAmount,
      discountAmount: inv.discountAmount,
      total: inv.total,
      paidAmount: inv.paidAmount,
      balanceDue: inv.balanceDue,
      currency: inv.currency,
      status: inv.status,
      issuedDate: inv.issuedDate,
      dueDate: inv.dueDate,
      paidDate: inv.paidDate,
      clientNotes: inv.clientNotes,
      lineItemRecords: inv.lineItemRecords,
      payments: inv.payments,
      engagement: inv.engagement,
      createdAt: inv.createdAt,
    })),
    summary: {
      totalOutstanding: outstanding,
      currency: invoices[0]?.currency ?? "NGN",
      nextDueDate: nextDueInvoice?.dueDate ?? null,
      nextDueAmount: nextDueInvoice ? Number(nextDueInvoice.balanceDue) : null,
      nextDueInvoiceNumber: nextDueInvoice?.invoiceNumber ?? null,
    },
  });
}
