import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import crypto from "crypto";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/ndas
 * List NDAs. Filtered by role.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const engagementId = searchParams.get("engagementId");
  const clientId = searchParams.get("clientId");
  const consultantId = searchParams.get("consultantId");
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const isElevated = ELEVATED.includes(session.user.role);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (!isElevated) {
    // Consultants only see their own NDAs
    where.OR = [
      { consultantId: session.user.id },
      { createdById: session.user.id },
    ];
  }

  if (engagementId) where.engagementId = engagementId;
  if (clientId) where.clientId = clientId;
  if (consultantId) where.consultantId = consultantId;
  if (type) where.type = type;
  if (status) where.status = status;

  const ndas = await prisma.nda.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      engagement: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      consultant: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return Response.json({ ndas });
}

/**
 * POST /api/ndas
 * Create a new NDA and generate signing token.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = [...ELEVATED, "ENGAGEMENT_MANAGER"].includes(session.user.role);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    type,
    partyAName,
    partyAOrg,
    partyATitle,
    partyAEmail,
    partyBName,
    partyBTitle,
    partyBEmail,
    engagementId,
    clientId,
    consultantId,
  } = body;

  if (!type || !partyAName?.trim() || !partyAEmail?.trim()) {
    return Response.json(
      { error: "Type, Party A name, and email are required" },
      { status: 400 }
    );
  }

  // Generate signing token for external parties
  const signingToken = crypto.randomBytes(32).toString("hex");
  const signingTokenExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const nda = await prisma.nda.create({
    data: {
      type,
      partyAName: partyAName.trim(),
      partyAOrg: partyAOrg?.trim() || partyAName.trim(),
      partyATitle: partyATitle?.trim() || null,
      partyAEmail: partyAEmail.trim(),
      partyBName: partyBName?.trim() || "Consult For Africa",
      partyBOrg: "Consult For Africa",
      partyBTitle: partyBTitle?.trim() || null,
      partyBEmail: partyBEmail?.trim() || null,
      effectiveDate: new Date(),
      engagementId: engagementId || null,
      clientId: clientId || null,
      consultantId: consultantId || null,
      signingToken,
      signingTokenExp,
      createdById: session.user.id,
      status: "PENDING_PARTY_A",
    },
    include: {
      engagement: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return Response.json({ nda, signingToken }, { status: 201 });
}
