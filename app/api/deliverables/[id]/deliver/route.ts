import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canDeliver = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canDeliver) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { id: true, status: true, engagement: { select: { engagementManagerId: true } } },
  });

  if (!deliverable) return new Response("Not found", { status: 404 });
  if (deliverable.status !== "APPROVED") {
    return new Response("Only approved deliverables can be delivered to client", { status: 400 });
  }

  // EMs can only deliver on their own projects
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    if (deliverable.engagement.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const updated = await prisma.deliverable.update({
    where: { id },
    data: { status: "DELIVERED_TO_CLIENT" },
    select: { id: true, name: true, status: true },
  });

  return Response.json({ ok: true, deliverable: updated });
}
