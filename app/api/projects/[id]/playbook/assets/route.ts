import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const playbook = await prisma.engagementPlaybook.findUnique({
    where: { engagementId },
  });
  if (!playbook) {
    return Response.json({ error: "No playbook found for this engagement" }, { status: 404 });
  }

  const { assetId, phase, notes } = await req.json();
  if (!assetId) {
    return Response.json({ error: "assetId is required" }, { status: 400 });
  }

  const link = await prisma.playbookAssetLink.create({
    data: {
      playbookId: playbook.id,
      assetId,
      phase: phase ?? null,
      notes: notes ?? null,
    },
    include: {
      asset: true,
    },
  });

  // Increment engagement association count
  await prisma.libraryAsset.update({
    where: { id: assetId },
    data: { engagementAssociationCount: { increment: 1 } },
  });

  return Response.json({ link }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: engagementId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, engagementId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { linkId } = await req.json();
  if (!linkId) {
    return Response.json({ error: "linkId is required" }, { status: 400 });
  }

  const link = await prisma.playbookAssetLink.findUnique({
    where: { id: linkId },
    select: { assetId: true },
  });

  await prisma.playbookAssetLink.delete({
    where: { id: linkId },
  });

  if (link) {
    await prisma.libraryAsset.update({
      where: { id: link.assetId },
      data: { engagementAssociationCount: { decrement: 1 } },
    });
  }

  return Response.json({ ok: true });
}
