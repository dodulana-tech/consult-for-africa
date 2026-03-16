import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, projectId))) {
    return new Response("Forbidden", { status: 403 });
  }

  const metrics = await prisma.projectImpactMetric.findMany({
    where: { projectId },
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
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;
  const { metricName, baselineValue, currentValue, unit, quantifiedValue, currency, clientQuote } = await req.json();

  if (!metricName?.trim()) return new Response("metricName is required", { status: 400 });

  const metric = await prisma.projectImpactMetric.create({
    data: {
      projectId,
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
    projectId,
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
}
