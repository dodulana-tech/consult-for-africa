import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { ServiceType, ProjectStatus, RiskLevel } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const {
    clientId,
    engagementManagerId,
    name,
    description,
    serviceType,
    status,
    startDate,
    endDate,
    budgetAmount,
    budgetCurrency,
    riskLevel,
    notes,
    methodologyId,
    budgetSensitivity,
    consultantTierMin,
    consultantTierMax,
    internEligible,
    pricingNotes,
  } = await req.json();

  if (!clientId || !name || !serviceType) {
    return new Response("clientId, name, and serviceType are required", { status: 400 });
  }

  const validServiceTypes: ServiceType[] = [
    "HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP",
    "CLINICAL_GOVERNANCE", "DIGITAL_HEALTH", "HEALTH_SYSTEMS",
    "DIASPORA_EXPERTISE", "EM_AS_SERVICE",
  ];
  if (!validServiceTypes.includes(serviceType)) {
    return new Response("Invalid serviceType", { status: 400 });
  }

  // If EM creating, default to themselves
  const emId: string = engagementManagerId ??
    (session.user.role === "ENGAGEMENT_MANAGER" ? session.user.id : session.user.id);

  if (!emId) {
    return new Response("engagementManagerId is required", { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      client: { connect: { id: clientId } },
      engagementManager: { connect: { id: emId } },
      name,
      description: description ?? null,
      serviceType: serviceType as ServiceType,
      status: (status as ProjectStatus) ?? "PLANNING",
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 365 * 86400000),
      budgetAmount: budgetAmount ? Number(budgetAmount) : 0,
      budgetCurrency: budgetCurrency ?? "NGN",
      riskLevel: (riskLevel as RiskLevel) ?? "LOW",
      healthScore: 5,
      actualSpent: 0,
      notes: notes ?? null,
      budgetSensitivity: budgetSensitivity ?? null,
      consultantTierMin: consultantTierMin ?? null,
      consultantTierMax: consultantTierMax ?? null,
      internEligible: !!internEligible,
      pricingNotes: pricingNotes ?? null,
      ...(methodologyId ? { methodologyTemplate: { connect: { id: methodologyId } } } : {}),
    },
    include: {
      client: { select: { name: true } },
      engagementManager: { select: { name: true } },
    },
  });

  // Auto-generate project phases from methodology template
  if (methodologyId) {
    const methodology = await prisma.methodologyTemplate.findUnique({
      where: { id: methodologyId },
      include: { phases: { orderBy: { order: "asc" } } },
    });
    if (methodology) {
      await prisma.projectPhase.createMany({
        data: methodology.phases.map((p) => ({
          projectId: project.id,
          name: p.name,
          description: p.description,
          order: p.order,
          status: "PENDING" as const,
          percentComplete: 0,
        })),
      });
    }
  }

  return Response.json({
    ...project,
    budgetAmount: Number(project.budgetAmount),
    actualSpent: Number(project.actualSpent),
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
}
