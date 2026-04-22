import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import MaarovaOrgDetail from "@/components/platform/maarova/MaarovaOrgDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MaarovaOrgDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { id },
    include: {
      users: {
        orderBy: { createdAt: "desc" },
        include: {
          sessions: {
            select: {
              id: true,
              status: true,
              completedAt: true,
              totalTimeMinutes: true,
              report: {
                select: {
                  id: true,
                  status: true,
                  overallScore: true,
                  leadershipArchetype: true,
                  archetypeNarrative: true,
                  executiveSummary: true,
                  strengthsAnalysis: true,
                  developmentAreas: true,
                  dimensionScores: true,
                  radarChartData: true,
                  signatureStrengths: true,
                  coachingPriorities: true,
                  pdfUrl: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!org) notFound();

  const serializedOrg = {
    id: org.id,
    name: org.name,
    type: org.type,
    country: org.country,
    city: org.city,
    contactName: org.contactName,
    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone,
    stream: org.stream,
    maxAssessments: org.maxAssessments,
    usedAssessments: org.usedAssessments,
    isActive: org.isActive,
    notes: org.notes,
    createdAt: org.createdAt.toISOString(),
  };

  const serializedUsers = org.users.map((u) => {
    const session = u.sessions[0] ?? null;
    const report = session?.report ?? null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title,
      department: u.department,
      isPortalEnabled: u.isPortalEnabled,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      latestSessionStatus: session?.status ?? null,
      latestSessionId: session?.id ?? null,
      completedAt: session?.completedAt?.toISOString() ?? null,
      totalTimeMinutes: session?.totalTimeMinutes ?? null,
      report: report ? {
        status: report.status,
        overallScore: report.overallScore,
        leadershipArchetype: report.leadershipArchetype,
        archetypeNarrative: report.archetypeNarrative,
        executiveSummary: report.executiveSummary,
        strengthsAnalysis: report.strengthsAnalysis,
        developmentAreas: report.developmentAreas,
        dimensionScores: report.dimensionScores as Record<string, Record<string, number>> | null,
        radarChartData: report.radarChartData as Array<{ dimension: string; score: number; benchmark: number }> | null,
        signatureStrengths: report.signatureStrengths as Array<{ dimension: string; title: string; description: string }> | null,
        coachingPriorities: report.coachingPriorities as Array<{ priority: number; title: string; description: string; timeframe: string }> | null,
        pdfUrl: report.pdfUrl,
      } : null,
    };
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={org.name}
        subtitle={`${
          { private_hospital: "Private Hospital", hospital_group: "Hospital Group", government: "Government", ngo: "NGO" }[org.type] ?? org.type
        } - ${
          { RECRUITMENT: "Recruitment", DEVELOPMENT: "Development", INTELLIGENCE: "Intelligence" }[org.stream] ?? org.stream
        }`}
        backHref="/admin/maarova/organisations"
      />
      <MaarovaOrgDetail org={serializedOrg} users={serializedUsers} />
    </div>
  );
}
