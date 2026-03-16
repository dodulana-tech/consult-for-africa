import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import ProjectTabs from "@/components/platform/ProjectTabs";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      engagementManager: { select: { id: true, name: true, email: true } },
      assignments: {
        where: { status: { in: ["ACTIVE", "PENDING"] } },
        include: {
          consultant: { include: { consultantProfile: true } },
          deliverables: { select: { status: true } },
          timeEntries: {
            where: { status: "APPROVED" },
            select: { hours: true, billableAmount: true, currency: true },
          },
        },
      },
      milestones: { orderBy: { order: "asc" } },
      deliverables: {
        include: {
          assignment: { include: { consultant: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      updates: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      phases: {
        orderBy: { order: "asc" },
        include: {
          gates: { orderBy: { createdAt: "asc" } },
        },
      },
      risks: {
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!project) notFound();

  // Serialize Decimal fields
  const serialized = {
    ...project,
    budgetAmount: Number(project.budgetAmount),
    actualSpent: Number(project.actualSpent),
    budgetCurrency: project.budgetCurrency as "NGN" | "USD",
    startDate: project.startDate.toISOString(),
    endDate: project.endDate.toISOString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    assignments: project.assignments.map((a) => ({
      id: a.id,
      role: a.role,
      responsibilities: a.responsibilities,
      status: a.status,
      rateAmount: Number(a.rateAmount),
      rateCurrency: a.rateCurrency,
      rateType: a.rateType,
      estimatedHours: a.estimatedHours ?? null,
      startDate: a.startDate.toISOString(),
      endDate: a.endDate?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      deliverables: a.deliverables.map((d) => ({ status: d.status })),
      timeEntries: a.timeEntries.map((te) => ({
        hours: Number(te.hours),
        billableAmount: te.billableAmount ? Number(te.billableAmount) : null,
        currency: te.currency,
      })),
      consultant: {
        id: a.consultant.id,
        name: a.consultant.name,
        email: a.consultant.email,
        consultantProfile: a.consultant.consultantProfile
          ? {
              title: a.consultant.consultantProfile.title,
              location: a.consultant.consultantProfile.location,
              isDiaspora: a.consultant.consultantProfile.isDiaspora,
              expertiseAreas: a.consultant.consultantProfile.expertiseAreas,
              tier: a.consultant.consultantProfile.tier,
              averageRating: a.consultant.consultantProfile.averageRating
                ? Number(a.consultant.consultantProfile.averageRating)
                : null,
              availabilityStatus: a.consultant.consultantProfile.availabilityStatus,
              hourlyRateUSD: a.consultant.consultantProfile.hourlyRateUSD
                ? Number(a.consultant.consultantProfile.hourlyRateUSD)
                : null,
              monthlyRateNGN: a.consultant.consultantProfile.monthlyRateNGN
                ? Number(a.consultant.consultantProfile.monthlyRateNGN)
                : null,
            }
          : null,
      },
    })),
    milestones: project.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      status: m.status,
      order: m.order,
      dueDate: m.dueDate.toISOString(),
      completionDate: m.completionDate?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
    deliverables: project.deliverables.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      status: d.status,
      version: d.version,
      dueDate: d.dueDate?.toISOString() ?? null,
      reviewScore: d.reviewScore,
      reviewNotes: d.reviewNotes,
      assignmentId: d.assignmentId,
      submittedAt: d.submittedAt?.toISOString() ?? null,
      reviewedAt: d.reviewedAt?.toISOString() ?? null,
      approvedAt: d.approvedAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      assignment: d.assignment
        ? { id: d.assignment.id, consultant: { name: d.assignment.consultant.name } }
        : null,
    })),
    updates: project.updates.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    client: {
      ...project.client,
      createdAt: project.client.createdAt.toISOString(),
      updatedAt: project.client.updatedAt.toISOString(),
    },
    phases: project.phases.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      order: p.order,
      status: p.status as "PENDING" | "ACTIVE" | "COMPLETED" | "SKIPPED",
      percentComplete: p.percentComplete,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      completedAt: p.completedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      gates: p.gates.map((g) => ({
        id: g.id,
        name: g.name,
        passed: g.passed,
        passedAt: g.passedAt?.toISOString() ?? null,
        notes: g.notes,
      })),
    })),
    risks: project.risks.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      severity: r.severity as "RED" | "AMBER" | "GREEN",
      likelihood: r.likelihood,
      impact: r.impact,
      riskScore: r.riskScore,
      mitigation: r.mitigation,
      status: r.status as "OPEN" | "MITIGATING" | "RESOLVED" | "ACCEPTED",
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title={project.name} subtitle={project.client.name} />
      <ProjectTabs project={serialized} userId={session.user.id} userRole={session.user.role} />
    </div>
  );
}
