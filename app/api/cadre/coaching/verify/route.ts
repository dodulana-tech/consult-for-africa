import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handleCoachingSession } from "@/lib/paystack/handlers";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/cadre/coaching/verify
 * Verify a coaching session payment after Paystack callback.
 *
 * The webhook confirms the same payment for the mentee who never comes back,
 * so both doors lead to the one copy of the logic in lib/paystack/handlers.ts.
 * Either may arrive first and the other then has nothing to do.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await getCadreSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { reference } = await req.json();
  if (!reference) return NextResponse.json({ error: "reference is required" }, { status: 400 });

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();

  if (!data.status || data.data.status !== "success") {
    return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });
  }

  const metadata = data.data.metadata;
  if (metadata?.type !== "cadre_coaching_session") {
    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  }

  // Update the coaching session
  const coachingSession = await prisma.cadreCoachingSession.findFirst({
    where: { paystackRef: reference, menteeId: session.sub },
  });

  if (!coachingSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Paystack has confirmed the money either way. If the webhook got here
  // first the session is already paid, and telling the mentee their payment
  // failed because we were beaten to it would be a lie.
  if (coachingSession.status === "PENDING_PAYMENT") {
    await handleCoachingSession({ event: "charge.success", data: data.data });
  }

  const updated = await prisma.cadreCoachingSession.findUnique({
    where: { id: coachingSession.id },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, session: updated });
});
