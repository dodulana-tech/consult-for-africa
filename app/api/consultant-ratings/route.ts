import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canRate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canRate) return new Response("Forbidden", { status: 403 });

  const { consultantUserId, projectId, technicalQuality, communication, timeliness, professionalism, feedback } =
    await req.json();

  if (!consultantUserId || !projectId) {
    return new Response("consultantUserId and projectId required", { status: 400 });
  }
  for (const score of [technicalQuality, communication, timeliness, professionalism]) {
    if (typeof score !== "number" || score < 1 || score > 5) {
      return new Response("All scores must be 1-5", { status: 400 });
    }
  }

  // Verify the consultant is assigned to this project
  const assignment = await prisma.assignment.findFirst({
    where: { consultantId: consultantUserId, projectId },
  });
  if (!assignment) return new Response("Consultant not assigned to this project", { status: 400 });

  // Prevent duplicate rating from same rater on same project
  const existing = await prisma.consultantRating.findFirst({
    where: {
      consultant: { userId: consultantUserId },
      projectId,
      ratedById: session.user.id,
    },
  });
  if (existing) return new Response("Already rated this consultant on this project", { status: 409 });

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: consultantUserId },
    select: { id: true },
  });
  if (!profile) return new Response("Consultant profile not found", { status: 404 });

  const overallRating = Math.round((technicalQuality + communication + timeliness + professionalism) / 4);

  const rating = await prisma.consultantRating.create({
    data: {
      consultantId: profile.id,
      projectId,
      technicalQuality,
      communication,
      timeliness,
      professionalism,
      overallRating,
      feedback: feedback ?? null,
      ratedById: session.user.id,
    },
  });

  // Recompute average rating on the profile
  const allRatings = await prisma.consultantRating.findMany({
    where: { consultantId: profile.id },
    select: { overallRating: true },
  });
  const avg = allRatings.reduce((s, r) => s + r.overallRating, 0) / allRatings.length;

  await prisma.consultantProfile.update({
    where: { id: profile.id },
    data: { averageRating: Math.round(avg * 100) / 100 },
  });

  return Response.json({ ok: true, rating });
}
