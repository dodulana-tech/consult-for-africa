import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { emailPaymentReceived } from "@/lib/email";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

/* ── GET: list payments for an invoice ─────────────────────────────────────── */

export const GET = handler(async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canView = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canView) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Verify invoice exists + IDOR check
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      engagement: { select: { engagementManagerId: true } },
    },
  });
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    if (!invoice.engagement || invoice.engagement.engagementManagerId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const payments = await prisma.payment.findMany({
    where: { invoiceId: id },
    include: {
      confirmedBy: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
  });

  return Response.json(
    payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      confirmedAt: p.confirmedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
});

/* ── POST: record a payment ────────────────────────────────────────────────── */

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Require EM+ role
  const canRecord = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canRecord) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true, primaryContact: true } },
      engagement: { select: { engagementManagerId: true } },
    },
  });
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

  // IDOR check
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    if (!invoice.engagement || invoice.engagement.engagementManagerId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Must be in a payable status
  const payableStatuses = ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"];
  if (!payableStatuses.includes(invoice.status)) {
    return Response.json({ error: `Cannot record payment for invoice with status ${invoice.status}` }, { status: 400 });
  }

  const body = await req.json();
  const { amount, currency, paymentDate, paymentMethod, reference, bankName, notes } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return Response.json({ error: "Valid positive amount is required" }, { status: 400 });
  }
  if (!paymentMethod) {
    return Response.json({ error: "paymentMethod is required" }, { status: 400 });
  }

  const currentBalance = Number(invoice.balanceDue);
  if (amount > currentBalance + 0.01) {
    return Response.json({ error: `Payment amount (${amount}) exceeds balance due (${currentBalance})` }, { status: 400 });
  }

  // Create payment and update invoice in transaction
  const [payment] = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        invoiceId: id,
        amount,
        currency: currency ?? invoice.currency,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        reference: reference ?? null,
        bankName: bankName ?? null,
        notes: notes ?? null,
        status: "CONFIRMED",
        confirmedById: session.user.id,
        confirmedAt: new Date(),
      },
    });

    const newPaidAmount = Number(invoice.paidAmount) + amount;
    const newBalance = Math.round((Number(invoice.total) - newPaidAmount) * 100) / 100;
    const fullyPaid = newBalance <= 0.01;

    const updateData: Record<string, unknown> = {
      paidAmount: newPaidAmount,
      balanceDue: Math.max(newBalance, 0),
    };

    if (fullyPaid) {
      updateData.status = "PAID";
      updateData.paidDate = new Date();
    } else {
      updateData.status = "PARTIALLY_PAID";
    }

    const updatedInvoice = await tx.invoice.update({
      where: { id },
      data: updateData,
    });

    return [newPayment, updatedInvoice] as const;
  });

  // Send confirmation email
  const fmtAmount = invoice.currency === "USD"
    ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${amount.toLocaleString("en-NG")}`;

  const newBalance = Math.max(Number(invoice.balanceDue) - amount, 0);
  const fmtBalance = invoice.currency === "USD"
    ? `$${newBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `\u20A6${newBalance.toLocaleString("en-NG")}`;

  try {
    await emailPaymentReceived({
      clientEmail: invoice.client.email,
      clientName: invoice.client.primaryContact || invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amountPaid: fmtAmount,
      balanceDue: fmtBalance,
      currency: invoice.currency,
    });
  } catch (err) {
    console.error("[payments] Email notification failed:", err);
  }

  return Response.json(
    {
      ...payment,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate.toISOString(),
      confirmedAt: payment.confirmedAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    },
    { status: 201 }
  );
});
