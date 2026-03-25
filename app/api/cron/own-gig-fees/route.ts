import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * POST /api/cron/own-gig-fees
 * Monthly cron to generate platform fee records for active own gig engagements.
 * Protected by CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;
  if (!secret || !expected || !safeCompare(secret, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Find all active own gig engagements
  const gigs = await prisma.engagement.findMany({
    where: {
      isOwnGig: true,
      status: { in: ["PLANNING", "ACTIVE", "ON_HOLD"] },
      ownGigOwnerId: { not: null },
      ownGigFeeModel: { not: null },
    },
    select: {
      id: true,
      ownGigOwnerId: true,
      ownGigFeeModel: true,
      ownGigFeePct: true,
      ownGigFlatMonthlyFee: true,
      budgetAmount: true,
      budgetCurrency: true,
    },
  });

  let created = 0;

  for (const gig of gigs) {
    // Skip if fee already exists for this period
    const existing = await prisma.ownGigPlatformFee.findFirst({
      where: {
        engagementId: gig.id,
        periodStart,
      },
    });

    if (existing) continue;

    let feeAmount = 0;

    if (gig.ownGigFeeModel === "PERCENTAGE" && gig.ownGigFeePct) {
      feeAmount = Number(gig.budgetAmount) * Number(gig.ownGigFeePct) / 100;
    } else if (gig.ownGigFeeModel === "FLAT_MONTHLY" && gig.ownGigFlatMonthlyFee) {
      feeAmount = Number(gig.ownGigFlatMonthlyFee);
    }

    if (feeAmount <= 0) continue;

    await prisma.ownGigPlatformFee.create({
      data: {
        engagementId: gig.id,
        consultantId: gig.ownGigOwnerId!,
        periodStart,
        periodEnd,
        feeModel: gig.ownGigFeeModel!,
        projectValue: gig.budgetAmount,
        feeAmount,
        currency: gig.budgetCurrency,
        status: "PENDING",
      },
    });

    created++;
  }

  return Response.json({ message: `Generated ${created} fee records`, created });
}
