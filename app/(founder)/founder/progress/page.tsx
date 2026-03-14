import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const PHASES = [
  { name: "Phase 0", label: "Foundation",       pct: 100, status: "done",   icon: "✅", color: "#059669" },
  { name: "Phase 1", label: "MVP Build",         pct: 63,  status: "active", icon: "⏳", color: "#D4AF37" },
  { name: "Phase 2", label: "Launch & Validate", pct: 0,   status: "locked", icon: "🔒", color: "#E5E7EB" },
  { name: "Phase 3", label: "Optimization",      pct: 0,   status: "locked", icon: "🔒", color: "#E5E7EB" },
  { name: "Phase 4", label: "AI Integration",    pct: 0,   status: "locked", icon: "🔒", color: "#E5E7EB" },
  { name: "Phase 5", label: "Scale to $50M",     pct: 0,   status: "locked", icon: "🔒", color: "#E5E7EB" },
];

const REVENUE_MILESTONES = [
  { label: "$150k", pct: 0.3,  sublabel: "First project" },
  { label: "$500k", pct: 1,    sublabel: "Series A prep" },
  { label: "$1.8M", pct: 3.6,  sublabel: "Break-even" },
  { label: "$5M",   pct: 10,   sublabel: "Scale trigger" },
  { label: "$50M",  pct: 100,  sublabel: "Target" },
];

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: Date): number {
  return Math.max(0, Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default async function ProgressPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const email = session.user.email!;
  const now = new Date();

  const profile = await prisma.founderProfile.findUnique({ where: { email } });

  const [achievedMilestones, pendingMilestones] = profile
    ? await Promise.all([
        prisma.founderMilestone.findMany({
          where: { founderId: profile.id, status: "achieved" },
          orderBy: { achievedAt: "desc" },
        }),
        prisma.founderMilestone.findMany({
          where: { founderId: profile.id, status: "pending", targetDate: { gte: now } },
          orderBy: { targetDate: "asc" },
        }),
      ])
    : [[], []];

  return (
    <div className="p-6 max-w-5xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">Progress Tracker</h1>
        <p className="text-sm text-gray-500 mt-0.5">The $0 to $50M journey</p>
      </div>

      {/* Revenue journey */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Revenue Journey</h3>
        <p className="text-xs text-gray-400 mb-5">$0 to $50M</p>

        <div className="relative">
          {/* Track */}
          <div className="h-3 rounded-full bg-gray-100 relative">
            {/* Current position (at $0 = 0%) */}
            <div
              className="h-3 rounded-full"
              style={{ width: "0.5%", background: "#D4AF37" }}
            />
          </div>

          {/* Markers */}
          <div className="relative mt-3">
            {REVENUE_MILESTONES.map((m) => (
              <div
                key={m.label}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${m.pct}%` }}
              >
                <div
                  className="w-1.5 h-3 rounded-full mx-auto mb-1"
                  style={{ background: m.pct === 100 ? "#0F2744" : "#D4AF37", opacity: 0.5 }}
                />
                <p className="text-[10px] font-semibold text-gray-600 whitespace-nowrap">{m.label}</p>
                <p className="text-[9px] text-gray-400 whitespace-nowrap">{m.sublabel}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: "#D4AF37" }} />
            <span className="text-xs text-gray-500">Current position: $0</span>
            <span className="text-xs text-gray-300 mx-2">|</span>
            <span className="text-xs text-gray-500">Target: $50M</span>
          </div>
        </div>
      </div>

      {/* Phase completion */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Phase Completion</h3>
        <div className="space-y-4">
          {PHASES.map((phase) => (
            <div key={phase.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{phase.icon}</span>
                  <div>
                    <span className="text-xs font-semibold text-gray-800">{phase.name}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{phase.label}</span>
                  </div>
                  {phase.status === "active" && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(212,175,55,0.12)", color: "#D4AF37" }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-bold"
                  style={{
                    color:
                      phase.status === "done"
                        ? "#059669"
                        : phase.status === "active"
                        ? "#D4AF37"
                        : "#D1D5DB",
                  }}
                >
                  {phase.pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${phase.pct}%`, background: phase.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {achievedMilestones.length > 0 ? (
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Achievements Unlocked</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievedMilestones.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl text-center"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
              >
                {m.badge && <div className="text-2xl mb-2">{m.badge}</div>}
                <p className="text-xs font-semibold text-green-800 leading-snug">{m.name}</p>
                {m.achievedAt && (
                  <p className="text-[10px] text-green-600 mt-1">{formatShortDate(m.achievedAt)}</p>
                )}
                {m.celebration && (
                  <p className="text-[10px] text-green-600 mt-1 italic">{m.celebration}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 text-center" style={{ border: "1px solid #e5eaf0" }}>
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-sm font-semibold text-gray-700">No achievements yet</p>
          <p className="text-xs text-gray-400 mt-1">Complete milestones to unlock achievements here.</p>
        </div>
      )}

      {/* Upcoming milestones timeline */}
      {pendingMilestones.length > 0 && (
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Milestones</h3>
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-3.5 top-0 bottom-0 w-px"
              style={{ background: "#E5E7EB" }}
            />
            <div className="space-y-4">
              {pendingMilestones.map((m) => {
                const days = daysUntil(m.targetDate);
                return (
                  <div key={m.id} className="flex items-start gap-4 relative">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 z-10"
                      style={{ background: "#fff", border: "2px solid #e5eaf0" }}
                    >
                      {m.badge ?? "🎯"}
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-xs font-semibold text-gray-800">{m.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatShortDate(m.targetDate)}</p>
                      <span
                        className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={
                          days <= 7
                            ? { background: "#FEF2F2", color: "#B91C1C" }
                            : days <= 14
                            ? { background: "#FFF7ED", color: "#C2410C" }
                            : { background: "#F3F4F6", color: "#6B7280" }
                        }
                      >
                        {days === 0 ? "Today" : `${days} days away`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
