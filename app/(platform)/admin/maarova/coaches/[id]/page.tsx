import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import MaarovaCoachDetail from "@/components/platform/maarova/MaarovaCoachDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MaarovaCoachDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const coach = await prisma.maarovaCoach.findUnique({
    where: { id },
    include: {
      organisation: { select: { id: true, name: true } },
      matches: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              title: true,
              organisation: { select: { id: true, name: true } },
            },
          },
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { matches: true } },
    },
  });

  if (!coach) notFound();

  const serializedCoach = {
    id: coach.id,
    name: coach.name,
    email: coach.email,
    title: coach.title,
    bio: coach.bio,
    specialisms: coach.specialisms,
    certifications: coach.certifications,
    country: coach.country,
    city: coach.city,
    yearsExperience: coach.yearsExperience,
    maxClients: coach.maxClients,
    activeClients: coach.activeClients,
    isActive: coach.isActive,
    isPortalEnabled: coach.isPortalEnabled,
    avatarUrl: coach.avatarUrl,
    languages: coach.languages,
    timezone: coach.timezone,
    healthcareExperience: coach.healthcareExperience,
    developmentFocus: coach.developmentFocus,
    vettingStatus: coach.vettingStatus,
    applicationDate: coach.applicationDate?.toISOString() ?? null,
    interviewDate: coach.interviewDate?.toISOString() ?? null,
    interviewScore: coach.interviewScore,
    interviewNotes: coach.interviewNotes,
    vetNotes: coach.vetNotes,
    reviewedBy: coach.reviewedBy,
    hourlyRate: coach.hourlyRate ? Number(coach.hourlyRate) : null,
    currency: coach.currency,
    avgSessionRating: coach.avgSessionRating ? Number(coach.avgSessionRating) : null,
    totalSessions: coach.totalSessions,
    completedEngagements: coach.completedEngagements,
    lastLoginAt: coach.lastLoginAt?.toISOString() ?? null,
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
    organisation: coach.organisation,
    matchCount: coach._count.matches,
  };

  const serializedMatches = coach.matches.map((m) => ({
    id: m.id,
    status: m.status,
    programme: m.programme,
    matchScore: m.matchScore,
    startDate: m.startDate?.toISOString() ?? null,
    endDate: m.endDate?.toISOString() ?? null,
    sessionsCompleted: m.sessionsCompleted,
    sessionsScheduled: m.sessionsScheduled,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      title: m.user.title,
      orgName: m.user.organisation?.name ?? null,
    },
  }));

  const serializedInvoices = coach.invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    matchId: inv.matchId,
    status: inv.status,
    amount: Number(inv.amount),
    currency: inv.currency,
    description: inv.description,
    lineItems: inv.lineItems as { description: string; qty: number; unitPrice: number; total: number }[] | null,
    issuedAt: inv.issuedAt?.toISOString() ?? null,
    dueAt: inv.dueAt?.toISOString() ?? null,
    paidAt: inv.paidAt?.toISOString() ?? null,
    notes: inv.notes,
    createdAt: inv.createdAt.toISOString(),
  }));

  const vettingLabel =
    {
      APPLIED: "Applied",
      UNDER_REVIEW: "Under Review",
      INTERVIEW_SCHEDULED: "Interview Scheduled",
      APPROVED: "Approved",
      REJECTED: "Rejected",
    }[coach.vettingStatus] ?? coach.vettingStatus;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={coach.name}
        subtitle={`${coach.title} - ${vettingLabel}`}
        backHref="/admin/maarova/coaches"
      />
      <MaarovaCoachDetail
        coach={serializedCoach}
        matches={serializedMatches}
        invoices={serializedInvoices}
      />
    </div>
  );
}
