import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET: List staffing requests (open opportunities)
// Consultants see OPEN requests matching their skills
// EMs see requests they created
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const isConsultant = session.user.role === "CONSULTANT";
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";

  const where = isConsultant
    ? { status: "OPEN" }
    : isEM
    ? { createdById: session.user.id }
    : isElevated
    ? {}
    : { status: "OPEN" };

  const requests = await prisma.staffingRequest.findMany({
    where,
    include: {
      engagement: { select: { id: true, name: true, serviceType: true, client: { select: { name: true } } } },
      createdBy: { select: { name: true } },
      expressions: isConsultant
        ? { where: { consultantId: session.user.id } }
        : { include: { consultant: { select: { id: true, name: true } } } },
      _count: { select: { expressions: true } },
    },
    orderBy: [{ urgency: "asc" }, { createdAt: "desc" }],
  });

  return Response.json(
    requests.map((r) => ({
      id: r.id,
      projectId: r.engagement.id,
      projectName: r.engagement.name,
      clientName: r.engagement.client.name,
      serviceType: r.engagement.serviceType,
      createdBy: r.createdBy.name,
      role: r.role,
      description: r.description,
      skillsRequired: r.skillsRequired,
      hoursPerWeek: r.hoursPerWeek,
      duration: r.duration,
      urgency: r.urgency,
      status: r.status,
      expressionCount: r._count.expressions,
      myExpression: isConsultant ? r.expressions[0] ?? null : undefined,
      expressions: !isConsultant ? r.expressions : undefined,
      rateBudget: r.rateBudget ? Number(r.rateBudget) : null,
      rateCurrency: r.rateCurrency,
      rateType: r.rateType,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

// POST: Create a staffing request (EM/elevated only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const canCreate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return new Response("Forbidden", { status: 403 });

  const { projectId, role, description, skillsRequired, hoursPerWeek, duration, rateType, rateBudget, rateCurrency, urgency, trackId } = await req.json();

  if (!projectId || !role?.trim() || !description?.trim() || !hoursPerWeek || !rateType) {
    return Response.json({ error: "projectId, role, description, hoursPerWeek, and rateType are required" }, { status: 400 });
  }

  // Validate trackId belongs to this engagement if provided
  if (trackId) {
    const track = await prisma.engagementTrack.findFirst({
      where: { id: trackId, engagementId: projectId },
    });
    if (!track) {
      return Response.json({ error: "Track not found or does not belong to this engagement" }, { status: 400 });
    }
  }

  const request = await prisma.staffingRequest.create({
    data: {
      engagementId: projectId,
      createdById: session.user.id,
      role: role.trim(),
      description: description.trim(),
      skillsRequired: skillsRequired ?? [],
      hoursPerWeek,
      duration: duration ?? null,
      rateType,
      rateBudget: rateBudget ?? null,
      rateCurrency: rateCurrency ?? "NGN",
      urgency: urgency ?? "normal",
      ...(trackId ? { trackId } : {}),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "StaffingRequest",
    entityId: request.id,
    entityName: `${role.trim()} for project`,
    engagementId: projectId,
  });

  return Response.json({ ok: true, request }, { status: 201 });
}
