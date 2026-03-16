import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DevelopmentClient from "./DevelopmentClient";

export default async function DevelopmentPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");

  const userId = session.sub;

  const [coachingMatch, goals, reports] = await Promise.all([
    prisma.maarovaCoachingMatch.findFirst({
      where: { userId, status: { in: ["MATCHED", "ACTIVE", "PENDING_MATCH"] } },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            title: true,
            bio: true,
            certifications: true,
            specialisms: true,
            avatarUrl: true,
            country: true,
            city: true,
            yearsExperience: true,
          },
        },
        sessions: {
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            scheduledAt: true,
            completedAt: true,
            duration: true,
            notes: true,
            focusAreas: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.maarovaDevelopmentGoal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.maarovaReport.findFirst({
      where: { userId, status: "READY" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  return (
    <DevelopmentClient
      coachingMatch={coachingMatch ? JSON.parse(JSON.stringify(coachingMatch)) : null}
      goals={goals.map((g) => JSON.parse(JSON.stringify(g)))}
      hasReport={!!reports}
      userName={session.name}
    />
  );
}
