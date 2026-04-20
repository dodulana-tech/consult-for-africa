import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import OnboardingTable from "@/components/platform/admin/OnboardingTable";

export default async function AdminOnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const records = await prisma.consultantOnboarding.findMany({
    include: {
      user: {
        select: {
          id: true, name: true, email: true, role: true, createdAt: true,
          consultantProfile: {
            select: {
              title: true, location: true, specialties: true, primarySpecialty: true,
              yearsExperience: true, isDiaspora: true, hoursPerWeek: true,
              bankName: true, accountNumber: true, accountName: true, currency: true,
              bio: true,
            },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  // Fetch linked talent applications for records that have applicationId
  const appIds = records.map((r) => r.applicationId).filter(Boolean) as string[];
  const applications = appIds.length > 0
    ? await prisma.talentApplication.findMany({
        where: { id: { in: appIds } },
        select: {
          id: true, firstName: true, lastName: true, specialty: true,
          yearsExperience: true, currentRole: true, currentOrg: true,
          cvFileUrl: true, coverLetter: true, aiScore: true, aiSummary: true,
          aiRecommendation: true, aiStrengths: true, aiConcerns: true,
          track: true,
        },
      })
    : [];
  const appMap = new Map(applications.map((a) => [a.id, a]));

  const serialized = records.map((r) => {
    const profile = r.user.consultantProfile;
    const app = r.applicationId ? appMap.get(r.applicationId) ?? null : null;
    return {
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      userEmail: r.user.email,
      status: r.status,
      assessmentLevel: r.assessmentLevel,
      profileCompleted: r.profileCompleted,
      assessmentCompleted: r.assessmentCompleted,
      applicationId: r.applicationId,
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString() ?? null,
      // Profile data
      profile: profile ? {
        title: profile.title,
        location: profile.location,
        specialties: profile.specialties,
        primarySpecialty: profile.primarySpecialty,
        yearsExperience: profile.yearsExperience,
        isDiaspora: profile.isDiaspora,
        hoursPerWeek: profile.hoursPerWeek,
        bio: profile.bio,
        bankName: profile.bankName,
        accountName: profile.accountName,
        currency: profile.currency,
        hasBanking: !!(profile.bankName && profile.accountName),
      } : null,
      // Application data (from talent pipeline)
      application: app ? {
        specialty: app.specialty,
        currentRole: app.currentRole,
        currentOrg: app.currentOrg,
        cvFileUrl: app.cvFileUrl,
        coverLetter: app.coverLetter ? app.coverLetter.substring(0, 500) : null,
        aiScore: app.aiScore,
        aiSummary: app.aiSummary,
        aiRecommendation: app.aiRecommendation,
        aiStrengths: app.aiStrengths,
        aiConcerns: app.aiConcerns,
        track: app.track,
      } : null,
    };
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Consultant Onboarding"
        subtitle={`${records.length} consultants in pipeline`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <OnboardingTable records={serialized} />
      </main>
    </div>
  );
}
