import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");
  const reusable = searchParams.get("reusable");

  // Non-elevated users can only see assets from their projects or reusable assets
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"].includes(session.user.role);
  const scopeFilter = isElevated
    ? {}
    : {
        OR: [
          { isReusable: true },
          { engagement: { assignments: { some: { consultantId: session.user.id } } } },
        ],
      };

  const assets = await prisma.knowledgeAsset.findMany({
    where: {
      ...scopeFilter,
      ...(projectId ? { engagementId: projectId } : {}),
      ...(type ? { assetType: type as "INSIGHT" | "FRAMEWORK" | "TEMPLATE" | "CASE_STUDY" | "LESSON_LEARNED" } : {}),
      ...(reusable === "true" ? { isReusable: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      engagement: { select: { id: true, name: true } },
    },
  });

  return Response.json(
    assets.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { title, content, assetType, tags, isReusable, fileUrl, projectId } = await req.json();

  if (!title?.trim()) return new Response("title is required", { status: 400 });
  if (!content?.trim()) return new Response("content is required", { status: 400 });
  if (!assetType) return new Response("assetType is required", { status: 400 });

  const asset = await prisma.knowledgeAsset.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      assetType,
      tags: Array.isArray(tags) ? tags : [],
      isReusable: Boolean(isReusable),
      fileUrl: fileUrl?.trim() || null,
      engagementId: projectId?.trim() || null,
      authorId: session.user.id,
    },
    include: {
      engagement: { select: { id: true, name: true } },
    },
  });

  return Response.json(
    {
      ...asset,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
