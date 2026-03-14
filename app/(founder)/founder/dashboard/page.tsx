import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Target, Clock, CheckSquare, TrendingUp, Users, Briefcase, Rocket } from "lucide-react";
import TaskCheckbox from "@/components/founder/TaskCheckbox";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const START_DATE = new Date("2026-01-20T00:00:00.000Z");
const LAUNCH_DATE = new Date("2026-04-13T00:00:00.000Z");

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Priority colors ──────────────────────────────────────────────────────────

function priorityColor(priority: string): { bg: string; color: string } {
  switch (priority.toLowerCase()) {
    case "critical": return { bg: "#FEF2F2", color: "#B91C1C" };
    case "high":     return { bg: "#FFF7ED", color: "#C2410C" };
    case "medium":   return { bg: "#FFFBEB", color: "#B45309" };
    default:         return { bg: "#F0FDF4", color: "#15803D" };
  }
}

// ─── Phase data ───────────────────────────────────────────────────────────────

const PHASES = [
  { name: "Phase 0", label: "Foundation",        pct: 100, status: "done",   icon: "✅" },
  { name: "Phase 1", label: "MVP Build",          pct: 63,  status: "active", icon: "⏳" },
  { name: "Phase 2", label: "Launch & Validate",  pct: 0,   status: "locked", icon: "🔒" },
  { name: "Phase 3", label: "Optimization",       pct: 0,   status: "locked", icon: "🔒" },
  { name: "Phase 4", label: "AI Integration",     pct: 0,   status: "locked", icon: "🔒" },
  { name: "Phase 5", label: "Scale to $50M",      pct: 0,   status: "locked", icon: "🔒" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FounderDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(role)) redirect("/dashboard");

  const email = session.user.email!;
  const now = new Date();

  // Upsert FounderProfile
  const profile = await prisma.founderProfile.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: session.user.name ?? "Debo",
      startDate: START_DATE,
      currentPhase: "Phase1_MVP",
    },
  });

  const founderId = profile.id;

  // Parallel fetches
  const [thisWeekTasks, upcomingMilestones, achievedMilestones] = await Promise.all([
    prisma.founderTask.findMany({
      where: { founderId, week: 5, status: { not: "completed" } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.founderMilestone.findMany({
      where: { founderId, status: "pending", targetDate: { gte: now } },
      orderBy: { targetDate: "asc" },
      take: 4,
    }),
    prisma.founderMilestone.findMany({
      where: { founderId, status: "achieved" },
      orderBy: { achievedAt: "desc" },
      take: 5,
    }),
  ]);

  const daysInBusiness = daysBetween(START_DATE, now);
  const daysToLaunch   = daysBetween(now, LAUNCH_DATE);
  const phasePercent   = 63;

  const firstName = profile.name.split(" ")[0];

  // Top priority task (critical or high)
  const priorityTask =
    thisWeekTasks.find((t) => t.priority === "critical") ??
    thisWeekTasks.find((t) => t.priority === "high") ??
    thisWeekTasks[0] ??
    null;

  return (
    <div className="p-6 space-y-6 max-w-6xl">

      {/* Top header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Mission Control</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Day {daysInBusiness} of building Consult For Africa
          </p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: "rgba(15,39,68,0.07)", color: "#0F2744" }}
        >
          Phase 1: MVP Build
        </div>
      </div>

      {/* Hero card */}
      <div
        className="rounded-xl p-6 text-white"
        style={{ background: "#0F2744" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Welcome back
            </p>
            <h2 className="text-xl font-bold">{firstName}</h2>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
          >
            Phase 1 Active
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              Phase progress
            </p>
            <span className="text-xs font-semibold" style={{ color: "#D4AF37" }}>
              {phasePercent}%
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${phasePercent}%`, background: "#D4AF37" }}
            />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              On track, {daysToLaunch} days to launch
            </span>
          </div>
        </div>
      </div>

      {/* Today's priority */}
      {priorityTask && (
        <div
          className="rounded-xl p-5 bg-white"
          style={{
            border: "1px solid #e5eaf0",
            borderLeft: "4px solid #D4AF37",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target size={13} style={{ color: "#D4AF37" }} />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Today's Priority
            </p>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{priorityTask.title}</h3>
          {priorityTask.description && (
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{priorityTask.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {priorityTask.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {priorityTask.estimatedMinutes} min
              </span>
            )}
            {priorityTask.impact && (
              <span className="flex items-center gap-1">
                <TrendingUp size={11} /> {priorityTask.impact}
              </span>
            )}
          </div>
          <div className="mt-3">
            <TaskCheckbox
              taskId={priorityTask.id}
              initialStatus={priorityTask.status}
              title="Mark complete"
            />
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Revenue",
            value: "₦0",
            sub: "Target: ₦135M",
            icon: TrendingUp,
            accent: "#D4AF37",
          },
          {
            label: "Active Projects",
            value: "0",
            sub: "Target: 3",
            icon: Briefcase,
            accent: "#0F2744",
          },
          {
            label: "Consultants",
            value: "12",
            sub: "Launch target: 15",
            icon: Users,
            accent: "#059669",
          },
          {
            label: "Days to Launch",
            value: Math.max(0, daysToLaunch).toString(),
            sub: "April 13, 2026",
            icon: Rocket,
            accent: "#7C3AED",
          },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-4"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{label}</p>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${accent}15` }}
              >
                <Icon size={13} style={{ color: accent }} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Phase journey */}
      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Phase Journey: $0 to $50M</h3>
        <div className="space-y-3">
          {PHASES.map((phase) => (
            <div key={phase.name} className="flex items-center gap-3">
              <span className="text-base w-5 shrink-0">{phase.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-700">{phase.name}</span>
                    <span className="text-xs text-gray-400">{phase.label}</span>
                  </div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: phase.status === "active" ? "#D4AF37" : phase.status === "done" ? "#059669" : "#9CA3AF" }}
                  >
                    {phase.pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${phase.pct}%`,
                      background:
                        phase.status === "done"
                          ? "#059669"
                          : phase.status === "active"
                          ? "#D4AF37"
                          : "#E5E7EB",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* This week's tasks */}
      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            This Week&apos;s Tasks
            <span className="ml-2 text-xs font-normal text-gray-400">Week 5</span>
          </h3>
          <span className="text-xs text-gray-400">{thisWeekTasks.length} remaining</span>
        </div>

        {thisWeekTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">All caught up on Week 5 tasks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {thisWeekTasks.map((task) => {
              const pc = priorityColor(task.priority);
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}
                >
                  <TaskCheckbox
                    taskId={task.id}
                    initialStatus={task.status}
                    title={task.title}
                  />
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{ background: pc.bg, color: pc.color }}
                    >
                      {task.priority}
                    </span>
                    {task.estimatedMinutes && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock size={9} />
                        {task.estimatedMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming milestones */}
      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
        {upcomingMilestones.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No upcoming milestones scheduled.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {upcomingMilestones.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {m.badge && <span className="text-base">{m.badge}</span>}
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{m.name}</p>
                </div>
                <p className="text-[10px] text-gray-400">{formatShortDate(m.targetDate)}</p>
                <span
                  className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#FFF7ED", color: "#C2410C" }}
                >
                  {daysBetween(now, m.targetDate)} days away
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      {achievedMilestones.length > 0 && (
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {achievedMilestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
              >
                {m.badge && <span>{m.badge}</span>}
                <span className="font-medium text-green-800">{m.name}</span>
                {m.achievedAt && (
                  <span className="text-green-600">{formatShortDate(m.achievedAt)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
