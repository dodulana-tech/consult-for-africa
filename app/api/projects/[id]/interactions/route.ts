import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/projects/[id]/interactions
 * List all client interactions for a project.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const interactions = await prisma.clientInteraction.findMany({
    where: { engagementId: id },
    orderBy: { conductedAt: "desc" },
  });

  return Response.json({ interactions: interactions.map((i) => JSON.parse(JSON.stringify(i))) });
}

/**
 * POST /api/projects/[id]/interactions
 * Record a new client interaction (call, meeting, email, etc.).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canRecord = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canRecord) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Verify project exists
  const project = await prisma.engagement.findUnique({ where: { id }, select: { id: true } });
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const body = await req.json();
  const { type, summary, sentiment, conductedAt, nextActionDate, nextActionNote } = body;

  if (!type || !summary?.trim()) {
    return Response.json({ error: "type and summary are required" }, { status: 400 });
  }

  const validTypes = ["CALL", "MEETING", "EMAIL", "WORKSHOP", "SITE_VISIT", "REPORT_DELIVERY"];
  if (!validTypes.includes(type)) {
    return Response.json({ error: "Invalid interaction type" }, { status: 400 });
  }

  const interaction = await prisma.clientInteraction.create({
    data: {
      engagementId: id,
      type,
      summary: summary.trim(),
      sentiment: sentiment || "NEUTRAL",
      conductedById: session.user.id,
      conductedAt: conductedAt ? new Date(conductedAt) : new Date(),
      nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
      nextActionNote: nextActionNote?.trim() || null,
    },
  });

  return Response.json({ interaction: JSON.parse(JSON.stringify(interaction)) }, { status: 201 });
}
