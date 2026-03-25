import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/leads/[id]
 */
const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true } },
      existingClient: { select: { id: true, name: true } },
      convertedToClient: { select: { id: true, name: true } },
      referrals: { select: { id: true, name: true, email: true, notes: true, referrer: { select: { name: true } } } },
      discoveryCalls: {
        select: { id: true, status: true, aiSummary: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

  // Only assignee or elevated roles can view
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isElevated && lead.assignedToId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ lead: JSON.parse(JSON.stringify(lead)) });
}

/**
 * PATCH /api/leads/[id]
 * Update lead fields: status, research, outreach, qualification, etc.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify the user has access to this lead
  const lead = await prisma.lead.findUnique({ where: { id }, select: { assignedToId: true } });
  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isElevated && lead.assignedToId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const updateData: Record<string, unknown> = {};

  // Status
  const validStatuses = ["NEW", "RESEARCHING", "OUTREACH", "RESPONDED", "DISCOVERY_SCHEDULED", "PROPOSAL_SENT", "CONVERTED", "LOST"];
  if (body.status && validStatuses.includes(body.status)) updateData.status = body.status;

  // Contact info
  if (body.organizationName !== undefined) updateData.organizationName = body.organizationName.trim();
  if (body.contactName !== undefined) updateData.contactName = body.contactName.trim();
  if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail?.trim().toLowerCase() || null;
  if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone?.trim() || null;
  if (body.contactRole !== undefined) updateData.contactRole = body.contactRole?.trim() || null;
  if (body.organizationType !== undefined) updateData.organizationType = body.organizationType;
  if (body.country !== undefined) updateData.country = body.country?.trim() || null;
  if (body.city !== undefined) updateData.city = body.city?.trim() || null;

  // Research
  if (body.decisionMakers !== undefined) updateData.decisionMakers = body.decisionMakers;
  if (body.knownPainPoints !== undefined) updateData.knownPainPoints = body.knownPainPoints;
  if (body.recentNews !== undefined) updateData.recentNews = body.recentNews;
  if (body.competitorPresence !== undefined) updateData.competitorPresence = body.competitorPresence;
  if (body.estimatedSize !== undefined) updateData.estimatedSize = body.estimatedSize;
  if (body.serviceLineHook !== undefined) updateData.serviceLineHook = body.serviceLineHook;

  // Outreach
  if (body.outreachStrategy !== undefined) updateData.outreachStrategy = body.outreachStrategy;
  if (body.outreachAttempts !== undefined) updateData.outreachAttempts = body.outreachAttempts;

  // Qualification
  if (body.qualificationScore !== undefined) updateData.qualificationScore = body.qualificationScore;
  if (body.qualificationNotes !== undefined) updateData.qualificationNotes = body.qualificationNotes;
  if (body.lostReason !== undefined) updateData.lostReason = body.lostReason;

  // Assignment
  if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: updateData,
  });

  return Response.json({ lead: JSON.parse(JSON.stringify(updated)) });
}
