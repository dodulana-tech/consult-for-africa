import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: deliverableId } = await params;

  const versions = await prisma.deliverableVersion.findMany({
    where: { deliverableId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      versionNumber: true,
      fileUrl: true,
      fileName: true,
      changeNotes: true,
      submittedById: true,
      submittedAt: true,
    },
  });

  return Response.json(
    versions.map((v) => ({
      id: v.id,
      version: v.versionNumber,
      fileUrl: v.fileUrl ?? "",
      fileName: v.fileName ?? v.fileUrl?.split("/").pop() ?? "file",
      changes: v.changeNotes ?? null,
      uploadedById: v.submittedById,
      createdAt: v.submittedAt.toISOString(),
    }))
  );
});

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: deliverableId } = await params;
  const { fileUrl, fileName, changes } = await req.json();

  if (!fileUrl?.trim()) return new Response("fileUrl is required", { status: 400 });

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { assignment: { select: { consultantId: true } } },
  });

  if (!deliverable) return new Response("Not found", { status: 404 });

  const role = (session.user as { role: string }).role;
  const isEM = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isOwner = deliverable.assignment?.consultantId === session.user.id;

  if (!isEM && !isOwner) return new Response("Forbidden", { status: 403 });

  const newVersion = deliverable.version + 1;
  const resolvedFileName =
    typeof fileName === "string" && fileName.trim()
      ? fileName.trim()
      : fileUrl.split("/").pop() ?? "file";

  const [versionRecord] = await prisma.$transaction([
    prisma.deliverableVersion.create({
      data: {
        deliverableId,
        versionNumber: newVersion,
        fileUrl,
        fileName: resolvedFileName,
        changeNotes: typeof changes === "string" && changes.trim() ? changes.trim() : null,
        submittedById: session.user.id,
      },
      select: {
        id: true,
        versionNumber: true,
        fileUrl: true,
        fileName: true,
        changeNotes: true,
        submittedById: true,
        submittedAt: true,
      },
    }),
    prisma.deliverable.update({
      where: { id: deliverableId },
      data: { version: newVersion, fileUrl, status: "SUBMITTED" },
    }),
  ]);

  return Response.json(
    {
      ok: true,
      version: {
        id: versionRecord.id,
        version: versionRecord.versionNumber,
        fileUrl: versionRecord.fileUrl ?? "",
        fileName: versionRecord.fileName ?? resolvedFileName,
        changes: versionRecord.changeNotes ?? null,
        uploadedById: versionRecord.submittedById,
        createdAt: versionRecord.submittedAt.toISOString(),
      },
    },
    { status: 201 }
  );
});
