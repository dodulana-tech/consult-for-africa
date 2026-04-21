import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * PATCH /api/consultants/[id]/tier
 * Change a consultant's tier. Director+ only.
 * [id] is the ConsultantProfile ID.
 */
export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return Response.json({ error: "Only Directors and above can change consultant tiers" }, { status: 403 });
  }

  const { id } = await params;
  const { tier } = await req.json();

  const validTiers = ["INTERN", "EMERGING", "STANDARD", "EXPERIENCED", "ELITE"];
  if (!tier || !validTiers.includes(tier)) {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }

  const profile = await prisma.consultantProfile.findUnique({
    where: { id },
    select: { id: true, userId: true, tier: true, user: { select: { name: true } } },
  });

  if (!profile) {
    return Response.json({ error: "Consultant profile not found" }, { status: 404 });
  }

  const oldTier = profile.tier;

  await prisma.consultantProfile.update({
    where: { id },
    data: { tier },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "ConsultantProfile",
    entityId: id,
    entityName: `${profile.user.name} tier: ${oldTier} -> ${tier}`,
  });

  return Response.json({ ok: true, oldTier, newTier: tier });
});
