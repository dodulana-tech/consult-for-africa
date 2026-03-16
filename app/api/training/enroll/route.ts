import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { trackId } = await req.json();
  if (!trackId) return Response.json({ error: "trackId required" }, { status: 400 });

  const track = await prisma.trainingTrack.findUnique({
    where: { id: trackId },
    include: { modules: { where: { isActive: true }, orderBy: { order: "asc" } } },
  });

  if (!track) return Response.json({ error: "Track not found" }, { status: 404 });

  // Check prerequisites
  if (track.prerequisites.length > 0) {
    const completedTracks = await prisma.trainingEnrollment.findMany({
      where: {
        userId: session.user.id,
        status: "CERTIFIED",
        track: { slug: { in: track.prerequisites } },
      },
    });
    const completedSlugs = new Set(
      await prisma.trainingTrack
        .findMany({
          where: { id: { in: completedTracks.map((e) => e.trackId) } },
          select: { slug: true },
        })
        .then((t) => t.map((t) => t.slug))
    );
    const missing = track.prerequisites.filter((p) => !completedSlugs.has(p));
    if (missing.length > 0) {
      return Response.json(
        { error: `Complete prerequisites first: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
  }

  // Check if already enrolled
  const existing = await prisma.trainingEnrollment.findUnique({
    where: { userId_trackId: { userId: session.user.id, trackId } },
  });
  if (existing) {
    return Response.json({ error: "Already enrolled in this track" }, { status: 400 });
  }

  try {
    // Create enrollment with module progress entries
    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        userId: session.user.id,
        trackId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        moduleProgress: {
          create: track.modules.map((mod, i) => ({
            moduleId: mod.id,
            status: i === 0 ? "AVAILABLE" : "LOCKED",
          })),
        },
      },
      include: { moduleProgress: true },
    });

    await logAudit({
      userId: session.user.id,
      action: "ENROLL",
      entityType: "TrainingEnrollment",
      entityId: enrollment.id,
      entityName: track.name,
    });

    return Response.json({ enrollment });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Enrollment error:", msg, err);
    return Response.json({ error: "Enrollment failed", detail: msg }, { status: 500 });
  }
}
