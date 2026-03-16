import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import OpportunityBoard from "@/components/platform/OpportunityBoard";

export default async function OpportunitiesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isConsultant = session.user.role === "CONSULTANT";

  const requests = await prisma.staffingRequest.findMany({
    where: { status: "OPEN" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          serviceType: true,
          startDate: true,
          endDate: true,
          client: { select: { name: true } },
        },
      },
      createdBy: { select: { name: true } },
      expressions: isConsultant
        ? { where: { consultantId: session.user.id } }
        : { select: { id: true, consultantId: true, status: true, consultant: { select: { name: true } } } },
      _count: { select: { expressions: true } },
    },
    orderBy: [
      { urgency: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Also get consultant's pending assignments
  const pendingAssignments = isConsultant
    ? await prisma.assignment.findMany({
        where: { consultantId: session.user.id, status: "PENDING_ACCEPTANCE" },
        include: {
          project: {
            select: { id: true, name: true, serviceType: true, client: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const serialized = requests.map((r) => ({
    id: r.id,
    projectId: r.project.id,
    projectName: r.project.name,
    clientName: r.project.client.name,
    serviceType: r.project.serviceType.replace(/_/g, " "),
    createdBy: r.createdBy.name,
    role: r.role,
    description: r.description,
    skillsRequired: r.skillsRequired,
    hoursPerWeek: r.hoursPerWeek,
    duration: r.duration,
    urgency: r.urgency,
    expressionCount: r._count.expressions,
    hasExpressed: isConsultant && r.expressions.length > 0,
    rateType: r.rateType,
    createdAt: r.createdAt.toISOString(),
  }));

  const serializedAssignments = pendingAssignments.map((a) => ({
    id: a.id,
    role: a.role,
    responsibilities: a.responsibilities,
    projectId: a.project.id,
    projectName: a.project.name,
    clientName: a.project.client.name,
    serviceType: a.project.serviceType.replace(/_/g, " "),
    estimatedHoursPerWeek: a.estimatedHoursPerWeek,
    rateAmount: Number(a.rateAmount),
    rateCurrency: a.rateCurrency,
    rateType: a.rateType,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Opportunities"
        subtitle={isConsultant ? "Find your next project" : "Open staffing requests"}
      />
      <OpportunityBoard
        opportunities={serialized}
        pendingAssignments={serializedAssignments}
        isConsultant={isConsultant}
      />
    </div>
  );
}
