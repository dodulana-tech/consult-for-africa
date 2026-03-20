import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/leads
 * List leads. Elevated roles see all, others see assigned.
 */
export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isElevated = ELEVATED.includes(session.user.role);
  const where = isElevated ? {} : { assignedToId: session.user.id };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      assignedTo: { select: { id: true, name: true } },
      existingClient: { select: { id: true, name: true } },
      convertedToClient: { select: { id: true, name: true } },
      _count: { select: { discoveryCalls: true } },
    },
    take: 200,
  });

  return Response.json({
    leads: leads.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      discoveryCallCount: l._count.discoveryCalls,
    })),
  });
}

/**
 * POST /api/leads
 * Create a new lead manually (cold outreach, event, etc.).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    source, organizationName, contactName, contactEmail, contactPhone,
    contactRole, organizationType, country, city,
    knownPainPoints, serviceLineHook, estimatedSize,
    outreachStrategy, existingClientId,
  } = body;

  if (!organizationName?.trim()) {
    return Response.json({ error: "Organization name is required" }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      source: source || "COLD_OUTREACH",
      status: "NEW",
      organizationName: organizationName.trim(),
      contactName: contactName?.trim() || "Unknown",
      contactEmail: contactEmail?.trim().toLowerCase() || null,
      contactPhone: contactPhone?.trim() || null,
      contactRole: contactRole?.trim() || null,
      organizationType: organizationType || null,
      country: country?.trim() || null,
      city: city?.trim() || null,
      knownPainPoints: Array.isArray(knownPainPoints) ? knownPainPoints : [],
      serviceLineHook: serviceLineHook || null,
      estimatedSize: estimatedSize || null,
      outreachStrategy: outreachStrategy?.trim() || null,
      existingClientId: existingClientId || null,
      assignedToId: session.user.id,
    },
  });

  return Response.json({ lead }, { status: 201 });
}
