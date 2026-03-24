import { prisma } from "@/lib/prisma";

/**
 * Check if a consultant has an active NDA.
 * Used to gate access to project details and sensitive data.
 */
export async function hasActiveConsultantNda(userId: string): Promise<boolean> {
  const nda = await prisma.nda.findFirst({
    where: {
      consultantId: userId,
      type: "CONSULTANT_MASTER",
      status: "ACTIVE",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
  });

  return !!nda;
}

/**
 * Check if a client/engagement has an active NDA.
 */
export async function hasActiveEngagementNda(engagementId: string): Promise<boolean> {
  const nda = await prisma.nda.findFirst({
    where: {
      engagementId,
      status: "ACTIVE",
      type: { in: ["MUTUAL_CLIENT", "PROJECT_SPECIFIC"] },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
  });

  return !!nda;
}

/**
 * Get NDA status summary for a user.
 */
export async function getNdaStatus(userId: string): Promise<{
  hasActiveNda: boolean;
  pendingSignature: boolean;
  ndaId: string | null;
}> {
  const active = await prisma.nda.findFirst({
    where: {
      consultantId: userId,
      type: "CONSULTANT_MASTER",
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (active) {
    return { hasActiveNda: true, pendingSignature: false, ndaId: active.id };
  }

  const pending = await prisma.nda.findFirst({
    where: {
      consultantId: userId,
      type: "CONSULTANT_MASTER",
      status: { in: ["PENDING_PARTY_A", "PENDING_PARTY_B"] },
    },
    select: { id: true },
  });

  return {
    hasActiveNda: false,
    pendingSignature: !!pending,
    ndaId: pending?.id ?? null,
  };
}
