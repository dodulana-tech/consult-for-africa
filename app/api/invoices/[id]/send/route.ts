import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { emailInvoiceSent } from "@/lib/email";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

const APPROVAL_THRESHOLD: Record<string, number> = {
  NGN: 5_000_000,
  USD: 5_000,
};

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canSend = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canSend) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true, primaryContact: true } },
      engagement: { select: { id: true, name: true, engagementManagerId: true } },
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice) return new Response("Not found", { status: 404 });

  // IDOR check for EMs
  if (!isElevated) {
    if (!invoice.engagement || invoice.engagement.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Must be DRAFT or PENDING_APPROVAL
  if (!["DRAFT", "PENDING_APPROVAL"].includes(invoice.status)) {
    if (invoice.status === "SENT") {
      return new Response("Invoice has already been sent", { status: 400 });
    }
    return new Response(`Cannot send invoice with status ${invoice.status}`, { status: 400 });
  }

  // Check approval requirement
  if (invoice.status === "DRAFT") {
    const threshold = APPROVAL_THRESHOLD[invoice.currency] ?? APPROVAL_THRESHOLD.NGN;
    if (Number(invoice.total) > threshold && !invoice.approvedById) {
      return new Response(
        `Invoice total exceeds ${invoice.currency} ${threshold.toLocaleString()}. Requires approval before sending.`,
        { status: 400 }
      );
    }
  }

  if (invoice.status === "PENDING_APPROVAL") {
    if (!isElevated) {
      return new Response("Director or above required to approve and send", { status: 403 });
    }
  }

  // Update invoice status
  const updateData: Record<string, unknown> = {
    status: "SENT",
    issuedDate: invoice.issuedDate ?? new Date(),
  };

  if (invoice.status === "PENDING_APPROVAL") {
    updateData.approvedById = session.user.id;
    updateData.approvedAt = new Date();
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: updateData,
  });

  // Send email to client
  const BASE_URL = process.env.NEXTAUTH_URL;
  const viewUrl = `${BASE_URL}/invoices/${invoice.id}`;

  const formatted = invoice.currency === "USD"
    ? `$${Number(invoice.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${Number(invoice.total).toLocaleString("en-NG")}`;

  try {
    await emailInvoiceSent({
      clientEmail: invoice.client.email,
      clientName: invoice.client.primaryContact || invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: formatted,
      currency: invoice.currency,
      dueDate: invoice.dueDate
        ? invoice.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : "On receipt",
      viewUrl,
    });
  } catch (err) {
    console.error("[invoice/send] Email failed but invoice marked as sent:", err);
  }

  return Response.json({
    id: updated.id,
    invoiceNumber: updated.invoiceNumber,
    status: updated.status,
    issuedDate: updated.issuedDate?.toISOString() ?? null,
    message: "Invoice sent successfully",
  });
});
