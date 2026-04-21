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

  const risks = await prisma.riskItem.findMany({
    where: { engagementId: projectId },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      likelihood: true,
      impact: true,
      riskScore: true,
      mitigation: true,
      status: true,
      resolvedAt: true,
      createdAt: true,
    },
  });

  return Response.json(risks);
});

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const { title, description, category, severity, likelihood, impact, mitigation } = await req.json();

  if (!title?.trim()) return Response.json({ error: "title is required" }, { status: 400 });

  const like = Math.min(5, Math.max(1, Number(likelihood) || 3));
  const imp = Math.min(5, Math.max(1, Number(impact) || 3));

  const risk = await prisma.riskItem.create({
    data: {
      engagementId: projectId,
      createdById: session.user.id,
      title: title.trim(),
      description: description?.trim() ?? "",
      category: category?.trim() || "Operational",
      severity: severity || "AMBER",
      likelihood: like,
      impact: imp,
      riskScore: like * imp,
      mitigation: mitigation?.trim() ?? null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      likelihood: true,
      impact: true,
      riskScore: true,
      mitigation: true,
      status: true,
      resolvedAt: true,
      createdAt: true,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Risk",
    entityId: risk.id,
    entityName: risk.title,
    engagementId: projectId,
  });

  return Response.json({ ok: true, risk }, { status: 201 });
});
