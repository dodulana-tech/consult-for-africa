import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Decimal } from "@prisma/client/runtime/library";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/training/purchase
 * Initialize a Paystack payment for a paid training track.
 * On successful payment (via webhook), enrollment is auto-created.
 */
export const POST = handler(async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trackId } = await req.json();
  if (!trackId) {
    return Response.json({ error: "trackId required" }, { status: 400 });
  }

  const track = await prisma.trainingTrack.findUnique({
    where: { id: trackId },
  });

  if (!track || !track.isActive) {
    return Response.json({ error: "Track not found" }, { status: 404 });
  }

  if (track.pricingType !== "PAID") {
    return Response.json(
      { error: "This track is free. Use the enroll endpoint instead." },
      { status: 400 }
    );
  }

  if (!track.priceNGN) {
    return Response.json({ error: "Track price not configured" }, { status: 500 });
  }

  // Check if already purchased
  const existing = await prisma.trackPurchase.findUnique({
    where: { userId_trackId: { userId: session.user.id, trackId } },
  });

  if (existing?.status === "CONFIRMED") {
    return Response.json({ error: "Already purchased" }, { status: 400 });
  }

  // Check if already enrolled
  const enrolled = await prisma.trainingEnrollment.findUnique({
    where: { userId_trackId: { userId: session.user.id, trackId } },
  });

  if (enrolled) {
    return Response.json({ error: "Already enrolled in this track" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: "Payment processing not configured" }, { status: 503 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.BASE_URL;
  if (!baseUrl) {
    return Response.json({ error: "Base URL not configured" }, { status: 503 });
  }

  // Calculate price with discount
  const discount = track.discountPct ? new Decimal(track.discountPct) : new Decimal(0);
  const price = new Decimal(track.priceNGN);
  const discountAmount = price.mul(discount).div(100);
  const finalPrice = price.sub(discountAmount);

  const reference = `cfa-track-${randomUUID()}`;
  const amountInKobo = Math.round(Number(finalPrice) * 100);

  // Upsert purchase record (handles retries for PENDING purchases)
  const purchase = existing
    ? await prisma.trackPurchase.update({
        where: { id: existing.id },
        data: { paystackRef: reference, amountNGN: finalPrice, discountApplied: discount },
      })
    : await prisma.trackPurchase.create({
        data: {
          userId: session.user.id,
          trackId,
          amountNGN: finalPrice,
          discountApplied: discount.gt(0) ? discount : null,
          paystackRef: reference,
          status: "PENDING",
        },
      });

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: amountInKobo,
        currency: "NGN",
        reference,
        metadata: {
          trackPurchaseId: purchase.id,
          trackId,
          userId: session.user.id,
        },
        callback_url: `${baseUrl}/api/training/purchase/callback`,
      }),
    });

    const data = await res.json();

    if (!data.status) {
      console.error("[training/purchase] Paystack error:", data);
      return Response.json(
        { error: data.message ?? "Failed to initialize payment" },
        { status: 502 }
      );
    }

    return Response.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      amount: Number(finalPrice),
    });
  } catch (err) {
    console.error("[training/purchase] Error:", err);
    return Response.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
});
