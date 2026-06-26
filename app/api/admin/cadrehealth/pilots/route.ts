/**
 * White-glove pilot pipeline.
 *
 * GET /api/admin/cadrehealth/pilots
 *   List all pilots with their stage, time-in-stage, and time-to-fill metrics.
 *
 * POST /api/admin/cadrehealth/pilots
 *   Mark an existing mandate as a pilot OR create a new pilot mandate
 *   from scratch.
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import type { CadreProfessionalCadre, CadreMandateType } from "@prisma/client";

const ALLOWED = ["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"];

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const pilots = await prisma.cadreMandate.findMany({
    where: { isPilot: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      facility: { select: { id: true, name: true } },
      pilotOwner: { select: { id: true, name: true } },
      _count: { select: { matches: true } },
    },
  });

  // Aggregate stats for the funnel header
  const stages = ["OPEN", "SOURCING", "SHORTLISTED", "INTERVIEWING", "OFFER_EXTENDED", "PLACED"] as const;
  const counts: Record<string, number> = {};
  for (const s of stages) counts[s] = 0;
  for (const p of pilots) counts[p.status] = (counts[p.status] ?? 0) + 1;
  const total = pilots.length;
  const placed = pilots.filter((p) => p.status === "PLACED").length;
  const lost = pilots.filter((p) => p.status === "CANCELLED" || !!p.lostAt).length;

  // Compute time-to-shortlist and time-to-fill (in days) for placed pilots
  const placedPilots = pilots.filter((p) => p.placedAt && p.briefedAt);
  const fillTimes = placedPilots.map((p) => (p.placedAt!.getTime() - p.briefedAt!.getTime()) / (1000 * 60 * 60 * 24));
  const shortlistTimes = pilots
    .filter((p) => p.shortlistedAt && p.briefedAt)
    .map((p) => (p.shortlistedAt!.getTime() - p.briefedAt!.getTime()) / (1000 * 60 * 60 * 24));

  const avg = (arr: number[]) => arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  return Response.json({
    items: pilots.map((p) => ({
      id: p.id,
      title: p.title,
      facilityName: p.facilityName ?? p.facility?.name ?? null,
      cadre: p.cadre,
      status: p.status,
      pilotOwner: p.pilotOwner,
      briefedAt: p.briefedAt?.toISOString() ?? null,
      sourcingStartedAt: p.sourcingStartedAt?.toISOString() ?? null,
      shortlistedAt: p.shortlistedAt?.toISOString() ?? null,
      interviewingAt: p.interviewingAt?.toISOString() ?? null,
      offerExtendedAt: p.offerExtendedAt?.toISOString() ?? null,
      placedAt: p.placedAt?.toISOString() ?? null,
      lostAt: p.lostAt?.toISOString() ?? null,
      lostReason: p.lostReason,
      placementFeeNGN: p.placementFeeNGN ? Number(p.placementFeeNGN) : null,
      caseStudyApproved: p.caseStudyApproved,
      caseStudyQuote: p.caseStudyQuote,
      caseStudyContactName: p.caseStudyContactName,
      caseStudyContactTitle: p.caseStudyContactTitle,
      candidateCount: p._count.matches,
      createdAt: p.createdAt.toISOString(),
    })),
    summary: {
      total,
      placed,
      lost,
      active: total - placed - lost,
      stageBreakdown: counts,
      avgTimeToShortlistDays: avg(shortlistTimes),
      avgTimeToFillDays: avg(fillTimes),
      placementRate: total > 0 ? Math.round((placed / total) * 100) : 0,
    },
  });
});

const VALID_CADRES: CadreProfessionalCadre[] = [
  "MEDICINE", "DENTISTRY", "NURSING", "MIDWIFERY", "PHARMACY",
  "MEDICAL_LABORATORY_SCIENCE", "RADIOGRAPHY_IMAGING", "REHABILITATION_THERAPY",
  "OPTOMETRY", "COMMUNITY_HEALTH", "ENVIRONMENTAL_HEALTH", "NUTRITION_DIETETICS",
  "PSYCHOLOGY_SOCIAL_WORK", "PUBLIC_HEALTH", "HEALTH_RECORDS", "HOSPITAL_MANAGEMENT",
  "HEALTH_ADMINISTRATION", "BIOMEDICAL_ENGINEERING",
];

const VALID_TYPES: CadreMandateType[] = ["PERMANENT", "LOCUM", "CONTRACT", "CONSULTING", "INTERNATIONAL"];

/**
 * POST: create a new pilot mandate, or convert an existing mandate to a
 * pilot. Body shape:
 *
 * Existing -> pilot:
 *   { mandateId, pilotOwnerId, pilotNotes? }
 *
 * New pilot:
 *   { title, facilityName, cadre, type, locationState?, locationCity?,
 *     subSpecialty?, pilotOwnerId, pilotNotes? }
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.mandateId) {
    // Convert existing mandate
    const existing = await prisma.cadreMandate.findUnique({
      where: { id: body.mandateId },
      select: { id: true, title: true, isPilot: true, briefedAt: true },
    });
    if (!existing) return Response.json({ error: "Mandate not found" }, { status: 404 });

    const updated = await prisma.cadreMandate.update({
      where: { id: body.mandateId },
      data: {
        isPilot: true,
        pilotOwnerId: body.pilotOwnerId ?? session.user.id,
        pilotNotes: body.pilotNotes ?? null,
        briefedAt: existing.briefedAt ?? new Date(),
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "CadreMandate",
      entityId: updated.id,
      entityName: updated.title,
      details: { action: "marked-as-pilot" },
    });

    return Response.json(updated);
  }

  // New pilot mandate from scratch
  const { title, facilityName, cadre, type, locationState, locationCity, subSpecialty, pilotOwnerId, pilotNotes } = body;
  if (!title?.trim()) return Response.json({ error: "title is required" }, { status: 400 });
  if (!cadre || !VALID_CADRES.includes(cadre)) return Response.json({ error: "Invalid cadre" }, { status: 400 });
  if (!type || !VALID_TYPES.includes(type)) return Response.json({ error: "Invalid mandate type" }, { status: 400 });

  const mandate = await prisma.cadreMandate.create({
    data: {
      title: title.trim(),
      facilityName: facilityName?.trim() || null,
      cadre,
      subSpecialty: subSpecialty?.trim() || null,
      type,
      locationState: locationState?.trim() || null,
      locationCity: locationCity?.trim() || null,
      status: "OPEN",
      isPilot: true,
      pilotOwnerId: pilotOwnerId ?? session.user.id,
      pilotNotes: pilotNotes?.trim() || null,
      briefedAt: new Date(),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "CadreMandate",
    entityId: mandate.id,
    entityName: mandate.title,
    details: { isPilot: true, facility: facilityName },
  });

  return Response.json(mandate, { status: 201 });
});
