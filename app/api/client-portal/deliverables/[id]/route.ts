import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientPortalSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, clientId: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        select: {
          id: true,
          versionNumber: true,
          fileUrl: true,
          fileName: true,
          changeNotes: true,
          submittedAt: true,
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          authorId: true,
          authorName: true,
          authorType: true,
          parentId: true,
          isResolved: true,
          createdAt: true,
        },
      },
    },
  });

  if (!deliverable) {
    return new Response("Not found", { status: 404 });
  }

  // Verify ownership: the deliverable's project must belong to the client
  if (deliverable.project.clientId !== session.clientId) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json({
    id: deliverable.id,
    name: deliverable.name,
    description: deliverable.description,
    status: deliverable.status,
    fileUrl: deliverable.fileUrl,
    dueDate: deliverable.dueDate,
    submittedAt: deliverable.submittedAt,
    reviewStage: deliverable.reviewStage,
    version: deliverable.version,
    createdAt: deliverable.createdAt,
    updatedAt: deliverable.updatedAt,
    project: deliverable.project,
    versions: deliverable.versions,
    comments: deliverable.comments,
  });
}
