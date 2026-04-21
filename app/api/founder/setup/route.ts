import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortByPriority<T extends { priority: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  );
}

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    include: {
      _count: {
        select: {
          tasks: true,
          milestones: true,
        },
      },
    },
  });

  if (!profile) return Response.json(null);

  const achievedCount = await prisma.founderMilestone.count({
    where: { founderId: profile.id, status: "achieved" },
  });

  return Response.json({
    ...profile,
    taskCount: profile._count.tasks,
    milestoneCount: profile._count.milestones,
    achievedMilestones: achievedCount,
  });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { currentPhase } = body;

  const startDate = new Date("2026-01-20");

  const existing = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    include: { _count: { select: { tasks: true } } },
  });

  const profile = await prisma.founderProfile.upsert({
    where: { email: session.user.email! },
    create: {
      email: session.user.email!,
      name: session.user.name ?? "Debo Odulana",
      startDate,
      currentPhase: currentPhase ?? "Phase1_MVP",
    },
    update: {
      ...(currentPhase ? { currentPhase } : {}),
      ...(session.user.name ? { name: session.user.name } : {}),
    },
  });

  const isNew = !existing || existing._count.tasks === 0;

  if (isNew) {
    const monday = getThisMonday();

    const tasksData = [
      {
        title: "Review Week 4 developer deliverables",
        priority: "critical",
        category: "development",
        estimatedMinutes: 120,
        impact: "Critical for staying on track",
        dueDate: monday,
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Hand over Week 5 developer prompt",
        priority: "critical",
        category: "development",
        estimatedMinutes: 30,
        impact: "Unlocks next build sprint",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Lagoon Hospital discovery call",
        priority: "critical",
        category: "business",
        estimatedMinutes: 90,
        impact: "First client = validates entire model",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Send proposal to Lagoon Hospital",
        priority: "high",
        category: "business",
        estimatedMinutes: 60,
        impact: "Revenue pipeline",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Update consultant recruitment pipeline",
        priority: "medium",
        category: "recruitment",
        estimatedMinutes: 30,
        impact: "Need 3 more by launch",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Platform testing - deliverable workflow",
        priority: "high",
        category: "development",
        estimatedMinutes: 120,
        impact: "Quality assurance",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Consultant interviews - 2 candidates",
        priority: "high",
        category: "recruitment",
        estimatedMinutes: 120,
        impact: "Team building",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Weekly developer check-in",
        priority: "high",
        category: "development",
        estimatedMinutes: 60,
        impact: "Progress tracking",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "LinkedIn post - C4A mission",
        priority: "low",
        category: "marketing",
        estimatedMinutes: 15,
        impact: "Brand building",
        phase: "Phase1_MVP",
        week: 5,
      },
      {
        title: "Week 5 deliverable review + planning",
        priority: "high",
        category: "development",
        estimatedMinutes: 60,
        impact: "Week 6 readiness",
        phase: "Phase1_MVP",
        week: 5,
      },
    ];

    const milestonesData = [
      {
        name: "Company Registered",
        description: "Consult For Africa officially incorporated. The foundation is set.",
        phase: "Phase0_Foundation",
        category: "business",
        targetDate: new Date("2026-01-20"),
        achievedAt: new Date("2026-01-20"),
        status: "achieved",
        badge: "🏢",
        celebration: "The journey begins!",
      },
      {
        name: "Developer Hired",
        description: "First technical team member onboarded to build the platform.",
        phase: "Phase1_MVP",
        category: "team",
        targetDate: new Date("2026-02-18"),
        achievedAt: new Date("2026-02-18"),
        status: "achieved",
        badge: "👨‍💻",
        celebration: "Team building begins",
      },
      {
        name: "12 Consultants Committed",
        description: "12 healthcare consultants signed letters of intent to join the network.",
        phase: "Phase1_MVP",
        category: "team",
        targetDate: new Date("2026-03-05"),
        achievedAt: new Date("2026-03-05"),
        status: "achieved",
        badge: "👥",
        celebration: "Network taking shape",
      },
      {
        name: "Week 4 MVP Complete",
        description: "Core platform foundation built: auth, projects, consultants, deliverables.",
        phase: "Phase1_MVP",
        category: "technical",
        targetDate: new Date("2026-03-08"),
        achievedAt: new Date("2026-03-08"),
        status: "achieved",
        badge: "🔧",
        celebration: "Platform foundation is solid",
      },
      {
        name: "First Client Signed",
        description: "First paying client contract signed. Proof of concept begins.",
        phase: "Phase1_MVP",
        category: "business",
        targetDate: new Date("2026-03-30"),
        status: "pending",
        badge: "🤝",
        celebration: "First revenue incoming!",
      },
      {
        name: "Week 8 MVP Complete",
        description: "Full MVP ready: all workflows, AI tools, payments, and notifications working.",
        phase: "Phase1_MVP",
        category: "technical",
        targetDate: new Date("2026-04-06"),
        status: "pending",
        badge: "🚀",
        celebration: "Ready for launch!",
      },
      {
        name: "Platform Launch Day",
        description: "Consult For Africa platform goes live. First project onboarded to the system.",
        phase: "Phase2_Launch",
        category: "business",
        targetDate: new Date("2026-04-13"),
        status: "pending",
        badge: "🎯",
        celebration: "We're live!",
      },
      {
        name: "$150k First Revenue",
        description: "First $150k in consulting revenue. Proof of concept fully validated.",
        phase: "Phase2_Launch",
        category: "financial",
        targetDate: new Date("2026-04-30"),
        status: "pending",
        badge: "💰",
        celebration: "Proof of concept validated!",
      },
      {
        name: "$500k Revenue",
        description: "Half a million dollars in revenue. Growth engine is working.",
        phase: "Phase3_Optimize",
        category: "financial",
        targetDate: new Date("2026-07-14"),
        status: "pending",
        badge: "📈",
      },
      {
        name: "$5M Revenue",
        description: "Five million dollars. AI platform fully operational at scale.",
        phase: "Phase4_Scale",
        category: "financial",
        targetDate: new Date("2027-01-20"),
        status: "pending",
        badge: "🦁",
      },
    ];

    const sortedTasks = sortByPriority(tasksData);

    await Promise.all([
      prisma.founderTask.createMany({
        data: sortedTasks.map((t) => ({ ...t, founderId: profile.id, status: "pending" })),
      }),
      prisma.founderMilestone.createMany({
        data: milestonesData.map((m) => ({ ...m, founderId: profile.id })),
      }),
    ]);
  }

  return Response.json({ profile, isNew });
});

function getThisMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
