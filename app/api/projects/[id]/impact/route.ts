import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, projectId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const metrics = await prisma.engagementImpactMetric.findMany({
    where: { engagementId: projectId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(
    metrics.map((m) => ({
      ...m,
      quantifiedValue: m.quantifiedValue ? Number(m.quantifiedValue) : null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }))
  );
});

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const { metricName, baselineValue, currentValue, unit, quantifiedValue, currency, clientQuote } = await req.json();

  if (!metricName?.trim()) return Response.json({ error: "metricName is required" }, { status: 400 });

  const metric = await prisma.engagementImpactMetric.create({
    data: {
      engagementId: projectId,
      metricName: metricName.trim(),
      baselineValue: baselineValue?.trim() || null,
      currentValue: currentValue?.trim() || null,
      unit: unit?.trim() || null,
      quantifiedValue: quantifiedValue ? Number(quantifiedValue) : null,
      currency: currency || null,
      clientQuote: clientQuote?.trim() || null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ImpactMetric",
    entityId: metric.id,
    entityName: metric.metricName,
    engagementId: projectId,
  });

  return Response.json(
    {
      ...metric,
      quantifiedValue: metric.quantifiedValue ? Number(metric.quantifiedValue) : null,
      createdAt: metric.createdAt.toISOString(),
      updatedAt: metric.updatedAt.toISOString(),
    },
    { status: 201 }
  );
});
