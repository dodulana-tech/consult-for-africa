import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSubscription } from "@/lib/cadreHealth/subscription";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/cadre/coaching/book
 * Book a paid mentoring session. Requires Pro subscription.
 * Creates a PENDING_PAYMENT session and returns a Paystack payment URL.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await getCadreSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Payment not configured" }, { status: 503 });

  const body = await req.json();
  const { mentorProfileId, topic } = body as { mentorProfileId?: string; topic?: string };

  if (!mentorProfileId || !topic?.trim()) {
    return NextResponse.json({ error: "mentorProfileId and topic are required" }, { status: 400 });
  }

  // Must be Pro subscriber
  const sub = await getOrCreateSubscription(session.sub);
  if (sub.plan !== "PRO" || sub.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Pro subscription required to book coaching sessions", upgrade: true },
      { status: 403 },
    );
  }

  // Validate mentor exists and is active
  const mentor = await prisma.cadreMentorProfile.findUnique({
    where: { id: mentorProfileId },
    include: { professional: { select: { firstName: true, lastName: true } } },
  });

  if (!mentor || mentor.status !== "ACTIVE") {
    return NextResponse.json({ error: "Mentor not available" }, { status: 404 });
  }

  // Can't book yourself
  if (mentor.professionalId === session.sub) {
    return NextResponse.json({ error: "Cannot book a session with yourself" }, { status: 400 });
  }

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { email: true, firstName: true },
  });
  if (!professional) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const amountNGN = 5000;

  // Create session record
  const coachingSession = await prisma.cadreCoachingSession.create({
    data: {
      menteeId: session.sub,
      mentorProfileId,
      topic: topic.trim(),
      amountNGN,
      status: "PENDING_PAYMENT",
    },
  });

  // Initialize Paystack payment
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.BASE_URL;
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: professional.email,
      amount: amountNGN * 100,
      currency: "NGN",
      metadata: {
        type: "cadre_coaching_session",
        session_id: coachingSession.id,
        professional_id: session.sub,
        mentor_name: `${mentor.professional.firstName} ${mentor.professional.lastName}`,
      },
      callback_url: `${baseUrl}/oncadre/coaching/session-callback?sessionId=${coachingSession.id}`,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    // Clean up the session
    await prisma.cadreCoachingSession.delete({ where: { id: coachingSession.id } });
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 502 });
  }

  // Store the reference
  await prisma.cadreCoachingSession.update({
    where: { id: coachingSession.id },
    data: { paystackRef: data.data.reference },
  });

  return NextResponse.json({
    sessionId: coachingSession.id,
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
});
