import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const category = searchParams.get("category");

  const tracks = await prisma.trainingTrack.findMany({
    where: {
      isActive: true,
      ...(level ? { level: level as "FOUNDATION" | "SPECIALIST" | "MASTER" } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      modules: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          order: true,
          estimatedMinutes: true,
          passingScore: true,
        },
      },
      enrollments: session.user?.id
        ? {
            where: { userId: session.user.id },
            select: {
              id: true,
              status: true,
              enrolledAt: true,
              completedAt: true,
              overallScore: true,
              moduleProgress: {
                select: {
                  moduleId: true,
                  status: true,
                  score: true,
                  completedAt: true,
                  timeSpentMinutes: true,
                },
              },
            },
          }
        : false,
      _count: { select: { enrollments: true, modules: true } },
    },
  });

  return Response.json({ tracks });
});
