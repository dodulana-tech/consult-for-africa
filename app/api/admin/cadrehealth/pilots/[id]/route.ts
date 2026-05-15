/**
 * Per-pilot operations.
 *
 * GET    /api/admin/cadrehealth/pilots/[id]    — full detail with candidates
 * PATCH  /api/admin/cadrehealth/pilots/[id]    — advance stage, edit, capture case study
 * DELETE /api/admin/cadrehealth/pilots/[id]    — unmark as pilot (does not delete the mandate)
 *
 * Stage advance auto-stamps the matching timestamp:
 *   OPEN          -> briefedAt
 *   SOURCING      -> sourcingStartedAt
 *   SHORTLISTED   -> shortlistedAt
 *   INTERVIEWING  -> interviewingAt
 *   OFFER_EXTENDED-> offerExtendedAt
 *   PLACED        -> placedAt + requires placedConsultantId
 *   CANCELLED     -> lostAt + lostReason
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/admin-notify";
import type { CadreMandateStatus } from "@prisma/client";

const ALLOWED = ["DIRECTOR", "PARTNER", "ADMIN"];
type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUS: CadreMandateStatus[] = [
  "OPEN", "SOURCING", "SHORTLISTED", "INTERVIEWING", "OFFER_EXTENDED", "PLACED", "CLOSED", "CANCELLED",
];

const STAGE_TO_FIELD: Record<string, string> = {
  OPEN: "briefedAt",
  SOURCING: "sourcingStartedAt",
  SHORTLISTED: "shortlistedAt",
  INTERVIEWING: "interviewingAt",
  OFFER_EXTENDED: "offerExtendedAt",
  PLACED: "placedAt",
  CANCELLED: "lostAt",
};

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const m = await prisma.cadreMandate.findUnique({
    where: { id },
    include: {
      facility: { select: { id: true, name: true, slug: true, state: true, city: true } },
      pilotOwner: { select: { id: true, name: true, email: true } },
      matches: {
        include: {
          professional: {
            select: { id: true, firstName: true, lastName: true, email: true, cadre: true, accountStatus: true, state: true, yearsOfExperience: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!m || !m.isPilot) return Response.json({ error: "Pilot not found" }, { status: 404 });

  return Response.json({
    ...m,
    placementFeeNGN: m.placementFeeNGN ? Number(m.placementFeeNGN) : null,
    salaryRangeMin: m.salaryRangeMin ? Number(m.salaryRangeMin) : null,
    salaryRangeMax: m.salaryRangeMax ? Number(m.salaryRangeMax) : null,
  });
});

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.cadreMandate.findUnique({
    where: { id },
    select: { id: true, title: true, isPilot: true, status: true },
  });
  if (!existing || !existing.isPilot) return Response.json({ error: "Pilot not found" }, { status: 404 });

  const data: Record<string, unknown> = {};

  // Stage advance
  if (body.status && body.status !== existing.status) {
    if (!VALID_STATUS.includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    if (body.status === "PLACED" && !body.placedConsultantId) {
      return Response.json({ error: "placedConsultantId is required when status is PLACED" }, { status: 400 });
    }
    if (body.status === "CANCELLED" && !body.lostReason?.trim()) {
      return Response.json({ error: "lostReason is required when status is CANCELLED" }, { status: 400 });
    }

    data.status = body.status;
    const stampField = STAGE_TO_FIELD[body.status];
    if (stampField) data[stampField] = new Date();

    if (body.status === "PLACED") {
      data.placedConsultantId = body.placedConsultantId;
      data.closedAt = new Date();
    }
    if (body.status === "CANCELLED") {
      data.lostReason = body.lostReason.trim();
      data.closedAt = new Date();
    }
  }

  // Editable fields
  if (body.pilotOwnerId !== undefined) data.pilotOwnerId = body.pilotOwnerId || null;
  if (body.pilotNotes !== undefined) data.pilotNotes = body.pilotNotes?.trim() || null;
  if (body.placementFeeNGN !== undefined) data.placementFeeNGN = body.placementFeeNGN ? Number(body.placementFeeNGN) : null;
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.facilityName !== undefined) data.facilityName = body.facilityName?.trim() || null;

  // Case study capture
  if (body.caseStudyApproved !== undefined) data.caseStudyApproved = !!body.caseStudyApproved;
  if (body.caseStudyApproved === true) data.caseStudyApprovedAt = new Date();
  if (body.caseStudyQuote !== undefined) data.caseStudyQuote = body.caseStudyQuote?.trim() || null;
  if (body.caseStudyContactName !== undefined) data.caseStudyContactName = body.caseStudyContactName?.trim() || null;
  if (body.caseStudyContactTitle !== undefined) data.caseStudyContactTitle = body.caseStudyContactTitle?.trim() || null;

  const updated = await prisma.cadreMandate.update({
    where: { id },
    data,
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "CadreMandate",
    entityId: id,
    entityName: existing.title,
    details: {
      ...(body.status && { stageChange: `${existing.status} -> ${body.status}` }),
      ...(body.caseStudyApproved === true && { caseStudyApproved: true }),
    },
  });

  // Admin notification on key transitions
  try {
    if (body.status === "PLACED") {
      await notifyAdmins({
        type: "PILOT_PLACED",
        severity: "SUCCESS",
        title: `Pilot placed: ${existing.title}`,
        body: `${existing.title} was just marked as PLACED. Capture the case study to use this for cold outreach.`,
        href: `/admin/cadrehealth/pilots`,
        metadata: { mandateId: id },
        emailAdmins: true,
      });
    } else if (body.status && body.status !== existing.status && body.status !== "CANCELLED" && body.status !== "CLOSED") {
      await notifyAdmins({
        type: "PILOT_STAGE_ADVANCED",
        severity: "INFO",
        title: `Pilot advanced: ${existing.title}`,
        body: `${existing.status.replace(/_/g, " ")} → ${body.status.replace(/_/g, " ")}`,
        href: `/admin/cadrehealth/pilots`,
        metadata: { mandateId: id, from: existing.status, to: body.status },
      });
    }
  } catch (e) {
    console.error("[pilot] admin notify failed:", e);
  }

  return Response.json(updated);
});

export const DELETE = handler(async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.cadreMandate.findUnique({
    where: { id },
    select: { id: true, title: true, isPilot: true },
  });
  if (!existing || !existing.isPilot) return Response.json({ error: "Pilot not found" }, { status: 404 });

  await prisma.cadreMandate.update({
    where: { id },
    data: { isPilot: false, pilotOwnerId: null, pilotNotes: null },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "CadreMandate",
    entityId: id,
    entityName: existing.title,
    details: { action: "unmarked-as-pilot" },
  });

  return Response.json({ ok: true });
});
