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
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const serialized = records.map((r) => ({
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
  }));

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
