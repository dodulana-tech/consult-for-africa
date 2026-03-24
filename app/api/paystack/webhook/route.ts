import { prisma } from "@/lib/prisma";
import { emailPaymentReceipt, emailTrackPurchaseConfirmation } from "@/lib/email";
import { createHmac } from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceStatus } from "@prisma/client";

/**
 * POST /api/paystack/webhook
 * Receives Paystack webhook events. Verified by HMAC-SHA512 signature.
 * No session auth required (public endpoint).
 */

export async function POST(req: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return new Response("Webhook not configured", { status: 500 });
  }

  // Read raw body for HMAC verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  // Verify HMAC-SHA512 signature
  const expectedSignature = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("[paystack/webhook] Invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse the event
  let event: {
    event: string;
    data: {
      id: number;
      reference: string;
      amount: number;
      currency: string;
      channel: string;
      metadata?: {
        invoiceId?: string;
        invoiceNumber?: string;
        clientId?: string;
        trackPurchaseId?: string;
        trackId?: string;
        userId?: string;
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Return 200 immediately for non-relevant events
  if (event.event !== "charge.success") {
    return new Response("OK", { status: 200 });
  }

  const { data } = event;

  // ─── Track Purchase handling ─────────────────────────────────────────────
  const trackPurchaseId = data.metadata?.trackPurchaseId;
  if (trackPurchaseId) {
    try {
      const purchase = await prisma.trackPurchase.findUnique({
        where: { id: trackPurchaseId },
      });

      if (!purchase || purchase.status === "CONFIRMED") {
        // Already processed or not found
        return new Response("OK", { status: 200 });
      }

      await prisma.$transaction(async (tx) => {
        // Confirm the purchase
        await tx.trackPurchase.update({
          where: { id: trackPurchaseId },
          data: {
            status: "CONFIRMED",
            paystackTxnId: String(data.id),
            confirmedAt: new Date(),
          },
        });

        // Auto-create enrollment
        const track = await tx.trainingTrack.findUnique({
          where: { id: purchase.trackId },
          include: {
            modules: { where: { isActive: true }, orderBy: { order: "asc" } },
          },
        });

        if (track) {
          // Check if enrollment already exists (idempotency)
          const existing = await tx.trainingEnrollment.findUnique({
            where: {
              userId_trackId: {
                userId: purchase.userId,
                trackId: purchase.trackId,
              },
            },
          });

          if (!existing) {
            await tx.trainingEnrollment.create({
              data: {
                userId: purchase.userId,
                trackId: purchase.trackId,
                status: "IN_PROGRESS",
                startedAt: new Date(),
                moduleProgress: {
                  create: track.modules.map((mod, i) => ({
                    moduleId: mod.id,
                    status: i === 0 ? "AVAILABLE" : "LOCKED",
                  })),
                },
              },
            });
          }
        }
      });

      // Send confirmation email (non-blocking)
      const user = await prisma.user.findUnique({
        where: { id: purchase.userId },
        select: { email: true, name: true },
      });
      const track = await prisma.trainingTrack.findUnique({
        where: { id: purchase.trackId },
        select: { name: true },
      });

      if (user && track) {
        emailTrackPurchaseConfirmation({
          email: user.email,
          firstName: user.name?.split(" ")[0] ?? "there",
          trackName: track.name,
          amountPaid: Number(purchase.amountNGN),
        }).catch((err) => {
          console.error("[paystack/webhook] Failed to send track purchase email:", err);
        });
      }

      console.log(
        `[paystack/webhook] Track purchase ${data.reference} confirmed for user ${purchase.userId}`
      );
      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("[paystack/webhook] Track purchase processing error:", err);
      return new Response("OK", { status: 200 });
    }
  }

  // ─── Invoice Payment handling ────────────────────────────────────────────
  const invoiceId = data.metadata?.invoiceId;

  if (!invoiceId) {
    console.warn("[paystack/webhook] charge.success without invoiceId or trackPurchaseId in metadata");
    return new Response("OK", { status: 200 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: { select: { name: true, email: true } },
      },
    });

    if (!invoice) {
      console.error(`[paystack/webhook] Invoice ${invoiceId} not found`);
      return new Response("OK", { status: 200 });
    }

    // Amount comes from Paystack in kobo/cents
    const paymentAmount = new Decimal(data.amount).div(100);

    // Check for duplicate payment by reference
    const existingPayment = await prisma.payment.findFirst({
      where: { paystackRef: data.reference },
    });

    if (existingPayment) {
      console.warn(
        `[paystack/webhook] Duplicate payment for ref ${data.reference}, skipping`
      );
      return new Response("OK", { status: 200 });
    }

    // Create payment and update invoice in a transaction
    await prisma.$transaction(async (tx) => {
      // Create Payment record
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          currency: invoice.currency,
          paymentDate: new Date(),
          paymentMethod: "paystack",
          reference: data.reference,
          paystackRef: data.reference,
          paystackTxnId: String(data.id),
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      // Calculate new totals
      const newPaidAmount = new Decimal(invoice.paidAmount).add(paymentAmount);
      const newBalanceDue = new Decimal(invoice.total).sub(newPaidAmount);

      // Determine new status
      let newStatus: InvoiceStatus;
      if (newBalanceDue.lte(0)) {
        newStatus = "PAID";
      } else {
        newStatus = "PARTIALLY_PAID";
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue.lt(0) ? new Decimal(0) : newBalanceDue,
          status: newStatus,
          paidDate: newStatus === "PAID" ? new Date() : undefined,
        },
      });
    });

    // Send receipt email (non-blocking, outside transaction)
    const newBalanceDue = new Decimal(invoice.total)
      .sub(new Decimal(invoice.paidAmount).add(paymentAmount));

    emailPaymentReceipt({
      clientEmail: invoice.client.email,
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amountPaid: Number(paymentAmount),
      balanceDue: Number(newBalanceDue.lt(0) ? new Decimal(0) : newBalanceDue),
      currency: invoice.currency,
      reference: data.reference,
    }).catch((err) => {
      console.error("[paystack/webhook] Failed to send receipt email:", err);
    });

    console.log(
      `[paystack/webhook] Payment ${data.reference} recorded for invoice ${invoice.invoiceNumber}`
    );
  } catch (err) {
    console.error("[paystack/webhook] Processing error:", err);
    // Still return 200 to prevent Paystack retries on our internal errors
    // The payment can be reconciled manually
  }

  return new Response("OK", { status: 200 });
}
