import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

// POST: Consultant expresses interest in a staffing request
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  if (session.user.role !== "CONSULTANT") {
    return new Response("Only consultants can express interest", { status: 403 });
  }

  const { id: staffingRequestId } = await params;
  const { note } = await req.json();

  const request = await prisma.staffingRequest.findUnique({
    where: { id: staffingRequestId },
    select: { id: true, status: true, role: true, projectId: true },
  });

  if (!request) return Response.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "OPEN") {
    return Response.json({ error: "This opportunity is no longer open" }, { status: 400 });
  }

  // Check for existing expression
  const existing = await prisma.staffingExpression.findUnique({
    where: { staffingRequestId_consultantId: { staffingRequestId, consultantId: session.user.id } },
  });

  if (existing) {
    return Response.json({ error: "You have already expressed interest" }, { status: 409 });
  }

  const expression = await prisma.staffingExpression.create({
    data: {
      staffingRequestId,
      consultantId: session.user.id,
      note: note?.trim() || null,
      status: "INTERESTED",
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "StaffingExpression",
    entityId: expression.id,
    entityName: `Interest in ${request.role}`,
    projectId: request.projectId,
  });

  return Response.json({ ok: true, expression }, { status: 201 });
}
