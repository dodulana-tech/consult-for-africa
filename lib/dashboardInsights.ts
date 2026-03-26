import { prisma } from "@/lib/prisma";
import { getSpecialtyLabel } from "@/lib/specialties";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardInsight {
  type: "celebration" | "nudge" | "opportunity" | "milestone" | "feedback" | "growth";
  icon: string; // emoji for simplicity in server component
  title: string;
  message: string;
  href?: string;
  accent: "gold" | "blue" | "green" | "amber" | "purple";
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export async function getDashboardInsights(
  userId: string,
  role: string
): Promise<DashboardInsight[]> {
  const insights: DashboardInsight[] = [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const isConsultant = role === "CONSULTANT";
  const isEM = role === "ENGAGEMENT_MANAGER";
  const isDirectorPlus = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);

  // ─── 1. Project milestones celebrated ─────────────────────────────────────

  const recentPhaseCompletions = await prisma.engagementPhase.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: { gte: weekAgo },
      engagement: isDirectorPlus
        ? {}
        : isEM
        ? { engagementManagerId: userId }
        : { assignments: { some: { consultantId: userId } } },
    },
    include: {
      engagement: { select: { id: true, name: true } },
    },
    take: 3,
    orderBy: { updatedAt: "desc" },
  });

  for (const phase of recentPhaseCompletions) {
    insights.push({
      type: "celebration",
      icon: "\u{1F389}",
      title: `${phase.engagement.name}`,
      message: `${phase.name} phase completed this week.`,
      href: `/projects/${phase.engagement.id}`,
      accent: "gold",
    });
  }

  // ─── 2. Client feedback surfaced ──────────────────────────────────────────

  if (isConsultant || isEM) {
    const recentFeedback = await prisma.clientSatisfactionPulse.findMany({
      where: {
        createdAt: { gte: weekAgo },
        engagement: isEM
          ? { engagementManagerId: userId }
          : { assignments: { some: { consultantId: userId } } },
      },
      include: {
        engagement: { select: { id: true, name: true } },
      },
      take: 2,
      orderBy: { createdAt: "desc" },
    });

    for (const fb of recentFeedback) {
      if (fb.score >= 4) {
        insights.push({
          type: "feedback",
          icon: "\u2B50",
          title: `${fb.engagement.name} rated ${fb.score}/5`,
          message: fb.feedback ?? "Great feedback from your client.",
          href: `/projects/${fb.engagement.id}`,
          accent: "green",
        });
      }
    }
  }

  // ─── 3. Nuru proactive prompts (upcoming deliverables) ────────────────────

  const upcomingDeliverables = await prisma.deliverable.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      status: { in: ["DRAFT", "NEEDS_REVISION"] },
      ...(isConsultant
        ? { assignment: { consultantId: userId } }
        : isEM
        ? { engagement: { engagementManagerId: userId } }
        : {}),
    },
    include: {
      engagement: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  if (upcomingDeliverables.length > 0) {
    const count = upcomingDeliverables.length;
    const first = upcomingDeliverables[0];
    insights.push({
      type: "nudge",
      icon: "\u{1F4DD}",
      title: `${count} deliverable${count > 1 ? "s" : ""} due this week`,
      message: count === 1
        ? `${first.name} for ${first.engagement.name} is due soon.`
        : `Including ${first.name} for ${first.engagement.name}.`,
      href: `/deliverables`,
      accent: "amber",
    });
  }

  // ─── 4. Stale project detection (EM/Director) ────────────────────────────

  if (isEM || isDirectorPlus) {
    const staleProjects = await prisma.engagement.findMany({
      where: {
        status: "ACTIVE",
        ...(isEM ? { engagementManagerId: userId } : {}),
        updatedAt: { lt: weekAgo },
        assignments: { none: { timeEntries: { some: { createdAt: { gte: weekAgo } } } } },
      },
      select: { id: true, name: true, updatedAt: true },
      take: 3,
    });

    for (const p of staleProjects) {
      const daysSince = Math.floor((now.getTime() - p.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      insights.push({
        type: "nudge",
        icon: "\u{1F4A4}",
        title: `${p.name} has been quiet`,
        message: `No activity in ${daysSince} days. Might be worth a check-in.`,
        href: `/projects/${p.id}`,
        accent: "amber",
      });
    }
  }

  // ─── 5. Opportunity matching (Consultant) ─────────────────────────────────

  if (isConsultant) {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId },
      select: { specialties: true, expertiseAreas: true },
    });

    if (profile && profile.specialties.length > 0) {
      const matchingOpportunities = await prisma.staffingRequest.findMany({
        where: {
          status: "OPEN",
          skillsRequired: { hasSome: profile.expertiseAreas },
        },
        select: { id: true, role: true, skillsRequired: true },
        take: 2,
        orderBy: { createdAt: "desc" },
      });

      for (const opp of matchingOpportunities) {
        const alreadyExpressed = await prisma.staffingExpression.findFirst({
          where: { staffingRequestId: opp.id, consultantId: userId },
        });
        if (!alreadyExpressed) {
          insights.push({
            type: "opportunity",
            icon: "\u{1F4BC}",
            title: opp.role,
            message: "A new engagement matches your skill set. Express interest?",
            href: "/opportunities",
            accent: "blue",
          });
        }
      }
    }
  }

  // ─── 6. Anniversary / milestone markers ───────────────────────────────────

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, name: true },
  });

  if (user) {
    const daysSinceJoined = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const monthsSinceJoined = Math.floor(daysSinceJoined / 30);

    // Show at 1, 3, 6, 12 month marks (within 3-day window)
    const milestoneMonths = [1, 3, 6, 12, 18, 24];
    for (const m of milestoneMonths) {
      const targetDays = m * 30;
      if (daysSinceJoined >= targetDays && daysSinceJoined <= targetDays + 3) {
        // Fetch cumulative stats
        const [projectCount, deliverableCount, totalHours] = await Promise.all([
          prisma.assignment.count({ where: { consultantId: userId } }),
          prisma.deliverable.count({
            where: { assignment: { consultantId: userId }, status: "APPROVED" },
          }),
          prisma.timeEntry.findMany({
            where: { consultantId: userId, status: { in: ["APPROVED", "PAID"] } },
            select: { hours: true },
          }),
        ]);

        const hours = totalHours.reduce((s, e) => s + Number(e.hours), 0);

        insights.push({
          type: "milestone",
          icon: "\u{1F396}\uFE0F",
          title: `${m} month${m > 1 ? "s" : ""} with C4A`,
          message: `${projectCount} project${projectCount !== 1 ? "s" : ""}, ${deliverableCount} deliverable${deliverableCount !== 1 ? "s" : ""} approved, ${Math.round(hours)} hours of impact.`,
          accent: "purple",
        });
        break;
      }
    }
  }

  // ─── 7. Referral momentum ────────────────────────────────────────────────

  const referralUpdates = await prisma.referral.findMany({
    where: {
      referrerId: userId,
      updatedAt: { gte: weekAgo },
      status: { in: ["CONTACTED", "CONVERTED"] },
    },
    select: { name: true, status: true },
    take: 3,
  });

  for (const ref of referralUpdates) {
    insights.push({
      type: "growth",
      icon: ref.status === "CONVERTED" ? "\u{1F91D}" : "\u{1F4E8}",
      title: `Your referral for ${ref.name}`,
      message: ref.status === "CONVERTED"
        ? "Has been converted and onboarded. Thank you for growing the network."
        : "Has been contacted by the C4A team.",
      href: "/refer",
      accent: "green",
    });
  }

  // ─── 8. Pipeline transparency (Consultant) ───────────────────────────────

  if (isConsultant && isDirectorPlus === false) {
    const newProjectsThisMonth = await prisma.engagement.count({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    });

    if (newProjectsThisMonth > 0) {
      insights.push({
        type: "growth",
        icon: "\u{1F4C8}",
        title: "Consult For Africa is growing",
        message: `${newProjectsThisMonth} new project${newProjectsThisMonth > 1 ? "s" : ""} started this month. More opportunities ahead.`,
        accent: "blue",
      });
    }
  }

  // ─── 9. Skill gap insight (Consultant) ────────────────────────────────────

  if (isConsultant) {
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId },
      select: { specialties: true },
    });

    const assignments = await prisma.assignment.findMany({
      where: { consultantId: userId },
      include: { engagement: { select: { serviceType: true } } },
    });

    if (assignments.length >= 3 && profile) {
      // Find dominant service type
      const typeCounts: Record<string, number> = {};
      for (const a of assignments) {
        typeCounts[a.engagement.serviceType] = (typeCounts[a.engagement.serviceType] || 0) + 1;
      }
      const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
      const dominant = sorted[0];
      const dominantPct = Math.round((dominant[1] / assignments.length) * 100);

      if (dominantPct >= 70 && sorted.length < 3) {
        const labels: Record<string, string> = {
          HOSPITAL_OPERATIONS: "Hospital Operations",
          TURNAROUND: "Turnaround Management",
          CLINICAL_GOVERNANCE: "Clinical Governance",
          DIGITAL_HEALTH: "Digital Health",
          HEALTH_SYSTEMS: "Health Systems",
          EMBEDDED_LEADERSHIP: "Embedded Leadership",
        };
        const dominantLabel = labels[dominant[0]] ?? dominant[0];

        insights.push({
          type: "growth",
          icon: "\u{1F4DA}",
          title: "Diversify your portfolio",
          message: `${dominantPct}% of your work has been in ${dominantLabel}. The Academy has tracks that could open new project types for you.`,
          href: "/academy",
          accent: "purple",
        });
      }
    }
  }

  // Limit total insights to avoid overwhelming the dashboard
  return insights.slice(0, 5);
}

