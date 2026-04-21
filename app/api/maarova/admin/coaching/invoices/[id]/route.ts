import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const invoice = await prisma.maarovaCoachingInvoice.findUnique({ where: { id } });
  if (!invoice) return Response.json({ error: "Invoice not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Status transitions
  if (body.status !== undefined) {
    const current = invoice.status;
    const next = body.status;

    const validTransitions: Record<string, string[]> = {
      DRAFT: ["SENT"],
      SENT: ["PAID"],
    };

    // Any status can go to CANCELLED
    if (next === "CANCELLED") {
      data.status = "CANCELLED";
    } else if (validTransitions[current]?.includes(next)) {
      data.status = next;
    } else {
      return Response.json(
        { error: `Cannot transition from ${current} to ${next}` },
        { status: 400 },
      );
    }

    if (next === "PAID") {
      data.paidAt = new Date();
    }

    if (next === "SENT" && !invoice.issuedAt) {
      data.issuedAt = new Date();
    }
  }

  if (body.amount !== undefined) data.amount = parseFloat(String(body.amount));
  if (body.description !== undefined) data.description = body.description.trim();
  if (body.lineItems !== undefined) data.lineItems = body.lineItems;
  if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.maarovaCoachingInvoice.update({
    where: { id },
    data,
  });

  return Response.json({
    invoice: {
      id: updated.id,
      invoiceNumber: updated.invoiceNumber,
      status: updated.status,
      amount: Number(updated.amount),
      currency: updated.currency,
      issuedAt: updated.issuedAt?.toISOString() ?? null,
      paidAt: updated.paidAt?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});
