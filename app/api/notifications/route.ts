import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { role, id: userId } = session.user;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";

  const projectWhere = isElevated
    ? {}
    : isEM
    ? { engagementManagerId: userId }
    : { assignments: { some: { consultantId: userId } } };

  // Recent project updates (activity feed)
  const updates = await prisma.engagementUpdate.findMany({
    where: { engagement: projectWhere },
    include: {
      engagement: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Pending timesheets (EMs only)
  const pendingTimesheets = isEM || isElevated
    ? await prisma.timeEntry.count({
        where: { assignment: { engagement: projectWhere }, status: "PENDING" },
      })
    : 0;

  // Pending deliverable reviews (EMs only)
  const pendingReviews = isEM || isElevated
    ? await prisma.deliverable.count({
        where: { engagement: projectWhere, status: { in: ["SUBMITTED", "IN_REVIEW"] } },
      })
    : 0;

  // Approved entries awaiting payment (EMs only)
  const awaitingPayment = isEM || isElevated
    ? await prisma.timeEntry.count({
        where: { assignment: { engagement: projectWhere }, status: "APPROVED" },
      })
    : 0;

  // Consultant-specific: deliverables needing resubmission
  const needsResubmission = role === "CONSULTANT"
    ? await prisma.deliverable.count({
        where: { assignment: { consultantId: userId }, status: "NEEDS_REVISION" },
      })
    : 0;

  return Response.json({
    updates: updates.map((u) => ({
      id: u.id,
      content: u.content,
      type: u.type,
      projectId: u.engagement.id,
      projectName: u.engagement.name,
      createdByName: u.createdBy?.name ?? "C4A",
      createdAt: u.createdAt.toISOString(),
    })),
    badges: {
      pendingTimesheets,
      pendingReviews,
      awaitingPayment,
      needsResubmission,
    },
  });
});
