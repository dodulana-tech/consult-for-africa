import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET  /api/credit-notes - List credit notes with optional filters
 * POST /api/credit-notes - Create a new credit note (Director+ only)
 */

const DIRECTOR_PLUS = ["DIRECTOR", "PARTNER", "ADMIN"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if (status) where.status = status;

  const creditNotes = await prisma.creditNote.findMany({
    where,
    include: {
      originalInvoice: {
        select: { invoiceNumber: true, total: true, currency: true },
      },
      client: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ creditNotes });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!DIRECTOR_PLUS.includes(session.user.role)) {
    return Response.json(
      { error: "Only Directors, Partners, and Admins can create credit notes" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { originalInvoiceId, reason, lineItems } = body as {
    originalInvoiceId?: string;
    reason?: string;
    lineItems?: { description: string; quantity: number; unitPrice: number }[];
  };

  if (!originalInvoiceId || !reason || !lineItems?.length) {
    return Response.json(
      { error: "originalInvoiceId, reason, and lineItems are required" },
      { status: 400 }
    );
  }

  // Validate original invoice exists
  const originalInvoice = await prisma.invoice.findUnique({
    where: { id: originalInvoiceId },
    select: {
      id: true,
      clientId: true,
      engagementId: true,
      currency: true,
      invoiceNumber: true,
    },
  });

  if (!originalInvoice) {
    return Response.json(
      { error: "Original invoice not found" },
      { status: 404 }
    );
  }

  // Calculate totals
  let subtotal = new Decimal(0);
  for (const item of lineItems) {
    const amount = new Decimal(item.quantity).mul(new Decimal(item.unitPrice));
    subtotal = subtotal.add(amount);
  }

  // Generate credit note number: CFA-CN-YYYY-NNNN
  const year = new Date().getFullYear();
  const latestCN = await prisma.creditNote.findFirst({
    where: {
      creditNoteNumber: { startsWith: `CFA-CN-${year}-` },
    },
    orderBy: { creditNoteNumber: "desc" },
    select: { creditNoteNumber: true },
  });

  let sequence = 1;
  if (latestCN?.creditNoteNumber) {
    const parts = latestCN.creditNoteNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  const creditNoteNumber = `CFA-CN-${year}-${String(sequence).padStart(4, "0")}`;

  const creditNote = await prisma.creditNote.create({
    data: {
      creditNoteNumber,
      originalInvoiceId: originalInvoice.id,
      clientId: originalInvoice.clientId,
      engagementId: originalInvoice.engagementId,
      reason,
      subtotal,
      tax: 0,
      total: subtotal,
      currency: originalInvoice.currency,
      status: "DRAFT",
      createdById: session.user.id,
    },
    include: {
      originalInvoice: {
        select: { invoiceNumber: true },
      },
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ creditNote }, { status: 201 });
}
