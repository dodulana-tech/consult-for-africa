import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/* ── GET: fetch exit dossier ────────────────────────────────────────────────── */

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, projectId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const dossier = await prisma.exitDossier.findFirst({
    where: { engagementId: projectId },
  });

  return Response.json(dossier);
}

/* ── POST: upsert exit dossier ──────────────────────────────────────────────── */

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isElevated) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const body = await req.json();

  if (!body.hospitalId) {
    return Response.json({ error: "hospitalId is required" }, { status: 400 });
  }

  const VALID_STATUSES = ["NOT_STARTED", "PREPARATION", "ACTIVE_PROCESS", "CLOSED"];
  const status = VALID_STATUSES.includes(body.status) ? body.status : "NOT_STARTED";

  const dossier = await prisma.exitDossier.upsert({
    where: { hospitalId: body.hospitalId },
    create: {
      hospitalId: body.hospitalId,
      engagementId: projectId,
      exitEbitda: body.exitEbitda ?? null,
      exitMultipleApplied: body.exitMultipleApplied ?? null,
      exitValuation: body.exitValuation ?? null,
      exitValRangeLow: body.exitValRangeLow ?? null,
      exitValRangeHigh: body.exitValRangeHigh ?? null,
      dataRoomCompletenessPct: body.dataRoomCompletenessPct ?? null,
      documentsJson: body.documentsJson ?? null,
      buyersJson: body.buyersJson ?? null,
      imVersion: body.imVersion ?? null,
      imUrl: body.imUrl ?? null,
      ndaLogJson: body.ndaLogJson ?? null,
      ioiLogJson: body.ioiLogJson ?? null,
      preferredBidder: body.preferredBidder ?? null,
      equityProceeds: body.equityProceeds ?? null,
      managementFeesTotal: body.managementFeesTotal ?? null,
      totalCfaReturn: body.totalCfaReturn ?? null,
      realisedMoic: body.realisedMoic ?? null,
      realisedIrr: body.realisedIrr ?? null,
      status,
    },
    update: {
      exitEbitda: body.exitEbitda ?? undefined,
      exitMultipleApplied: body.exitMultipleApplied ?? undefined,
      exitValuation: body.exitValuation ?? undefined,
      exitValRangeLow: body.exitValRangeLow ?? undefined,
      exitValRangeHigh: body.exitValRangeHigh ?? undefined,
      dataRoomCompletenessPct: body.dataRoomCompletenessPct ?? undefined,
      documentsJson: body.documentsJson ?? undefined,
      buyersJson: body.buyersJson ?? undefined,
      imVersion: body.imVersion ?? undefined,
      imUrl: body.imUrl ?? undefined,
      ndaLogJson: body.ndaLogJson ?? undefined,
      ioiLogJson: body.ioiLogJson ?? undefined,
      preferredBidder: body.preferredBidder ?? undefined,
      equityProceeds: body.equityProceeds ?? undefined,
      managementFeesTotal: body.managementFeesTotal ?? undefined,
      totalCfaReturn: body.totalCfaReturn ?? undefined,
      realisedMoic: body.realisedMoic ?? undefined,
      realisedIrr: body.realisedIrr ?? undefined,
      status,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "ExitDossier",
    entityId: dossier.id,
    entityName: `Exit Dossier`,
    engagementId: projectId,
  });

  return Response.json({ ok: true, dossier }, { status: 200 });
}
