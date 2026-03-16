import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ELEVATED_ROLES = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isElevated = ELEVATED_ROLES.includes(session.user.role);

  const proposals = await prisma.proposal.findMany({
    where: isElevated ? {} : { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      clientName: true,
      clientContact: true,
      serviceType: true,
      budgetRange: true,
      timeline: true,
      status: true,
      sentAt: true,
      respondedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(proposals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ELEVATED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!title || !clientName || !content) {
    return NextResponse.json(
      { error: "title, clientName, and content are required" },
      { status: 400 },
    );
  }

  const clientContact = typeof body.clientContact === "string" ? body.clientContact.trim() || null : null;
  const serviceType = typeof body.serviceType === "string" ? body.serviceType : null;
  const budgetRange = typeof body.budgetRange === "string" ? body.budgetRange.trim() || null : null;
  const timeline = typeof body.timeline === "string" ? body.timeline.trim() || null : null;
  const challenges = Array.isArray(body.challenges) ? body.challenges.filter((c: unknown) => typeof c === "string" && c.trim()) : [];
  const objectives = Array.isArray(body.objectives) ? body.objectives.filter((o: unknown) => typeof o === "string" && o.trim()) : [];
  const clientId = typeof body.clientId === "string" ? body.clientId : null;
  const status = typeof body.status === "string" && ["DRAFT", "REVIEW"].includes(body.status) ? body.status : "DRAFT";

  // Validate clientId if provided
  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
  }

  // Validate serviceType enum
  const validServiceTypes = [
    "HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP",
    "CLINICAL_GOVERNANCE", "DIGITAL_HEALTH", "HEALTH_SYSTEMS",
    "DIASPORA_EXPERTISE", "EM_AS_SERVICE",
  ];
  const finalServiceType = serviceType && validServiceTypes.includes(serviceType) ? serviceType : null;

  const proposal = await prisma.proposal.create({
    data: {
      title,
      clientName,
      clientContact,
      serviceType: finalServiceType as "HOSPITAL_OPERATIONS" | "TURNAROUND" | "EMBEDDED_LEADERSHIP" | "CLINICAL_GOVERNANCE" | "DIGITAL_HEALTH" | "HEALTH_SYSTEMS" | "DIASPORA_EXPERTISE" | "EM_AS_SERVICE" | null,
      budgetRange,
      timeline,
      challenges,
      objectives,
      content,
      status: status as "DRAFT" | "REVIEW",
      clientId,
      createdById: session.user.id,
    },
    select: {
      id: true,
      title: true,
      clientName: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(proposal, { status: 201 });
}
