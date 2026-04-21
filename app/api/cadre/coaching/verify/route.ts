import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/cadre/coaching/verify
 * Verify a coaching session payment after Paystack callback.
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

  if (coachingSession.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Session already processed" }, { status: 400 });
  }

  const updated = await prisma.cadreCoachingSession.update({
    where: { id: coachingSession.id },
    data: { status: "PAID", paidAt: new Date() },
    include: {
      mentorProfile: {
        include: { professional: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  // Notify the mentor
  await prisma.cadreNotification.create({
    data: {
      professionalId: updated.mentorProfile.professionalId,
      type: "SYSTEM",
      title: "New coaching session booked",
      message: `Someone has booked a paid coaching session with you on: ${updated.topic}`,
      link: "/oncadre/mentorship/my",
    },
  });

  return NextResponse.json({ ok: true, session: { id: updated.id, status: updated.status } });
});
