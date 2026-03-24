import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET   /api/credit-notes/[id] - Full credit note detail
 * PATCH /api/credit-notes/[id] - Issue (DRAFT->ISSUED) or Apply (ISSUED->APPLIED)
 */

const DIRECTOR_PLUS = ["DIRECTOR", "PARTNER", "ADMIN"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const creditNote = await prisma.creditNote.findUnique({
    where: { id },
    include: {
      originalInvoice: {
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          balanceDue: true,
          currency: true,
          status: true,
        },
      },
      appliedToInvoice: {
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          balanceDue: true,
        },
      },
      client: { select: { id: true, name: true, email: true } },
      engagement: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!creditNote) {
    return Response.json({ error: "Credit note not found" }, { status: 404 });
  }

  return Response.json({ creditNote });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!DIRECTOR_PLUS.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, applyToInvoiceId } = body as {
    action?: "issue" | "apply";
    applyToInvoiceId?: string;
  };

  const creditNote = await prisma.creditNote.findUnique({
    where: { id },
  });

  if (!creditNote) {
    return Response.json({ error: "Credit note not found" }, { status: 404 });
  }

  // ── Issue: DRAFT -> ISSUED ──────────────────────────────────────────────
  if (action === "issue") {
    if (creditNote.status !== "DRAFT") {
      return Response.json(
        { error: "Only DRAFT credit notes can be issued" },
        { status: 400 }
      );
    }

    const updated = await prisma.creditNote.update({
      where: { id },
      data: {
        status: "ISSUED",
        issuedDate: new Date(),
      },
    });

    return Response.json({ creditNote: updated });
  }

  // ── Apply: ISSUED -> APPLIED (reduces target invoice balanceDue) ────────
  if (action === "apply") {
    if (creditNote.status !== "ISSUED") {
      return Response.json(
        { error: "Only ISSUED credit notes can be applied" },
        { status: 400 }
      );
    }

    // Default to applying against the original invoice
    const targetInvoiceId = applyToInvoiceId ?? creditNote.originalInvoiceId;

    const targetInvoice = await prisma.invoice.findUnique({
      where: { id: targetInvoiceId },
    });

    if (!targetInvoice) {
      return Response.json(
        { error: "Target invoice not found" },
        { status: 404 }
      );
    }

    // Ensure credit note belongs to the same client
    if (targetInvoice.clientId !== creditNote.clientId) {
      return Response.json(
        { error: "Credit note and target invoice must belong to the same client" },
        { status: 400 }
      );
    }

    const creditAmount = new Decimal(creditNote.total);
    const currentBalance = new Decimal(targetInvoice.balanceDue);
    const newBalance = currentBalance.sub(creditAmount);
    const finalBalance = newBalance.lt(0) ? new Decimal(0) : newBalance;
    const newPaidAmount = new Decimal(targetInvoice.paidAmount).add(
      creditAmount.gt(currentBalance) ? currentBalance : creditAmount
    );

    // Determine new invoice status
    let newStatus = targetInvoice.status;
    if (finalBalance.isZero()) {
      newStatus = "PAID";
    } else if (newPaidAmount.gt(0) && finalBalance.gt(0)) {
      newStatus = "PARTIALLY_PAID";
    }

    await prisma.$transaction([
      prisma.creditNote.update({
        where: { id },
        data: {
          status: "APPLIED",
          appliedToInvoiceId: targetInvoiceId,
        },
      }),
      prisma.invoice.update({
        where: { id: targetInvoiceId },
        data: {
          balanceDue: finalBalance,
          paidAmount: newPaidAmount,
          status: newStatus,
          paidDate: newStatus === "PAID" ? new Date() : undefined,
        },
      }),
    ]);

    const updated = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        appliedToInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            balanceDue: true,
            status: true,
          },
        },
      },
    });

    return Response.json({ creditNote: updated });
  }

  return Response.json(
    { error: "Invalid action. Use 'issue' or 'apply'." },
    { status: 400 }
  );
}
