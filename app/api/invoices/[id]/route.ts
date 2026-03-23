import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { InvoiceStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canUpdate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canUpdate) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  // IDOR: verify ownership for non-elevated roles
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      select: { engagement: { select: { engagementManagerId: true } } },
    });
    if (!existing) return new Response("Not found", { status: 404 });
    if (existing.engagement?.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const { status, paymentMethod, paymentReference } = await req.json();

  const validStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
  if (status && !validStatuses.includes(status)) {
    return new Response("Invalid status", { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (status) data.status = status as InvoiceStatus;
  if (paymentMethod) data.paymentMethod = paymentMethod;
  if (paymentReference) data.paymentReference = paymentReference;
  if (status === "PAID") data.paidDate = new Date();
  if (status === "SENT" && !data.issuedDate) data.issuedDate = new Date();

  const invoice = await prisma.invoice.update({
    where: { id },
    data,
  });

  return Response.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    issuedDate: invoice.issuedDate?.toISOString() ?? null,
    dueDate: invoice.dueDate?.toISOString() ?? null,
    paidDate: invoice.paidDate?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  });
}
