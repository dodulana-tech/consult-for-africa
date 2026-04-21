import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * PATCH /api/maarova/org/users/[id]
 * Update user role or manager assignment. Auth: HR_ADMIN only.
 */
export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getMaarovaSession();
  if (!session || session.role !== "HR_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role, managerId } = body;

  // Verify user belongs to the same org
  const user = await prisma.maarovaUser.findFirst({
    where: { id, organisationId: session.organisationId },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "User not found in your organisation" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (role && ["USER", "MANAGER", "HR_ADMIN"].includes(role)) {
    updateData.role = role;
  }

  if (managerId !== undefined) {
    if (managerId === null) {
      updateData.managerId = null;
    } else {
      // Verify manager is in same org
      const manager = await prisma.maarovaUser.findFirst({
        where: { id: managerId, organisationId: session.organisationId },
        select: { id: true },
      });
      if (!manager) {
        return Response.json({ error: "Manager not found in your organisation" }, { status: 400 });
      }
      if (managerId === id) {
        return Response.json({ error: "A user cannot be their own manager" }, { status: 400 });
      }
      updateData.managerId = managerId;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.maarovaUser.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, role: true, managerId: true },
  });

  return Response.json({ user: updated });
});
