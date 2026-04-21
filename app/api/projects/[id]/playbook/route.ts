import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const playbook = await prisma.engagementPlaybook.findUnique({
    where: { engagementId },
    include: {
      assets: {
        include: {
          asset: true,
        },
      },
    },
  });

  return Response.json({ playbook });
});

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.engagementPlaybook.findUnique({
    where: { engagementId },
  });
  if (existing) {
    return Response.json({ error: "Playbook already exists for this engagement" }, { status: 409 });
  }

  const body = await req.json();
  const { templateUsed, phasesJson, notes } = body;

  const playbook = await prisma.engagementPlaybook.create({
    data: {
      engagementId,
      templateUsed: templateUsed ?? null,
      phasesJson: phasesJson ?? [
        { name: "Discovery", order: 1 },
        { name: "Analysis", order: 2 },
        { name: "Design", order: 3 },
        { name: "Implementation", order: 4 },
        { name: "Handover", order: 5 },
      ],
      notes: notes ?? null,
      status: "DRAFT",
    },
    include: {
      assets: {
        include: {
          asset: true,
        },
      },
    },
  });

  return Response.json({ playbook }, { status: 201 });
});

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { phasesJson, notes, status } = body;

  const data: Record<string, unknown> = {};
  if (phasesJson !== undefined) data.phasesJson = phasesJson;
  if (notes !== undefined) data.notes = notes;
  if (status !== undefined) data.status = status;

  const playbook = await prisma.engagementPlaybook.update({
    where: { engagementId },
    data,
    include: {
      assets: {
        include: {
          asset: true,
        },
      },
    },
  });

  return Response.json({ playbook });
});
