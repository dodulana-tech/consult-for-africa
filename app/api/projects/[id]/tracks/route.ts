import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]/tracks
 * List all tracks for an engagement, with assignment/deliverable counts.
 */
export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tracks = await prisma.engagementTrack.findMany({
    where: { engagementId: id },
    orderBy: { order: "asc" },
    include: {
      assignments: {
        where: { status: { in: ["ACTIVE", "PENDING", "PENDING_ACCEPTANCE"] } },
        select: {
          id: true,
          consultantId: true,
          role: true,
          trackRole: true,
          allocationPct: true,
          isBillable: true,
          status: true,
          consultant: { select: { id: true, name: true } },
        },
      },
      deliverables: {
        select: {
          id: true,
          name: true,
          status: true,
          assignmentId: true,
          dueDate: true,
        },
      },
      staffingRequests: {
        where: { status: "OPEN" },
        select: { id: true, role: true, status: true },
      },
    },
  });

  return Response.json({
    tracks: tracks.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      order: t.order,
      status: t.status,
      startDate: t.startDate?.toISOString() ?? null,
      endDate: t.endDate?.toISOString() ?? null,
      budgetAmount: t.budgetAmount ? Number(t.budgetAmount) : null,
      budgetCurrency: t.budgetCurrency,
      assignmentCount: t.assignments.length,
      deliverableCount: t.deliverables.length,
      completedDeliverables: t.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT").length,
      openStaffingRequests: t.staffingRequests.length,
      team: t.assignments.map((a) => ({
        assignmentId: a.id,
        consultantId: a.consultantId,
        consultantName: a.consultant.name,
        role: a.role,
        trackRole: a.trackRole,
        allocationPct: a.allocationPct,
        isBillable: a.isBillable,
        status: a.status,
      })),
      deliverables: t.deliverables.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        assigned: !!d.assignmentId,
        dueDate: d.dueDate?.toISOString() ?? null,
      })),
    })),
  });
});

/**
 * POST /api/projects/[id]/tracks
 * Create a new track for an engagement.
 */
export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Verify engagement exists
  const engagement = await prisma.engagement.findUnique({ where: { id }, select: { id: true } });
  if (!engagement) return Response.json({ error: "Engagement not found" }, { status: 404 });

  const body = await req.json();

  // Support bulk creation (array) or single
  const items = Array.isArray(body) ? body : [body];
  const created = [];

  for (const item of items) {
    if (!item.name?.trim()) continue;

    const maxOrder = await prisma.engagementTrack.aggregate({
      where: { engagementId: id },
      _max: { order: true },
    });

    const track = await prisma.engagementTrack.create({
      data: {
        engagementId: id,
        name: item.name.trim(),
        description: item.description?.trim() || null,
        order: item.order ?? (maxOrder._max.order ?? -1) + 1,
        status: "OPEN",
        startDate: item.startDate ? new Date(item.startDate) : null,
        endDate: item.endDate ? new Date(item.endDate) : null,
        budgetAmount: item.budgetAmount ?? null,
        budgetCurrency: item.budgetCurrency ?? null,
      },
    });

    created.push(track);

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      entityType: "EngagementTrack",
      entityId: track.id,
      entityName: track.name,
      engagementId: id,
    });
  }

  return Response.json({ tracks: created }, { status: 201 });
});

/**
 * PATCH /api/projects/[id]/tracks
 * Update a track (status, name, description, order, dates, budget).
 */
export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { trackId, name, description, status, order, startDate, endDate, budgetAmount, budgetCurrency } = body;

  if (!trackId) return Response.json({ error: "trackId required" }, { status: 400 });

  // Verify track belongs to this engagement
  const track = await prisma.engagementTrack.findFirst({
    where: { id: trackId, engagementId: id },
  });
  if (!track) return Response.json({ error: "Track not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (status !== undefined && ["OPEN", "ACTIVE", "PAUSED", "COMPLETED"].includes(status)) data.status = status;
  if (order !== undefined) data.order = order;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (budgetAmount !== undefined) data.budgetAmount = budgetAmount;
  if (budgetCurrency !== undefined) data.budgetCurrency = budgetCurrency;

  const updated = await prisma.engagementTrack.update({
    where: { id: trackId },
    data,
  });

  return Response.json({ track: updated });
});

/**
 * DELETE /api/projects/[id]/tracks
 * Delete a track (only if no active assignments or deliverables).
 */
export const DELETE = handler(async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { trackId } = await req.json();

  if (!trackId) return Response.json({ error: "trackId required" }, { status: 400 });

  const track = await prisma.engagementTrack.findFirst({
    where: { id: trackId, engagementId: id },
    include: {
      assignments: { where: { status: { in: ["ACTIVE", "PENDING", "PENDING_ACCEPTANCE"] } }, select: { id: true } },
      deliverables: { where: { status: { not: "DRAFT" } }, select: { id: true } },
    },
  });

  if (!track) return Response.json({ error: "Track not found" }, { status: 404 });

  if (track.assignments.length > 0) {
    return Response.json({ error: "Cannot delete track with active assignments. Remove or complete them first." }, { status: 400 });
  }

  if (track.deliverables.length > 0) {
    return Response.json({ error: "Cannot delete track with non-draft deliverables. Move or complete them first." }, { status: 400 });
  }

  // Unlink any draft deliverables from this track
  await prisma.deliverable.updateMany({
    where: { trackId },
    data: { trackId: null },
  });

  await prisma.engagementTrack.delete({ where: { id: trackId } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "EngagementTrack",
    entityId: trackId,
    entityName: track.name,
    engagementId: id,
  });

  return Response.json({ ok: true });
});
