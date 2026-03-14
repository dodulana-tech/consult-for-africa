import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: projectId } = await params;

  const risks = await prisma.riskItem.findMany({
    where: { projectId },
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
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;
  const { title, description, category, severity, likelihood, impact, mitigation } = await req.json();

  if (!title?.trim()) return new Response("title is required", { status: 400 });

  const like = Math.min(5, Math.max(1, Number(likelihood) || 3));
  const imp = Math.min(5, Math.max(1, Number(impact) || 3));

  const risk = await prisma.riskItem.create({
    data: {
      projectId,
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

  return Response.json({ ok: true, risk }, { status: 201 });
}
