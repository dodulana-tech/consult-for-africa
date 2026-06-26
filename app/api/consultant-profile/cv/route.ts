/**
 * Consultant CV management.
 *
 * - PUT: upload or replace a consultant's CV. The consultant themselves
 *   can do this for their own profile. EM/Director/Partner/Admin can do
 *   it on behalf of any consultant (e.g. when an admin invites someone
 *   directly without going through the talent application flow).
 * - DELETE: remove a consultant's CV (same role rules).
 *
 * The actual file is already uploaded to R2 via /api/upload; this
 * endpoint only persists the URL on the ConsultantProfile.
 */

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";

const ELEVATED = ["ENGAGEMENT_MANAGER", "ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"] as const;

function canManageCvFor(sessionUserId: string, sessionRole: string, targetUserId: string): boolean {
  if (sessionUserId === targetUserId) return true;
  return (ELEVATED as readonly string[]).includes(sessionRole);
}

export const PUT = handler(async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, cvFileUrl, cvText } = await req.json();
  if (!userId) return Response.json({ error: "userId is required" }, { status: 400 });
  if (!cvFileUrl && !cvText) {
    return Response.json({ error: "Provide cvFileUrl, cvText, or both" }, { status: 400 });
  }
  if (cvFileUrl && typeof cvFileUrl !== "string") {
    return Response.json({ error: "cvFileUrl must be a string" }, { status: 400 });
  }

  if (!canManageCvFor(session.user.id, session.user.role, userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId },
    select: { id: true, user: { select: { id: true, name: true } } },
  });
  if (!profile) return Response.json({ error: "Consultant profile not found" }, { status: 404 });

  const data: Record<string, unknown> = {
    cvUploadedAt: new Date(),
    cvUploadedById: session.user.id,
  };
  if (cvFileUrl !== undefined) data.cvFileUrl = cvFileUrl || null;
  if (cvText !== undefined) data.cvText = cvText || null;

  const updated = await prisma.consultantProfile.update({
    where: { id: profile.id },
    data,
    select: { cvFileUrl: true, cvText: true, cvUploadedAt: true, cvUploadedById: true },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "ConsultantProfile",
    entityId: profile.id,
    entityName: profile.user.name,
    details: {
      action: "cv-uploaded",
      onBehalfOf: session.user.id !== userId,
      hasFile: !!updated.cvFileUrl,
      hasText: !!updated.cvText,
    },
  });

  return Response.json({
    ok: true,
    cvFileUrl: updated.cvFileUrl,
    cvUploadedAt: updated.cvUploadedAt?.toISOString() ?? null,
  });
});

export const DELETE = handler(async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();
  if (!userId) return Response.json({ error: "userId is required" }, { status: 400 });

  if (!canManageCvFor(session.user.id, session.user.role, userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId },
    select: { id: true, user: { select: { name: true } } },
  });
  if (!profile) return Response.json({ error: "Consultant profile not found" }, { status: 404 });

  await prisma.consultantProfile.update({
    where: { id: profile.id },
    data: {
      cvFileUrl: null,
      cvText: null,
      cvUploadedAt: null,
      cvUploadedById: null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "ConsultantProfile",
    entityId: profile.id,
    entityName: profile.user.name,
    details: { action: "cv-removed" },
  });

  return Response.json({ ok: true });
});
