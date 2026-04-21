import { NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSubscription, PLANS } from "@/lib/cadreHealth/subscription";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/cadre/subscribe
 * Returns current subscription status + plan info.
 */
export const GET = handler(async function GET() {
  const session = await getCadreSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getOrCreateSubscription(session.sub);

  return NextResponse.json({
    subscription: {
      plan: sub.plan,
      status: sub.status,
      aiMessagesThisMonth: sub.aiMessagesThisMonth,
      currentPeriodEnd: sub.currentPeriodEnd,
    },
    plans: PLANS,
  });
});

/**
 * POST /api/cadre/subscribe
 * Initialize a Paystack subscription for the Pro plan.
 */
export const POST = handler(async function POST() {
  const session = await getCadreSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Payment processing is not configured" }, { status: 503 });
  }

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { email: true, firstName: true, lastName: true },
  });
  if (!professional) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const sub = await getOrCreateSubscription(session.sub);

  // Already on Pro
  if (sub.plan === "PRO" && sub.status === "ACTIVE") {
    return NextResponse.json({ error: "Already subscribed to Pro" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.BASE_URL;

  // Create or reuse Paystack customer
  let customerCode = sub.paystackCustomerCode;
  if (!customerCode) {
    const custRes = await fetch("https://api.paystack.co/customer", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: professional.email,
        first_name: professional.firstName,
        last_name: professional.lastName,
        metadata: { cadre_professional_id: session.sub },
      }),
    });
    const custData = await custRes.json();
    if (!custData.status) {
      return NextResponse.json({ error: "Failed to create customer" }, { status: 502 });
    }
    customerCode = custData.data.customer_code;

    await prisma.cadreSubscription.update({
      where: { id: sub.id },
      data: { paystackCustomerCode: customerCode },
    });
  }

  // Initialize transaction for first payment (N1,500)
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: professional.email,
      amount: PLANS.PRO.priceNGN * 100, // kobo
      currency: "NGN",
      metadata: {
        type: "cadre_subscription",
        professional_id: session.sub,
        plan: "PRO",
      },
      callback_url: `${baseUrl}/oncadre/coaching/callback`,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Failed to initialize payment" }, { status: 502 });
  }

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
});
