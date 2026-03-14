import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { ProjectStatus, RiskLevel } from "@prisma/client";

const VALID_STATUSES: ProjectStatus[] = ["PLANNING", "ACTIVE", "ON_HOLD", "AT_RISK", "COMPLETED", "CANCELLED"];
const VALID_RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canUpdate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canUpdate) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const { status, riskLevel, healthScore } = await req.json();

  if (status && !VALID_STATUSES.includes(status)) {
    return new Response("Invalid status", { status: 400 });
  }
  if (riskLevel && !VALID_RISK_LEVELS.includes(riskLevel)) {
    return new Response("Invalid riskLevel", { status: 400 });
  }
  if (healthScore !== undefined && (healthScore < 1 || healthScore > 10)) {
    return new Response("healthScore must be 1-10", { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, engagementManagerId: true },
  });
  if (!project) return new Response("Not found", { status: 404 });

  if (session.user.role === "ENGAGEMENT_MANAGER" && project.engagementManagerId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (riskLevel) data.riskLevel = riskLevel;
  if (healthScore !== undefined) data.healthScore = healthScore;

  const updated = await prisma.project.update({
    where: { id },
    data,
    select: { id: true, status: true, riskLevel: true, healthScore: true },
  });

  return Response.json({ ok: true, project: updated });
}
