import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { NextRequest } from "next/server";

const VALID_SERVICE_TYPES = [
  "HOSPITAL_OPERATIONS",
  "TURNAROUND",
  "EMBEDDED_LEADERSHIP",
  "CLINICAL_GOVERNANCE",
  "DIGITAL_HEALTH",
  "HEALTH_SYSTEMS",
  "DIASPORA_EXPERTISE",
  "EM_AS_SERVICE",
] as const;

const VALID_URGENCY = ["normal", "urgent"] as const;

export async function GET() {
  const session = await getClientPortalSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.clientExpansionRequest.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    requests: requests.map((r) => ({
      id: r.id,
      serviceType: r.serviceType,
      description: r.description,
      urgency: r.urgency,
      status: r.status,
      projectId: r.engagementId,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getClientPortalSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    serviceType?: string;
    description?: string;
    urgency?: string;
    projectId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { serviceType, description, urgency, projectId } = body;

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    return Response.json({ error: "Description is required" }, { status: 400 });
  }

  if (description.trim().length > 5000) {
    return Response.json({ error: "Description too long (max 5000 characters)" }, { status: 400 });
  }

  if (serviceType && !VALID_SERVICE_TYPES.includes(serviceType as (typeof VALID_SERVICE_TYPES)[number])) {
    return Response.json({ error: "Invalid service type" }, { status: 400 });
  }

  const resolvedUrgency =
    urgency && VALID_URGENCY.includes(urgency as (typeof VALID_URGENCY)[number])
      ? urgency
      : "normal";

  // If projectId provided, verify it belongs to this client
  if (projectId) {
    const project = await prisma.engagement.findFirst({
      where: { id: projectId, clientId: session.clientId },
      select: { id: true },
    });
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const request = await prisma.clientExpansionRequest.create({
    data: {
      clientId: session.clientId,
      contactId: session.sub,
      serviceType: serviceType as (typeof VALID_SERVICE_TYPES)[number] | undefined,
      description: description.trim(),
      urgency: resolvedUrgency,
      engagementId: projectId || undefined,
    },
  });

  return Response.json({ id: request.id }, { status: 201 });
}
