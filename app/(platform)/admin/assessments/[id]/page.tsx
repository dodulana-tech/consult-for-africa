import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { analyseIntegrity } from "@/lib/consultantAssessment/integrity";
import AssessmentReviewClient from "@/components/platform/admin/AssessmentReviewClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminAssessmentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const assessment = await prisma.consultantAssessment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          consultantProfile: {
            select: { location: true, yearsExperience: true, title: true },
          },
        },
      },
      responses: {
        orderBy: { answeredAt: "asc" },
      },
    },
  });

  if (!assessment) notFound();

  const integrityReport = analyseIntegrity(assessment);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiBreakdown = assessment.aiBreakdown as Record<string, any> | null;

  const serialized = {
    id: assessment.id,
    userId: assessment.userId,
    specialty: assessment.specialty,
    status: assessment.status,
    startedAt: assessment.startedAt?.toISOString() ?? null,
    completedAt: assessment.completedAt?.toISOString() ?? null,
    tabSwitchCount: assessment.tabSwitchCount,
    pasteEventCount: assessment.pasteEventCount,
    aiContentScore: assessment.aiContentScore,
    aiIntegrityScore: assessment.aiIntegrityScore,
    aiBreakdown,
    videoUrl: assessment.videoUrl,
    videoDurationSec: assessment.videoDurationSec,
    adminScore: assessment.adminScore,
    adminTier: assessment.adminTier,
    adminNotes: assessment.adminNotes,
    reviewedAt: assessment.reviewedAt?.toISOString() ?? null,
    user: {
      name: assessment.user.name,
      email: assessment.user.email,
      profile: assessment.user.consultantProfile,
    },
    responses: assessment.responses.map((r) => ({
      id: r.id,
      part: r.part,
      questionId: r.questionId,
      questionText: r.questionText,
      answer: r.answer,
      timeSpentSec: r.timeSpentSec,
      pasteEvents: r.pasteEvents,
      tabSwitches: r.tabSwitches,
      wordCount: r.wordCount,
      answeredAt: r.answeredAt.toISOString(),
    })),
    integrityReport,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Assessment Review"
        subtitle={assessment.user.name ?? "Candidate"}
        backHref="/admin/assessments"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <AssessmentReviewClient assessment={serialized} />
      </main>
    </div>
  );
}
