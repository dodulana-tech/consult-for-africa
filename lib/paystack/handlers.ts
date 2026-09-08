/**
 * Paystack event handlers for the products that live in this codebase:
 * client invoices, training track purchases, CadreHealth subscriptions and
 * CadreHealth coaching sessions.
 *
 * Pulled out of the webhook route so a single front door can dispatch to them
 * (see app/api/paystack/webhook/route.ts) and so a replay can re-run one
 * without going back through HTTP.
 *
 * Every handler is idempotent. Paystack retries, and a replay re-runs an event
 * on purpose, so running twice must not double-charge, double-enrol or
 * double-receipt anyone.
 */
import { prisma } from "@/lib/prisma";
import { emailPaymentReceipt, emailTrackPurchaseConfirmation } from "@/lib/email";
import { emailCadreProWelcome, emailCadreCoachingBooked } from "@/lib/cadreHealth/paymentEmails";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceStatus } from "@prisma/client";

export interface PaystackEvent {
  event: string;
  data: {
    id?: number;
    reference?: string;
    amount?: number;
    currency?: string;
    channel?: string;
    customer?: { customer_code?: string; email?: string };
    metadata?: {
      product?: string;
      type?: string;
      invoiceId?: string;
      invoiceNumber?: string;
      clientId?: string;
      trackPurchaseId?: string;
      trackId?: string;
      userId?: string;
      professional_id?: string;
      session_id?: string;
      [key: string]: unknown;
    };
  };
}

/* ── Training track purchases ─────────────────────────────────────────────── */

export async function handleTrackPurchase(event: PaystackEvent): Promise<void> {
  const { data } = event;
  const trackPurchaseId = data.metadata?.trackPurchaseId;
  if (!trackPurchaseId) return;

  const purchase = await prisma.trackPurchase.findUnique({ where: { id: trackPurchaseId } });

  if (!purchase || purchase.status === "CONFIRMED") {
    // Already processed, or the id does not resolve. Either way there is
    // nothing to do and repeating is harmless.
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.trackPurchase.update({
      where: { id: trackPurchaseId },
      data: {
        status: "CONFIRMED",
        paystackTxnId: String(data.id),
        confirmedAt: new Date(),
      },
    });

    const track = await tx.trainingTrack.findUnique({
      where: { id: purchase.trackId },
      include: { modules: { where: { isActive: true }, orderBy: { order: "asc" } } },
    });

    if (track) {
      const existing = await tx.trainingEnrollment.findUnique({
        where: { userId_trackId: { userId: purchase.userId, trackId: purchase.trackId } },
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
      console.error("[paystack] track purchase email failed:", err);
    });
  }

  console.log(`[paystack] track purchase ${data.reference} confirmed for user ${purchase.userId}`);
}

/* ── Client invoice payments ──────────────────────────────────────────────── */

export async function handleInvoicePayment(event: PaystackEvent): Promise<void> {
  const { data } = event;
  const invoiceId = data.metadata?.invoiceId;
  if (!invoiceId || !data.reference) return;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: { select: { name: true, email: true } } },
  });

  if (!invoice) {
    console.error(`[paystack] invoice ${invoiceId} not found`);
    return;
  }

  // Paystack sends kobo/cents
  const paymentAmount = new Decimal(data.amount ?? 0).div(100);
  const reference = data.reference;

  // Duplicate check sits inside the transaction so two concurrent deliveries
  // cannot both pass it.
  const result = await prisma.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findFirst({ where: { paystackRef: reference } });
    if (existingPayment) return { skipped: true as const };

    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: paymentAmount,
        currency: invoice.currency,
        paymentDate: new Date(),
        paymentMethod: "paystack",
        reference,
        paystackRef: reference,
        paystackTxnId: String(data.id),
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    const newPaidAmount = new Decimal(invoice.paidAmount).add(paymentAmount);
    const newBalanceDue = new Decimal(invoice.total).sub(newPaidAmount);
    const newStatus: InvoiceStatus = newBalanceDue.lte(0) ? "PAID" : "PARTIALLY_PAID";

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        balanceDue: newBalanceDue.lt(0) ? new Decimal(0) : newBalanceDue,
        status: newStatus,
        paidDate: newStatus === "PAID" ? new Date() : undefined,
      },
    });

    return { skipped: false as const };
  });

  if (result.skipped) {
    console.warn(`[paystack] duplicate payment for ref ${reference}, skipping`);
    return;
  }

  const newBalanceDue = new Decimal(invoice.total).sub(
    new Decimal(invoice.paidAmount).add(paymentAmount)
  );

  emailPaymentReceipt({
    clientEmail: invoice.client.email,
    clientName: invoice.client.name,
    invoiceNumber: invoice.invoiceNumber,
    amountPaid: Number(paymentAmount),
    balanceDue: Number(newBalanceDue.lt(0) ? new Decimal(0) : newBalanceDue),
    currency: invoice.currency,
    reference,
  }).catch((err) => {
    console.error("[paystack] receipt email failed:", err);
  });

  console.log(`[paystack] payment ${reference} recorded for invoice ${invoice.invoiceNumber}`);
}

/* ── CadreHealth subscriptions ────────────────────────────────────────────── */

