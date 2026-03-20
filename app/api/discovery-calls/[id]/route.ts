import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/discovery-calls/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const call = await prisma.discoveryCall.findUnique({
    where: { id },
    include: {
      conductedBy: { select: { id: true, name: true } },
      convertedToClient: { select: { id: true, name: true } },
    },
  });

  if (!call) return Response.json({ error: "Not found" }, { status: 404 });

  // Check access
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isElevated && call.conductedById !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ call });
}

/**
 * PATCH /api/discovery-calls/[id]
 * Update notes, status, structured fields.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.discoveryCall.findUnique({ where: { id }, select: { conductedById: true } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const isElevated = ELEVATED.includes(session.user.role);
  if (!isElevated && existing.conductedById !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  // Basic fields
  if (body.organizationName !== undefined) updateData.organizationName = body.organizationName.trim();
  if (body.contactName !== undefined) updateData.contactName = body.contactName.trim();
  if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail?.trim() || null;
  if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone?.trim() || null;
  if (body.organizationType !== undefined) updateData.organizationType = body.organizationType;
  if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

  // Status
  if (body.status !== undefined) {
    const valid = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELLED"];
    if (valid.includes(body.status)) {
      updateData.status = body.status;
      if (body.status === "COMPLETED" && !body.conductedAt) {
        updateData.conductedAt = new Date();
      }
      if (body.status === "IN_PROGRESS" && !body.conductedAt) {
        updateData.conductedAt = new Date();
      }
    }
  }
  if (body.conductedAt !== undefined) updateData.conductedAt = body.conductedAt ? new Date(body.conductedAt) : null;
  if (body.duration !== undefined) updateData.duration = body.duration ? parseInt(String(body.duration), 10) : null;

  // Structured notes
  if (body.rawNotes !== undefined) updateData.rawNotes = body.rawNotes;
  if (body.problemsIdentified !== undefined) updateData.problemsIdentified = body.problemsIdentified;
  if (body.goalsStated !== undefined) updateData.goalsStated = body.goalsStated;
  if (body.stakeholders !== undefined) updateData.stakeholders = body.stakeholders;
  if (body.budgetSignals !== undefined) updateData.budgetSignals = body.budgetSignals;
  if (body.urgencyLevel !== undefined) updateData.urgencyLevel = body.urgencyLevel;
  if (body.currentState !== undefined) updateData.currentState = body.currentState;

  const updated = await prisma.discoveryCall.update({
    where: { id },
    data: updateData,
    include: {
      conductedBy: { select: { id: true, name: true } },
      convertedToClient: { select: { id: true, name: true } },
    },
  });

  return Response.json({ call: updated });
}
