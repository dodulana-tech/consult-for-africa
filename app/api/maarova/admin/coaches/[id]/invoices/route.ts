import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/maarova/admin/coaches/[id]/invoices
 * Create a new invoice for a coach.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const coach = await prisma.maarovaCoach.findUnique({
    where: { id },
    select: { id: true, name: true, organisationId: true },
  });

  if (!coach) return Response.json({ error: "Coach not found" }, { status: 404 });

  const body = await req.json();
  const { matchId, description, amount, currency, lineItems, dueAt, notes } = body;

  if (!description?.trim()) {
    return Response.json({ error: "Description is required" }, { status: 400 });
  }

  const parsedAmount = parseFloat(String(amount));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return Response.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  // Generate invoice number: INV-COACHID_SHORT-TIMESTAMP
  const shortId = coach.id.slice(-4).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const invoiceNumber = `INV-${shortId}-${timestamp}`;

  const invoice = await prisma.maarovaCoachingInvoice.create({
    data: {
      invoiceNumber,
      coachId: id,
      matchId: matchId || null,
      organisationId: coach.organisationId || null,
      status: "DRAFT",
      amount: parsedAmount,
      currency: currency || "NGN",
      description: description.trim(),
      lineItems: lineItems || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      notes: notes?.trim() || null,
    },
  });

  return Response.json({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    amount: Number(invoice.amount),
    message: `Invoice ${invoice.invoiceNumber} created.`,
  });
});
