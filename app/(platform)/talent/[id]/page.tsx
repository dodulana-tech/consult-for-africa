import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import TalentApplicationDetail from "@/components/talent/TalentApplicationDetail";
import CommunicationsTimeline from "@/components/platform/communications/CommunicationsTimeline";

export default async function TalentApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = ["DIRECTOR", "PARTNER", "ADMIN", "ENGAGEMENT_MANAGER"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  const { id } = await params;

  const application = await prisma.talentApplication.findUnique({
    where: { id },
    include: {
      reviewedBy: { select: { name: true } },
    },
  });

  if (!application) notFound();

  const serialized = {
    ...application,
    availableFrom: application.availableFrom?.toISOString() ?? null,
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    aiScore: application.aiScore,
    aiScoreBreakdown: application.aiScoreBreakdown as Record<string, number> | null,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={`${application.firstName} ${application.lastName}`}
        subtitle={`${application.specialty} · ${application.location}`}
        backHref="/talent"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          <TalentApplicationDetail application={serialized} />

          <CommunicationsTimeline
            subject={{
              subjectType: "TALENT_APPLICATION",
              applicationId: application.id,
              subjectName: `${application.firstName} ${application.lastName}`,
              subjectEmail: application.email,
              subjectPhone: application.phone ?? undefined,
            }}
          />
        </div>
      </main>
    </div>
  );
}
