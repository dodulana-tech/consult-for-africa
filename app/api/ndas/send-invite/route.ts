import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendNdaSigningInvite } from "@/lib/email";
import { NextRequest } from "next/server";

/**
 * POST /api/ndas/send-invite
 * Send (or resend) the NDA signing invitation email.
 * Body: { ndaId: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { ndaId } = await req.json();
  if (!ndaId) return Response.json({ error: "ndaId is required" }, { status: 400 });

  const nda = await prisma.nda.findUnique({
    where: { id: ndaId },
    select: {
      id: true,
      type: true,
      status: true,
      partyAName: true,
      partyAEmail: true,
      partyAOrg: true,
      partyBName: true,
      signingToken: true,
      engagement: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!nda) return Response.json({ error: "NDA not found" }, { status: 404 });

  if (!nda.signingToken) {
    return Response.json({ error: "No signing token available" }, { status: 400 });
  }

  const BASE_URL = process.env.NEXTAUTH_URL ?? "https://platform.consultforafrica.com";
  const signingUrl = `${BASE_URL}/sign-nda/${nda.signingToken}`;

  const typeLabel = nda.type === "CONSULTANT_MASTER"
    ? "Consultant Confidentiality Agreement"
    : "Mutual Non-Disclosure Agreement";

  await sendNdaSigningInvite({
    to: nda.partyAEmail,
    recipientName: nda.partyAName,
    ndaType: typeLabel,
    senderName: nda.createdBy.name,
    senderOrg: "Consult For Africa",
    signingUrl,
    projectName: nda.engagement?.name,
  });

  return Response.json({ success: true });
}
