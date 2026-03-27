export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import ProjectTabs from "@/components/platform/ProjectTabs";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const project = await prisma.engagement.findUnique({
    where: { id },
    include: {
      client: true,
      engagementManager: { select: { id: true, name: true, email: true } },
      staffingRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { expressions: true } },
        },
      },
      assignments: {
        where: { status: { in: ["ACTIVE", "PENDING", "PENDING_ACCEPTANCE"] } },
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
      tracks: {
        orderBy: { order: "asc" },
        include: {
          assignments: {
            where: { status: { in: ["ACTIVE", "PENDING", "PENDING_ACCEPTANCE"] } },
            include: { consultant: { select: { id: true, name: true } } },
          },
          deliverables: { select: { id: true, name: true, status: true, assignmentId: true, dueDate: true } },
          staffingRequests: { where: { status: "OPEN" }, select: { id: true, role: true } },
        },
      },
      interactions: {
        orderBy: { conductedAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  // Serialize Decimal fields
  const serialized = {
    ...project,
    engagementType: project.engagementType as "PROJECT" | "RETAINER" | "SECONDMENT" | "FRACTIONAL" | "TRANSFORMATION" | "TRANSACTION",
    budgetAmount: Number(project.budgetAmount),
    actualSpent: Number(project.actualSpent),
    budgetCurrency: project.budgetCurrency as "NGN" | "USD",
    startDate: project.startDate.toISOString(),
    endDate: project.endDate?.toISOString() ?? new Date().toISOString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    // RETAINER fields
    retainerMonthlyFee: project.retainerMonthlyFee ? Number(project.retainerMonthlyFee) : null,
    retainerHoursPool: project.retainerHoursPool,
    retainerAutoRenew: project.retainerAutoRenew,
    retainerNoticePeriodDays: project.retainerNoticePeriodDays,
    // SECONDMENT fields
    secondeeClientLineManager: project.secondeeClientLineManager,
    secondeeRecallClauseDays: project.secondeeRecallClauseDays,
    secondeeMonthlyFee: project.secondeeMonthlyFee ? Number(project.secondeeMonthlyFee) : null,
    // FRACTIONAL fields
    fractionalPlacedName: project.fractionalPlacedName,
    fractionalRoleTitle: project.fractionalRoleTitle,
    fractionalCommissionPct: project.fractionalCommissionPct ? Number(project.fractionalCommissionPct) : null,
    fractionalArrangementFee: project.fractionalArrangementFee ? Number(project.fractionalArrangementFee) : null,
    // TRANSFORMATION fields
    transformHospitalId: project.transformHospitalId,
    transformEquityPct: project.transformEquityPct ? Number(project.transformEquityPct) : null,
    transformDealStructure: project.transformDealStructure,
    transformEntryValuation: project.transformEntryValuation ? Number(project.transformEntryValuation) : null,
    transformBoardSeat: project.transformBoardSeat,
    transformStepInTrigger: project.transformStepInTrigger,
    transformExitMonths: project.transformExitMonths,
    // TRANSACTION fields
    transactionMandateType: project.transactionMandateType,
    transactionTargetCompany: project.transactionTargetCompany,
    transactionDealSize: project.transactionDealSize ? Number(project.transactionDealSize) : null,
    transactionSuccessFeePct: project.transactionSuccessFeePct ? Number(project.transactionSuccessFeePct) : null,
    transactionCloseDate: project.transactionCloseDate?.toISOString() ?? null,
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
      fee: d.fee ? Number(d.fee) : null,
      feeCurrency: d.feeCurrency,
      feePaidAt: d.feePaidAt?.toISOString() ?? null,
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
    interactions: project.interactions.map((i) => ({
      id: i.id,
      type: i.type,
      summary: i.summary,
      sentiment: i.sentiment,
      conductedById: i.conductedById,
      conductedAt: i.conductedAt.toISOString(),
      nextActionDate: i.nextActionDate?.toISOString() ?? null,
      nextActionNote: i.nextActionNote,
      createdAt: i.createdAt.toISOString(),
    })),
    staffingRequests: project.staffingRequests.map((sr) => ({
      id: sr.id,
      role: sr.role,
      description: sr.description,
      skillsRequired: sr.skillsRequired,
      hoursPerWeek: sr.hoursPerWeek,
      duration: sr.duration,
      rateType: sr.rateType,
      rateBudget: sr.rateBudget ? Number(sr.rateBudget) : null,
      rateCurrency: sr.rateCurrency,
      urgency: sr.urgency,
      status: sr.status,
      expressionCount: sr._count.expressions,
      createdAt: sr.createdAt.toISOString(),
    })),
    tracks: project.tracks.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      order: t.order,
      status: t.status,
      startDate: t.startDate?.toISOString() ?? null,
      endDate: t.endDate?.toISOString() ?? null,
      budgetAmount: t.budgetAmount ? Number(t.budgetAmount) : null,
      budgetCurrency: t.budgetCurrency,
      team: t.assignments.map((a) => ({
        assignmentId: a.id,
        consultantId: a.consultant.id,
        consultantName: a.consultant.name,
        role: a.role,
        trackRole: a.trackRole,
        allocationPct: a.allocationPct,
        isBillable: a.isBillable,
        status: a.status,
      })),
      deliverables: t.deliverables.map((d) => ({
        id: d.id,
        name: d.name,
        status: d.status,
        assigned: !!d.assignmentId,
        dueDate: d.dueDate?.toISOString() ?? null,
      })),
      openStaffingRequests: t.staffingRequests.length,
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