export async function handleCadreSubscription(event: PaystackEvent): Promise<void> {
  if (event.event === "charge.success") {
    const { metadata, customer } = event.data;
    if (metadata?.type !== "cadre_subscription") return;

    const professionalId = metadata.professional_id;
    if (!professionalId) return;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Read before writing so a retry or a deliberate replay does not send a
    // second welcome. The upsert itself is safely repeatable; the email is not.
    const prior = await prisma.cadreSubscription.findUnique({
      where: { professionalId },
      select: { plan: true, status: true },
    });
    const alreadyPro = prior?.plan === "PRO" && prior.status === "ACTIVE";

    await prisma.cadreSubscription.upsert({
      where: { professionalId },
      update: {
        plan: "PRO",
        status: "ACTIVE",
        amountNGN: 1500,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        aiMessagesThisMonth: 0,
        aiMessagesResetAt: now,
        paystackCustomerCode: customer?.customer_code || undefined,
      },
      create: {
        professionalId,
        plan: "PRO",
        status: "ACTIVE",
        amountNGN: 1500,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paystackCustomerCode: customer?.customer_code || undefined,
      },
    });

    if (!alreadyPro) {
      const professional = await prisma.cadreProfessional.findUnique({
        where: { id: professionalId },
        select: { email: true, firstName: true, lastName: true, cadre: true },
      });
      if (professional) {
        // Failing to send must not fail the handler: the subscription is
        // already active and retrying a bug rarely fixes it.
        emailCadreProWelcome({
          person: professional,
          amountKobo: event.data.amount ?? 0,
          reference: event.data.reference ?? "",
          periodStart: now,
          periodEnd,
        }).catch((err) => {
          console.error("[paystack] cadre pro welcome email failed:", err);
        });
      }
    }
    return;
  }

  if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
    // These events carry no metadata, so the customer code is the only link
    // back to a subscriber. An unknown code simply matches nothing.
    const customerCode = event.data?.customer?.customer_code;
    if (!customerCode) return;

    await prisma.cadreSubscription.updateMany({
      where: { paystackCustomerCode: customerCode, plan: "PRO" },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  }
}

/* ── CadreHealth coaching sessions ────────────────────────────────────────── */

/**
 * A mentee paying for a coaching session.
 *
 * The callback page verifies the same reference when the browser comes back,
 * so this handler is what covers the mentee who closes the tab at the OTP
 * screen and never returns. Whichever arrives first marks the session paid and
 * notifies the mentor; the other finds nothing left to do.
 */
export async function handleCoachingSession(event: PaystackEvent): Promise<void> {
  const { data } = event;
  if (data.metadata?.type !== "cadre_coaching_session") return;

  // The reference is stored immediately after initialize, so it is the usual
  // way back to the session. metadata.session_id covers the moment between
  // those two writes, when the reference is not on the row yet.
  const byRef = data.reference
    ? await prisma.cadreCoachingSession.findUnique({ where: { paystackRef: data.reference } })
    : null;
  const coachingSession =
    byRef ??
    (data.metadata.session_id
      ? await prisma.cadreCoachingSession.findUnique({ where: { id: data.metadata.session_id } })
      : null);

  if (!coachingSession) {
    console.error(`[paystack] coaching session for ${data.reference} not found`);
    return;
  }

  // The status is the idempotency key: a second delivery claims nothing, so
  // the mentor is not notified twice.
  const claimed = await prisma.cadreCoachingSession.updateMany({
    where: { id: coachingSession.id, status: "PENDING_PAYMENT" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paystackRef: coachingSession.paystackRef ?? data.reference,
    },
  });
  if (claimed.count === 0) return;

  const mentorProfile = await prisma.cadreMentorProfile.findUnique({
    where: { id: coachingSession.mentorProfileId },
    select: {
      professionalId: true,
      professional: { select: { firstName: true, lastName: true } },
    },
  });
  if (!mentorProfile) return;

  await prisma.cadreNotification.create({
    data: {
      professionalId: mentorProfile.professionalId,
      type: "SYSTEM",
      title: "New coaching session booked",
      message: `Someone has booked a paid coaching session with you on: ${coachingSession.topic}`,
      link: "/oncadre/mentorship/my",
    },
  });

  // The mentor gets a notification in the app. The mentee, who is the one who
  // actually paid, previously got nothing at all.
  const mentee = await prisma.cadreProfessional.findUnique({
    where: { id: coachingSession.menteeId },
    select: { email: true, firstName: true, lastName: true, cadre: true },
  });
  if (mentee) {
    const mentorName = [
      mentorProfile.professional.firstName,
      mentorProfile.professional.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    emailCadreCoachingBooked({
      person: mentee,
      mentorName: mentorName || "your mentor",
      topic: coachingSession.topic,
      amountKobo: data.amount ?? coachingSession.amountNGN * 100,
      reference: data.reference ?? "",
      durationMinutes: coachingSession.durationMinutes,
    }).catch((err) => {
      console.error("[paystack] coaching confirmation email failed:", err);
    });
  }

  console.log(`[paystack] coaching session ${coachingSession.id} paid (${data.reference})`);
}
