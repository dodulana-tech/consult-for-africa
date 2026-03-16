import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET: Fetch all active assignments for the deliverable's project (for reassignment dropdown)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { projectId: true, assignmentId: true },
  });

  if (!deliverable) {
    return Response.json({ error: "Deliverable not found" }, { status: 404 });
  }

  // Verify EM owns this project
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    const project = await prisma.project.findUnique({
      where: { id: deliverable.projectId },
      select: { engagementManagerId: true },
    });
    if (project?.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const assignments = await prisma.assignment.findMany({
    where: { projectId: deliverable.projectId, status: "ACTIVE" },
    select: {
      id: true,
      role: true,
      consultant: {
        select: {
          id: true,
          name: true,
          consultantProfile: { select: { title: true, tier: true } },
        },
      },
    },
    orderBy: { consultant: { name: "asc" } },
  });

  return Response.json({ assignments, currentAssignmentId: deliverable.assignmentId });
}
