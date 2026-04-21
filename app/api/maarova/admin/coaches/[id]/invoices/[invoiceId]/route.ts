import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const VALID_ACTIONS: Record<string, { from: string[]; to: string }> = {
  send: { from: ["DRAFT"], to: "SENT" },
  mark_paid: { from: ["SENT", "OVERDUE"], to: "PAID" },
  cancel: { from: ["DRAFT", "SENT"], to: "CANCELLED" },
};

/**
 * PATCH /api/maarova/admin/coaches/[id]/invoices/[invoiceId]
 * Update invoice status (send, mark_paid, cancel).
 */
export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { id, invoiceId } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const invoice = await prisma.maarovaCoachingInvoice.findFirst({
    where: { id: invoiceId, coachId: id },
  });

  if (!invoice) return Response.json({ error: "Invoice not found" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  const transition = VALID_ACTIONS[action];
  if (!transition) {
    return Response.json(
      { error: `Invalid action. Must be one of: ${Object.keys(VALID_ACTIONS).join(", ")}` },
      { status: 400 },
    );
  }

  if (!transition.from.includes(invoice.status)) {
    return Response.json(
      { error: `Cannot ${action} an invoice with status ${invoice.status}` },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {
    status: transition.to,
  };

  if (action === "send") {
    data.issuedAt = new Date();
  }

  if (action === "mark_paid") {
    data.paidAt = new Date();
  }

  const updated = await prisma.maarovaCoachingInvoice.update({
    where: { id: invoiceId },
    data,
  });

  return Response.json({
    id: updated.id,
    invoiceNumber: updated.invoiceNumber,
    status: updated.status,
    message: `Invoice ${updated.invoiceNumber} ${action === "send" ? "sent" : action === "mark_paid" ? "marked as paid" : "cancelled"}.`,
  });
});
