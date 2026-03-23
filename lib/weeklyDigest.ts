import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DigestData {
  // Recipient
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;

  // Project pulse
  activeProjects: number;
  atRiskProjects: number;
  completedThisWeek: number;
  overdueDeliverables: number;

  // Timesheets (EM+)
  pendingTimesheets: number;
  hoursSubmittedThisWeek: number;

  // Deliverables
  deliverablesSubmitted: number;
  deliverablesApproved: number;
  deliverablesNeedingRevision: number;

  // Consultant utilization (Director+)
  totalConsultants: number;
  avgUtilization: number;

  // Revenue (Director+)
  invoicesSentThisWeek: number;
  invoicesSentAmount: number;
  outstandingAmount: number;
  collectedThisWeek: number;
  currency: string;

  // Growth (Director+)
  newReferrals: number;
  proposalsSent: number;
  newApplications: number;
  consultantsOnboarded: number;

  // Client satisfaction (Director+)
  satisfactionRatings: number;
  avgSatisfaction: number | null;
  expansionRequests: number;

  // Referral updates
  referralUpdates: { name: string; status: string }[];

  // Nuru insight (generated)
  nuruInsight: string;
}

// ─── Data Aggregation ────────────────────────────────────────────────────────

const ONE_WEEK_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export async function getDigestForUser(userId: string): Promise<DigestData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) return null;

  const weekAgo = ONE_WEEK_AGO();
  const isEM = user.role === "ENGAGEMENT_MANAGER";
  const isDirectorPlus = ["DIRECTOR", "PARTNER", "ADMIN"].includes(user.role);
  const isElevated = isEM || isDirectorPlus;

  // Scope projects: EM sees own, Director+ sees all
  const projectWhere = isDirectorPlus
    ? {}
    : isEM
    ? { engagementManagerId: userId }
    : {};

  const [
    projects,
    overdueDeliverables,
    pendingTimesheets,
    weekTimeEntries,
    weekDeliverables,
    weekApprovedDeliverables,
    revisionDeliverables,
  ] = await Promise.all([
    prisma.engagement.findMany({
      where: { ...projectWhere, status: { in: ["ACTIVE", "AT_RISK", "COMPLETED"] } },
      select: { status: true, updatedAt: true },
    }),
    prisma.deliverable.count({
      where: {
        engagement: projectWhere,
        dueDate: { lt: new Date() },
        status: { notIn: ["APPROVED", "DELIVERED_TO_CLIENT"] },
      },
    }),
    isElevated
      ? prisma.timeEntry.count({
          where: {
            status: "PENDING",
            ...(isEM ? { assignment: { engagement: { engagementManagerId: userId } } } : {}),
          },
        })
      : 0,
    prisma.timeEntry.findMany({
      where: {
        createdAt: { gte: weekAgo },
        ...(isElevated
          ? isEM
            ? { assignment: { engagement: { engagementManagerId: userId } } }
            : {}
          : { consultantId: userId }),
      },
      select: { hours: true },
    }),
    prisma.deliverable.count({
      where: {
        engagement: projectWhere,
        submittedAt: { gte: weekAgo },
      },
    }),
    prisma.deliverable.count({
      where: {
        engagement: projectWhere,
        approvedAt: { gte: weekAgo },
      },
    }),
    prisma.deliverable.count({
      where: {
        engagement: projectWhere,
        status: "NEEDS_REVISION",
      },
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const atRiskProjects = projects.filter((p) => p.status === "AT_RISK").length;
  const completedThisWeek = projects.filter(
    (p) => p.status === "COMPLETED" && p.updatedAt >= weekAgo
  ).length;
  const hoursSubmittedThisWeek = weekTimeEntries.reduce((s, e) => s + Number(e.hours), 0);

  // Director+ metrics
  let totalConsultants = 0;
  let avgUtilization = 0;
  let invoicesSentThisWeek = 0;
  let invoicesSentAmount = 0;
  let outstandingAmount = 0;
  let collectedThisWeek = 0;
  let newReferrals = 0;
  let proposalsSent = 0;
  let newApplications = 0;
  let consultantsOnboarded = 0;
  let satisfactionRatings = 0;
  let avgSatisfaction: number | null = null;
  let expansionRequests = 0;

  if (isDirectorPlus) {
    const [
      consultantCount,
      weekInvoices,
      outstanding,
      weekPaid,
      weekReferrals,
      weekProposals,
      weekApps,
      weekOnboarded,
      weekSatisfaction,
      weekExpansion,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CONSULTANT" } }),
      prisma.invoice.findMany({
        where: { createdAt: { gte: weekAgo }, status: { in: ["SENT", "PAID"] } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["SENT", "OVERDUE"] } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { paidDate: { gte: weekAgo } },
        select: { total: true },
      }),
      prisma.referral.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.proposal.count({ where: { sentAt: { gte: weekAgo } } }),
      prisma.talentApplication.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.consultantOnboarding.count({
        where: { status: "ACTIVE", approvedAt: { gte: weekAgo } },
      }),
      prisma.clientSatisfactionPulse.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { score: true },
      }),
      prisma.clientExpansionRequest.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    totalConsultants = consultantCount;
    // Rough utilization: active assignments / total consultants
    const activeAssignments = await prisma.assignment.count({
      where: { status: "ACTIVE" },
    });
    avgUtilization = totalConsultants > 0 ? Math.round((activeAssignments / totalConsultants) * 100) : 0;

    invoicesSentThisWeek = weekInvoices.length;
    invoicesSentAmount = weekInvoices.reduce((s, i) => s + Number(i.total), 0);
    outstandingAmount = outstanding.reduce((s, i) => s + Number(i.total), 0);
    collectedThisWeek = weekPaid.reduce((s, i) => s + Number(i.total), 0);
    newReferrals = weekReferrals;
    proposalsSent = weekProposals;
    newApplications = weekApps;
    consultantsOnboarded = weekOnboarded;
    satisfactionRatings = weekSatisfaction.length;
    avgSatisfaction = weekSatisfaction.length > 0
      ? Math.round((weekSatisfaction.reduce((s, r) => s + r.score, 0) / weekSatisfaction.length) * 10) / 10
      : null;
    expansionRequests = weekExpansion;
  }

  // Referral momentum for the user
  const referralUpdates = await prisma.referral.findMany({
    where: {
      referrerId: userId,
      updatedAt: { gte: weekAgo },
      status: { in: ["CONTACTED", "CONVERTED"] },
    },
    select: { name: true, status: true },
    take: 5,
  });

  // Generate Nuru AI insight
  const nuruInsight = await generateNuruInsight({
    role: user.role,
    name: user.name.split(" ")[0],
    activeProjects,
    atRiskProjects,
    completedThisWeek,
    overdueDeliverables,
    pendingTimesheets,
    hoursSubmittedThisWeek,
    deliverablesSubmitted: weekDeliverables,
    deliverablesApproved: weekApprovedDeliverables,
    totalConsultants,
    avgUtilization,
    invoicesSentAmount,
    outstandingAmount,
    collectedThisWeek,
    newReferrals,
    proposalsSent,
    newApplications,
    consultantsOnboarded,
  });

  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    activeProjects,
    atRiskProjects,
    completedThisWeek,
    overdueDeliverables,
    pendingTimesheets,
    hoursSubmittedThisWeek,
    deliverablesSubmitted: weekDeliverables,
    deliverablesApproved: weekApprovedDeliverables,
    deliverablesNeedingRevision: revisionDeliverables,
    totalConsultants,
    avgUtilization,
    invoicesSentThisWeek,
    invoicesSentAmount,
    outstandingAmount,
    collectedThisWeek,
    currency: "NGN",
    newReferrals,
    proposalsSent,
    newApplications,
    consultantsOnboarded,
    satisfactionRatings,
    avgSatisfaction,
    expansionRequests,
    referralUpdates,
    nuruInsight,
  };
}

// ─── Nuru AI Insight ─────────────────────────────────────────────────────────

async function generateNuruInsight(data: {
  role: string;
  name: string;
  activeProjects: number;
  atRiskProjects: number;
  completedThisWeek: number;
  overdueDeliverables: number;
  pendingTimesheets: number;
  hoursSubmittedThisWeek: number;
  deliverablesSubmitted: number;
  deliverablesApproved: number;
  totalConsultants: number;
  avgUtilization: number;
  invoicesSentAmount: number;
  outstandingAmount: number;
  collectedThisWeek: number;
  newReferrals: number;
  proposalsSent: number;
  newApplications: number;
  consultantsOnboarded: number;
}): Promise<string> {
  try {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `You are Nuru, CFA's AI assistant. Write a single motivational/strategic sentence for ${data.name} (${data.role}) based on this week's data. Be specific to the numbers. No generic quotes. Keep it warm but professional. One sentence only, no quotation marks.

Data: ${data.activeProjects} active projects, ${data.atRiskProjects} at risk, ${data.completedThisWeek} completed this week, ${data.overdueDeliverables} overdue deliverables, ${data.pendingTimesheets} pending timesheets, ${data.hoursSubmittedThisWeek}h logged, ${data.deliverablesSubmitted} deliverables submitted, ${data.deliverablesApproved} approved, ${data.totalConsultants} consultants at ${data.avgUtilization}% utilization, ${data.newReferrals} new referrals, ${data.proposalsSent} proposals sent, ${data.newApplications} new talent applications, ${data.consultantsOnboarded} onboarded this week.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") return content.text.trim();
    return "";
  } catch (err) {
    console.error("[nuru-digest] AI insight failed:", err);
    return "Another week of impact across Africa. Keep pushing the standard.";
  }
}

// ─── Get all digest recipients ───────────────────────────────────────────────

export async function getDigestRecipients() {
  return prisma.user.findMany({
    where: {
      role: { in: ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"] },
    },
    select: { id: true, name: true, email: true, role: true },
  });
}
