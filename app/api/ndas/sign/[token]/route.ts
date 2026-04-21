import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ token: string }> };

/**
 * GET /api/ndas/sign/:token
 * Get NDA details by signing token (for external parties).
 * No auth required - token is the auth.
 */
export const GET = handler(async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;

  const nda = await prisma.nda.findUnique({
    where: { signingToken: token },
    select: {
      id: true,
      type: true,
      version: true,
      status: true,
      partyAName: true,
      partyAOrg: true,
      partyATitle: true,
      partyAEmail: true,
      partyBName: true,
      partyBOrg: true,
      partyBTitle: true,
      partyBEmail: true,
      effectiveDate: true,
      signingTokenExp: true,
      engagement: { select: { id: true, name: true } },
    },
  });

  if (!nda) {
    return Response.json({ error: "Invalid or expired signing link" }, { status: 404 });
  }

  if (nda.signingTokenExp && new Date() > nda.signingTokenExp) {
    return Response.json({ error: "Signing link has expired" }, { status: 410 });
  }

  if (nda.status !== "PENDING_PARTY_A") {
    return Response.json({ error: "This NDA has already been signed", nda }, { status: 400 });
  }

  return Response.json({ nda });
});

/**
 * POST /api/ndas/sign/:token
 * Sign NDA using token (external party, no auth needed).
 * Body: { signature: "base64 image data" }
 */
export const POST = handler(async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const body = await req.json();
  const { signature } = body;

  if (!signature) {
    return Response.json({ error: "Signature is required" }, { status: 400 });
  }

  const nda = await prisma.nda.findUnique({
    where: { signingToken: token },
  });

  if (!nda) {
    return Response.json({ error: "Invalid or expired signing link" }, { status: 404 });
  }

  if (nda.signingTokenExp && new Date() > nda.signingTokenExp) {
    return Response.json({ error: "Signing link has expired" }, { status: 410 });
  }

  if (nda.status !== "PENDING_PARTY_A") {
    return Response.json({ error: "This NDA has already been signed" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  await prisma.nda.update({
    where: { id: nda.id },
    data: {
      partyASignature: signature,
      partyASignedAt: new Date(),
      partyAIp: ip,
      status: "PENDING_PARTY_B",
      // Invalidate token after use
      signingToken: null,
      signingTokenExp: null,
    },
  });

  return Response.json({ success: true, message: "NDA signed. Awaiting C4A countersignature." });
});
