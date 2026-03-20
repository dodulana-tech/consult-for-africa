import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/discovery-calls
 * List discovery calls. DIRECTOR+ sees all, EM sees own.
 */
export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isElevated = ELEVATED.includes(session.user.role);
  const where = isElevated ? {} : { conductedById: session.user.id };

  const calls = await prisma.discoveryCall.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      conductedBy: { select: { id: true, name: true } },
      convertedToClient: { select: { id: true, name: true } },
    },
  });

  return Response.json({ calls });
}

/**
 * POST /api/discovery-calls
 * Create a new discovery call.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = [...ELEVATED, "ENGAGEMENT_MANAGER"].includes(session.user.role);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { organizationName, contactName, contactEmail, contactPhone, organizationType, scheduledAt, leadId } = body;

  if (!organizationName?.trim() || !contactName?.trim()) {
    return Response.json({ error: "Organization name and contact name are required" }, { status: 400 });
  }

  const call = await prisma.discoveryCall.create({
    data: {
      organizationName: organizationName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail?.trim() || null,
      contactPhone: contactPhone?.trim() || null,
      organizationType: organizationType || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      leadId: leadId || null,
      conductedById: session.user.id,
      status: "SCHEDULED",
    },
  });

  return Response.json({ call }, { status: 201 });
}
