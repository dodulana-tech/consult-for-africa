import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

// GET: Fetch all active assignments for the deliverable's project (for reassignment dropdown)
export const GET = handler(async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { engagementId: true, assignmentId: true },
  });

  if (!deliverable) {
    return Response.json({ error: "Deliverable not found" }, { status: 404 });
  }

  // Verify EM owns this project
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    const project = await prisma.engagement.findUnique({
      where: { id: deliverable.engagementId },
      select: { engagementManagerId: true },
    });
    if (project?.engagementManagerId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const assignments = await prisma.assignment.findMany({
    where: { engagementId: deliverable.engagementId, status: "ACTIVE" },
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
});
