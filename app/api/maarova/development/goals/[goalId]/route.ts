import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  const session = await getMaarovaSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId } = await params;

  // Verify ownership
  const existing = await prisma.maarovaDevelopmentGoal.findFirst({
    where: { id: goalId, userId: session.sub },
  });

  if (!existing) {
    return Response.json({ error: "Goal not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.progress !== undefined) {
    const progress = Math.min(100, Math.max(0, Number(body.progress)));
    updates.progress = progress;
    if (progress === 100 && existing.status !== "COMPLETED") {
      updates.status = "COMPLETED";
      updates.completedAt = new Date();
    }
  }

  if (body.status !== undefined) {
    const validStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DEFERRED"];
    if (!validStatuses.includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
    if (body.status === "COMPLETED") {
      updates.completedAt = new Date();
    } else {
      updates.completedAt = null;
    }
  }

  if (body.milestones !== undefined) {
    updates.milestones = body.milestones;
  }

  if (body.coachNotes !== undefined) {
    updates.coachNotes = body.coachNotes;
  }

  if (body.title !== undefined) {
    updates.title = body.title.trim();
  }

  if (body.description !== undefined) {
    updates.description = body.description.trim();
  }

  const updated = await prisma.maarovaDevelopmentGoal.update({
    where: { id: goalId },
    data: updates,
  });

  return Response.json(updated);
}
