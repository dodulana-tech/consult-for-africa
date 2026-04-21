import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { EngagementStatus, RiskLevel } from "@prisma/client";
import { handler } from "@/lib/api-handler";

const VALID_STATUSES: EngagementStatus[] = ["PLANNING", "ACTIVE", "ON_HOLD", "AT_RISK", "COMPLETED", "CANCELLED"];
const VALID_RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canUpdate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canUpdate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, riskLevel, healthScore } = await req.json();

  if (status && !VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  if (riskLevel && !VALID_RISK_LEVELS.includes(riskLevel)) {
    return Response.json({ error: "Invalid riskLevel" }, { status: 400 });
  }
  if (healthScore !== undefined && (healthScore < 1 || healthScore > 10)) {
    return Response.json({ error: "healthScore must be 1-10" }, { status: 400 });
  }

  const project = await prisma.engagement.findUnique({
    where: { id },
    select: { id: true, engagementManagerId: true },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "ENGAGEMENT_MANAGER" && project.engagementManagerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (riskLevel) data.riskLevel = riskLevel;
  if (healthScore !== undefined) data.healthScore = healthScore;

  const updated = await prisma.engagement.update({
    where: { id },
    data,
    select: { id: true, status: true, riskLevel: true, healthScore: true },
  });

  // Log activity
  const parts: string[] = [];
  if (status) parts.push(`Status changed to ${status.replace(/_/g, " ")}`);
  if (riskLevel) parts.push(`Risk level set to ${riskLevel}`);
  if (healthScore !== undefined) parts.push(`Health score updated to ${healthScore}/10`);
  if (parts.length > 0) {
    await prisma.engagementUpdate.create({
      data: {
        engagementId: id,
        content: parts.join(". "),
        type: status === "AT_RISK" ? "ISSUE" : "GENERAL",
        createdById: session.user.id,
      },
    });
  }

  return Response.json({ ok: true, project: updated });
});
