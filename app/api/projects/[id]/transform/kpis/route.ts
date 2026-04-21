import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

/* ── RAG thresholds ─────────────────────────────────────────────────────────── */

type Threshold = { field: string; green: number; amber: number; lowerIsBetter?: boolean };

const RAG_THRESHOLDS: Threshold[] = [
  { field: "bedOccupancyPct",       green: 75, amber: 60 },
  { field: "ebitdaMarginPct",       green: 15, amber: 5 },
  { field: "readmissionRatePct",    green: 5,  amber: 10, lowerIsBetter: true },
  { field: "staffTurnoverPct",      green: 10, amber: 20, lowerIsBetter: true },
  { field: "patientSatisfactionPct", green: 80, amber: 60 },               // not in schema but kept for future
  { field: "collectionRatePct",     green: 90, amber: 75 },
];

function computeRag(value: number | null | undefined, t: Threshold): "GREEN" | "AMBER" | "RED" | null {
  if (value == null) return null;
  if (t.lowerIsBetter) {
    if (value <= t.green) return "GREEN";
    if (value <= t.amber) return "AMBER";
    return "RED";
  }
  if (value >= t.green) return "GREEN";
  if (value >= t.amber) return "AMBER";
  return "RED";
}

function countRags(data: Record<string, unknown>): { redCount: number; amberCount: number; greenCount: number } {
  let redCount = 0, amberCount = 0, greenCount = 0;
  for (const t of RAG_THRESHOLDS) {
    const val = data[t.field];
    const num = val != null ? Number(val) : null;
    const rag = computeRag(num, t);
    if (rag === "RED") redCount++;
    else if (rag === "AMBER") amberCount++;
    else if (rag === "GREEN") greenCount++;
  }
  return { redCount, amberCount, greenCount };
}

/* ── GET: list snapshots ────────────────────────────────────────────────────── */

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, projectId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshots = await prisma.transformKPISnapshot.findMany({
    where: { engagementId: projectId },
    orderBy: { period: "desc" },
  });

  return Response.json(snapshots);
});

/* ── POST: create snapshot ──────────────────────────────────────────────────── */

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
  const isElevated = ELEVATED.includes(session.user.role);
  const canManage = isElevated || session.user.role === "ENGAGEMENT_MANAGER";
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const body = await req.json();

  // Validate period format YYYY-MM
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!body.period || !periodRegex.test(body.period)) {
    return Response.json({ error: "period must be in YYYY-MM format" }, { status: 400 });
  }

  if (!body.hospitalId) {
    return Response.json({ error: "hospitalId is required" }, { status: 400 });
  }

  // Auto-calculate RAG counts
  const { redCount, amberCount, greenCount } = countRags(body);

  const snapshot = await prisma.transformKPISnapshot.create({
    data: {
      hospitalId: body.hospitalId,
      engagementId: projectId,
      period: body.period,
      revenueMonthly: body.revenueMonthly ?? null,
      revenuePerBedDay: body.revenuePerBedDay ?? null,
      ebitdaMarginPct: body.ebitdaMarginPct ?? null,
      bedOccupancyPct: body.bedOccupancyPct ?? null,
      opdVolumeDaily: body.opdVolumeDaily ?? null,
      hmoDenialRatePct: body.hmoDenialRatePct ?? null,
      arDays: body.arDays ?? null,
      hmoPanelsCount: body.hmoPanelsCount ?? null,
      cleanClaimRatePct: body.cleanClaimRatePct ?? null,
      collectionRatePct: body.collectionRatePct ?? null,
      staffTurnoverPct: body.staffTurnoverPct ?? null,
      doctorBedRatio: body.doctorBedRatio ?? null,
      nurseBedRatio: body.nurseBedRatio ?? null,
      readmissionRatePct: body.readmissionRatePct ?? null,
      redCount,
      amberCount,
      greenCount,
      vsBaselineJson: body.vsBaselineJson ?? null,
      enteredBy: session.user.id,
      notes: body.notes ?? null,
      boardPackIncluded: body.boardPackIncluded ?? false,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "TransformKPISnapshot",
    entityId: snapshot.id,
    entityName: `KPI Snapshot ${body.period}`,
    engagementId: projectId,
  });

  return Response.json({ ok: true, snapshot }, { status: 201 });
});
