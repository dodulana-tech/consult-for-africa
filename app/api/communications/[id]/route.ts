import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { isCommsElevated } from "@/lib/communications";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/communications/[id]
 * Returns a single communication with full event log and replies.
 */
export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const comm = await prisma.communication.findUnique({
    where: { id },
    include: {
      loggedBy: { select: { id: true, name: true, email: true } },
      nextActionAssignedTo: { select: { id: true, name: true, email: true } },
      replies: {
        include: { loggedBy: { select: { id: true, name: true } } },
        orderBy: { occurredAt: "asc" },
      },
      replyTo: {
        include: { loggedBy: { select: { id: true, name: true } } },
      },
      events: {
        include: { actorUser: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      participants: true,
    },
  });

  if (!comm) return Response.json({ error: "Not found" }, { status: 404 });

  // Visibility: PRIVATE only visible to logger
  if (comm.visibility === "PRIVATE" && comm.loggedById !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(comm);
});

/**
 * PATCH /api/communications/[id]
 * Update a communication (typically: outcome, nextAction, status, tags, body).
 */
export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.communication.findUnique({ where: { id }, select: { id: true, status: true, loggedById: true, visibility: true } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  if (existing.visibility === "PRIVATE" && existing.loggedById !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Allowed fields to update
  const allowed = [
    "subject", "body", "bodyHtml", "outcome", "sentiment", "nextAction",
    "nextActionAssignedToId", "tags", "isPinned", "isArchived", "visibility",
    "phoneNumber", "meetingLink", "meetingLocation", "type", "direction",
    "durationMinutes", "fromEmail", "toEmails", "ccEmails",
  ] as const;

  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.occurredAt !== undefined) data.occurredAt = new Date(body.occurredAt);
  if (body.nextActionDate !== undefined) {
    data.nextActionDate = body.nextActionDate ? new Date(body.nextActionDate) : null;
  }
  if (body.attachmentUrls !== undefined) {
    data.attachmentUrls = Array.isArray(body.attachmentUrls) ? body.attachmentUrls : [];
  }

  const statusChange = body.status && body.status !== existing.status ? body.status : null;
  if (statusChange) data.status = statusChange;

  const updated = await prisma.communication.update({
    where: { id },
    data: {
      ...data,
      events: statusChange
        ? {
            create: {
              type: "STATUS_CHANGED",
              fromStatus: existing.status,
              toStatus: statusChange,
              actorUserId: session.user.id,
              provider: "MANUAL",
            },
          }
        : {
            create: {
              type: "EDITED",
              actorUserId: session.user.id,
              provider: "MANUAL",
            },
          },
    },
    include: {
      loggedBy: { select: { id: true, name: true } },
      nextActionAssignedTo: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Communication",
    entityId: updated.id,
    entityName: updated.subject ?? `${updated.type} ${updated.direction}`,
    details: { fields: Object.keys(data) },
  });

  return Response.json(updated);
});

/**
 * DELETE /api/communications/[id]
 * Soft-delete by setting isArchived=true. Hard delete only by ADMIN.
 */
export const DELETE = handler(async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const hard = req.nextUrl.searchParams.get("hard") === "true";
  const existing = await prisma.communication.findUnique({ where: { id }, select: { id: true, loggedById: true, subject: true, type: true, direction: true } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  if (hard) {
    if (session.user.role !== "ADMIN") {
      return Response.json({ error: "Only admins can hard-delete communications" }, { status: 403 });
    }
    await prisma.communication.delete({ where: { id } });
  } else {
    await prisma.communication.update({
      where: { id },
      data: {
        isArchived: true,
        events: {
          create: {
            type: "EDITED",
            actorUserId: session.user.id,
            provider: "MANUAL",
            notes: "Archived",
          },
        },
      },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: hard ? "DELETE" : "UPDATE",
    entityType: "Communication",
    entityId: existing.id,
    entityName: existing.subject ?? `${existing.type} ${existing.direction}`,
    details: { hardDelete: hard },
  });

  return Response.json({ ok: true });
});
