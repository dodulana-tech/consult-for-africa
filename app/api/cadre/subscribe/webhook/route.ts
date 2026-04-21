import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/cadre/subscribe/webhook
 * Handles Paystack webhook for CadreHealth subscription payments.
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  // Verify Paystack HMAC signature
  const body = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  const hash = crypto.createHmac("sha512", secretKey).update(body).digest("hex");
  if (sig !== hash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { metadata, customer } = event.data;

    // Only handle cadre subscription payments
    if (metadata?.type !== "cadre_subscription") {
      return NextResponse.json({ ok: true }); // Not ours, ignore
    }

    const professionalId = metadata.professional_id;
    if (!professionalId) return NextResponse.json({ ok: true });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

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
  }

  if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
    const customerCode = event.data?.customer?.customer_code;
    if (customerCode) {
      await prisma.cadreSubscription.updateMany({
        where: { paystackCustomerCode: customerCode, plan: "PRO" },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
