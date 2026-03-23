import { prisma } from "@/lib/prisma";

/**
 * Verify a user has access to a project based on their role.
 * - DIRECTOR/PARTNER/ADMIN: access all projects
 * - ENGAGEMENT_MANAGER: only projects they manage
 * - CONSULTANT: only projects they are assigned to
 *
 * Returns true if access is allowed, false otherwise.
 */
export async function canAccessProject(
  userId: string,
  userRole: string,
  projectId: string
): Promise<boolean> {
  // Elevated roles can access all projects
  if (["DIRECTOR", "PARTNER", "ADMIN"].includes(userRole)) {
    return true;
  }

  const project = await prisma.engagement.findUnique({
    where: { id: projectId },
    select: {
      engagementManagerId: true,
      assignments: { select: { consultantId: true }, where: { status: { in: ["ACTIVE", "PENDING"] } } },
    },
  });

  if (!project) return false;

  // EMs can access projects they manage
  if (userRole === "ENGAGEMENT_MANAGER") {
    return project.engagementManagerId === userId;
  }

  // Consultants can access projects they are assigned to
  return project.assignments.some((a) => a.consultantId === userId);
}