// ─── Personal Impact Counter ────────────────────────────────────────────────

export interface ImpactStats {
  projectsContributed: number;
  deliverablesApproved: number;
  totalHours: number;
  avgClientSatisfaction: number | null;
  memberSince: string;
}

export async function getPersonalImpact(userId: string): Promise<ImpactStats> {
  const [user, projectCount, deliverableCount, timeEntries, satisfaction] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.assignment.count({ where: { consultantId: userId } }),
    prisma.deliverable.count({
      where: { assignment: { consultantId: userId }, status: { in: ["APPROVED", "DELIVERED_TO_CLIENT"] } },
    }),
    prisma.timeEntry.findMany({
      where: { consultantId: userId, status: { in: ["APPROVED", "PAID"] } },
      select: { hours: true },
    }),
    prisma.consultantRating.findMany({
      where: { consultant: { userId } },
      select: { overallRating: true },
    }),
  ]);

  const hours = timeEntries.reduce((s, e) => s + Number(e.hours), 0);
  const avgSat = satisfaction.length > 0
    ? Math.round((satisfaction.reduce((s, r) => s + r.overallRating, 0) / satisfaction.length) * 10) / 10
    : null;

  return {
    projectsContributed: projectCount,
    deliverablesApproved: deliverableCount,
    totalHours: Math.round(hours),
    avgClientSatisfaction: avgSat,
    memberSince: user?.createdAt.toISOString() ?? new Date().toISOString(),
  };
}
