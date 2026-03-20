import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.consultantAssessment.findUnique({
    where: { id },
  });

  if (!assessment) {
    return Response.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Allow video save even after completion (handles race condition where upload finishes after submit)
  if (assessment.status === "EXPIRED" || (assessment.status !== "COMPLETED" && assessment.expiresAt <= new Date())) {
    if (assessment.status !== "EXPIRED") {
      await prisma.consultantAssessment.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
    }
    return Response.json({ error: "Assessment has expired" }, { status: 400 });
  }

  const { videoUrl, videoDurationSec } = await req.json();

  if (!videoUrl || typeof videoUrl !== "string") {
    return Response.json({ error: "videoUrl is required" }, { status: 400 });
  }

  if (videoDurationSec !== undefined && typeof videoDurationSec !== "number") {
    return Response.json({ error: "videoDurationSec must be a number" }, { status: 400 });
  }

  // Validate URL format (basic check)
  try {
    new URL(videoUrl);
  } catch {
    return Response.json({ error: "Invalid videoUrl format" }, { status: 400 });
  }

  const data: Record<string, unknown> = { videoUrl };

  if (typeof videoDurationSec === "number") {
    data.videoDurationSec = Math.round(videoDurationSec);
  }

  // Move to IN_PROGRESS if still NOT_STARTED
  if (assessment.status === "NOT_STARTED") {
    data.status = "IN_PROGRESS";
    data.startedAt = new Date();
  }

  const updated = await prisma.consultantAssessment.update({
    where: { id },
    data,
  });

  return Response.json({
    ok: true,
    video: {
      videoUrl: updated.videoUrl,
      videoDurationSec: updated.videoDurationSec,
    },
  });
}
