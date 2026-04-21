import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canDeliver = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canDeliver) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { id: true, status: true, engagement: { select: { engagementManagerId: true } } },
  });

  if (!deliverable) return Response.json({ error: "Not found" }, { status: 404 });
  if (deliverable.status !== "APPROVED") {
    return Response.json({ error: "Only approved deliverables can be delivered to client" }, { status: 400 });
  }

  // EMs can only deliver on their own projects
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    if (deliverable.engagement.engagementManagerId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.deliverable.update({
    where: { id },
    data: { status: "DELIVERED_TO_CLIENT" },
    select: { id: true, name: true, status: true, engagementId: true },
  });

  await prisma.engagementUpdate.create({
    data: {
      engagementId: updated.engagementId,
      content: `Deliverable delivered to client: ${updated.name}`,
      type: "GENERAL",
      clientVisible: true,
      createdById: session.user.id,
    },
  });

  return Response.json({ ok: true, deliverable: updated });
});
