import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { milestoneId } = await params;
  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.description !== undefined) updateData.description = body.description.trim();
  if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
  if (body.status !== undefined) {
    const valid = ["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED", "SKIPPED"];
    if (valid.includes(body.status)) {
      updateData.status = body.status;
      if (body.status === "COMPLETED") updateData.completionDate = new Date();
      else updateData.completionDate = null;
    }
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: updateData,
  });

  return Response.json({ milestone: JSON.parse(JSON.stringify(updated)) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { milestoneId } = await params;
  await prisma.milestone.delete({ where: { id: milestoneId } });
  return Response.json({ ok: true });
}
