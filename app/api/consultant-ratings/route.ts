import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const consultantUserId = searchParams.get("consultantUserId");
  const projectId = searchParams.get("projectId");

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";

  // Consultants can only see their own ratings
  const where: Record<string, unknown> = {};
  if (session.user.role === "CONSULTANT") {
    where.consultant = { userId: session.user.id };
  } else if (!isElevated && !isEM) {
    return new Response("Forbidden", { status: 403 });
  }

  if (consultantUserId && (isElevated || isEM)) {
    where.consultant = { userId: consultantUserId };
  }
  if (projectId) where.engagementId = projectId;

  const ratings = await prisma.consultantRating.findMany({
    where,
    include: {
      consultant: { select: { id: true, user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Enrich with project names and rater names
  const projectIds = [...new Set(ratings.map((r) => r.engagementId))];
  const raterIds = [...new Set(ratings.map((r) => r.ratedById))];

  const [projects, raters] = await Promise.all([
    prisma.engagement.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { id: { in: raterIds } }, select: { id: true, name: true } }),
  ]);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const raterMap = Object.fromEntries(raters.map((r) => [r.id, r.name]));

  return Response.json(
    ratings.map((r) => ({
      ...r,
      projectName: projectMap[r.engagementId] ?? null,
      ratedByName: raterMap[r.ratedById] ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

export const POST = handler(async function POST(req: NextRequest) {
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
    where: { consultantId: consultantUserId, engagementId: projectId },
  });
  if (!assignment) return new Response("Consultant not assigned to this project", { status: 400 });

  // Prevent duplicate rating from same rater on same project
  const existing = await prisma.consultantRating.findFirst({
    where: {
      consultant: { userId: consultantUserId },
      engagementId: projectId,
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
      engagementId: projectId,
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
});
