import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * POST /api/own-gig/[id]/convert-to-cfa
 * Convert an own gig to a full C4A engagement.
 * Only elevated roles can do this.
 * Creates a referral credit for the original consultant owner.
 */
export const POST = handler(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Only Directors, Partners, and Admins can convert gigs" }, { status: 403 });
  }

  const { id } = await params;

  const gig = await prisma.engagement.findUnique({
    where: { id },
    select: {
      id: true,
      isOwnGig: true,
      ownGigOwnerId: true,
      client: { select: { id: true, name: true, primaryContact: true, email: true } },
    },
  });

  if (!gig || !gig.isOwnGig) {
    return Response.json({ error: "Own gig not found" }, { status: 404 });
  }

  if (!gig.ownGigOwnerId) {
    return Response.json({ error: "No owner found for this gig" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // Convert engagement
    await tx.engagement.update({
      where: { id },
      data: { isOwnGig: false },
    });

    // Create referral credit for original consultant
    await tx.referral.create({
      data: {
        referrerId: gig.ownGigOwnerId!,
        type: "CLIENT",
        name: gig.client.name,
        email: gig.client.email,
        organisation: gig.client.name,
        notes: `Converted from own gig engagement ${id}`,
        status: "CONVERTED",
      },
    });

    // Create lead record
    await tx.lead.create({
      data: {
        source: "OWN_GIG_CONVERSION",
        organizationName: gig.client.name,
        contactName: gig.client.primaryContact,
        contactEmail: gig.client.email,
        status: "CONVERTED",
        convertedToClientId: gig.client.id,
      },
    });
  });

  return Response.json({ message: "Gig converted to full C4A engagement. Referral credit created." });
});
