import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { content, type } = await req.json();
  if (!content?.trim()) return new Response("Content required", { status: 400 });

  // Verify caller has access to this project
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    const project = await prisma.engagement.findUnique({
      where: { id },
      select: { engagementManagerId: true, isOwnGig: true, ownGigOwnerId: true, assignments: { select: { consultantId: true } } },
    });
    if (!project) return new Response("Not found", { status: 404 });
    const hasAccess =
      project.engagementManagerId === session.user.id ||
      project.assignments.some((a) => a.consultantId === session.user.id) ||
      (project.isOwnGig && project.ownGigOwnerId === session.user.id);
    if (!hasAccess) return new Response("Forbidden", { status: 403 });
  }

  const update = await prisma.engagementUpdate.create({
    data: {
      engagementId: id,
      content: content.trim(),
      type: type ?? "GENERAL",
      createdById: session.user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });


  return Response.json(update);
}
