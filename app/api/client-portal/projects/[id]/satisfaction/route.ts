import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { NextRequest } from "next/server";

function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientPortalSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const period = getCurrentPeriod();

  // Verify project belongs to this client
  const project = await prisma.engagement.findFirst({
    where: { id: projectId, clientId: session.clientId },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const pulse = await prisma.clientSatisfactionPulse.findUnique({
    where: {
      engagementId_contactId_period: {
        engagementId: projectId,
        contactId: session.sub,
        period,
      },
    },
  });

  if (pulse) {
    return Response.json({
      submitted: true,
      pulse: {
        score: pulse.score,
        feedback: pulse.feedback,
        period: pulse.period,
        createdAt: pulse.createdAt,
      },
    });
  }

  return Response.json({ submitted: false });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientPortalSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  // Verify project belongs to this client
  const project = await prisma.engagement.findFirst({
    where: { id: projectId, clientId: session.clientId },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  let body: { score?: number; feedback?: string };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { score, feedback } = body;

  if (typeof score !== "number" || score < 1 || score > 5 || !Number.isInteger(score)) {
    return Response.json({ error: "Score must be an integer between 1 and 5" }, { status: 400 });
  }

  if (feedback && typeof feedback !== "string") {
    return Response.json({ error: "Feedback must be a string" }, { status: 400 });
  }

  if (feedback && feedback.length > 2000) {
    return Response.json({ error: "Feedback too long (max 2000 characters)" }, { status: 400 });
  }

  const period = getCurrentPeriod();

  // Check for existing submission this month (unique constraint will also catch this)
  const existing = await prisma.clientSatisfactionPulse.findUnique({
    where: {
      engagementId_contactId_period: {
        engagementId: projectId,
        contactId: session.sub,
        period,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return Response.json(
      { error: "You have already submitted a satisfaction pulse for this month" },
      { status: 409 }
    );
  }

  const pulse = await prisma.clientSatisfactionPulse.create({
    data: {
      engagementId: projectId,
      contactId: session.sub,
      score,
      feedback: feedback?.trim() || null,
      period,
    },
  });

  return Response.json({ id: pulse.id }, { status: 201 });
}
