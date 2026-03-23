import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const assetType = url.searchParams.get("type") ?? "";
  const maturity = url.searchParams.get("maturity") ?? "";
  const stream = url.searchParams.get("stream") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (assetType) {
    where.assetType = assetType;
  }

  if (maturity) {
    where.maturity = maturity;
  }

  if (stream) {
    where.streamTags = { has: stream };
  }

  const assets = await prisma.libraryAsset.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ assets });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canCreate = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canCreate) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title,
    description,
    assetType,
    streamTags,
    problemTags,
    outputFormat,
    geographyTags,
    maturity,
    fileUrl,
    fileType,
  } = body;

  if (!title || !assetType) {
    return Response.json({ error: "title and assetType are required" }, { status: 400 });
  }

  const asset = await prisma.libraryAsset.create({
    data: {
      title,
      description: description ?? "",
      assetType,
      streamTags: streamTags ?? [],
      problemTags: problemTags ?? [],
      outputFormat: outputFormat ?? null,
      geographyTags: geographyTags ?? [],
      maturity: maturity ?? "DRAFT",
      fileUrl: fileUrl ?? null,
      fileType: fileType ?? null,
      authorId: session.user.id,
      publishedAt: maturity === "VALIDATED" || maturity === "BATTLE_TESTED" ? new Date() : null,
    },
    select: {
      id: true, title: true, description: true, assetType: true, streamTags: true,
      problemTags: true, outputFormat: true, geographyTags: true, maturity: true,
      fileUrl: true, fileType: true, version: true, authorId: true, reviewerId: true,
      viewCount: true, downloadCount: true, engagementAssociationCount: true,
      publishedAt: true, lastUpdatedAt: true, createdAt: true,
    },
  });

  return Response.json({ asset }, { status: 201 });
}
