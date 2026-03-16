import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AcademyClient from "@/components/platform/academy/AcademyClient";

export default async function AcademyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tracks = await prisma.trainingTrack.findMany({
    where: { isActive: true },
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
      enrollments: {
        where: { userId: session.user.id },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          completedAt: true,
          certifiedAt: true,
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
      },
      _count: { select: { enrollments: true, modules: true } },
    },
  });

  const totalCertified = await prisma.trainingEnrollment.count({
    where: { userId: session.user.id, status: "CERTIFIED" },
  });

  const totalTimeSpent = await prisma.moduleProgress.aggregate({
    where: { enrollment: { userId: session.user.id } },
    _sum: { timeSpentMinutes: true },
  });

  const stats = {
    totalTracks: tracks.length,
    certified: totalCertified,
    hoursLogged: Math.round((totalTimeSpent._sum.timeSpentMinutes ?? 0) / 60),
    inProgress: tracks.filter((t) => t.enrollments.some((e) => e.status === "IN_PROGRESS")).length,
  };

  return <AcademyClient tracks={tracks} stats={stats} userId={session.user.id} />;
}
