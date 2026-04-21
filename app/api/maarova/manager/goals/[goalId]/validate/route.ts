import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * PATCH /api/maarova/manager/goals/[goalId]/validate
 * Sign off on a direct report's goal completion. Auth: MANAGER or HR_ADMIN.
 */
export const PATCH = handler(async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> },
) {
  const session = await getMaarovaSession();
  if (!session || !["MANAGER", "HR_ADMIN"].includes(session.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { goalId } = await params;

  // Find goal and verify the goal's user reports to this manager
  const goal = await prisma.maarovaDevelopmentGoal.findUnique({
    where: { id: goalId },
    select: {
      id: true,
      userId: true,
      managerValidated: true,
      user: { select: { managerId: true, organisationId: true } },
    },
  });

  if (!goal) {
    return Response.json({ error: "Goal not found" }, { status: 404 });
  }

  if (goal.user.managerId !== session.sub || goal.user.organisationId !== session.organisationId) {
    return Response.json({ error: "You are not the manager of this user" }, { status: 403 });
  }

  const updated = await prisma.maarovaDevelopmentGoal.update({
    where: { id: goalId },
    data: {
      managerValidated: !goal.managerValidated,
      managerValidatedAt: goal.managerValidated ? null : new Date(),
    },
    select: { id: true, managerValidated: true, managerValidatedAt: true },
  });

  return Response.json(updated);
});
