import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TrendingUp, Briefcase, Users, DollarSign, AlertCircle, Target } from "lucide-react";

export default async function MetricsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const metrics = [
    {
      label: "Monthly Revenue",
      value: "₦0",
      target: "Month 3 target: ₦135M",
      pct: 0,
      icon: TrendingUp,
      accent: "#D4AF37",
      status: "pre-launch",
    },
    {
      label: "Active Projects",
      value: "0",
      target: "Launch target: 3",
      pct: 0,
      icon: Briefcase,
      accent: "#0F2744",
      status: "pre-launch",
    },
    {
      label: "Consultant Network",
      value: "12",
      target: "Launch target: 15",
      pct: 80,
      icon: Users,
      accent: "#059669",
      status: "on-track",
    },
    {
      label: "Monthly Burn",
      value: "₦1.5M",
      target: "Budget: ₦1.5M",
      pct: 100,
      icon: DollarSign,
      accent: "#B91C1C",
      status: "at-budget",
    },
    {
      label: "Cash Runway",
      value: "2.7 mo",
      target: "Target: 3+ months",
      pct: 90,
      icon: AlertCircle,
      accent: "#C2410C",
      status: "watch",
    },
    {
      label: "Pipeline Value",
      value: "₦75M",
      target: "Weighted pipeline",
      pct: null,
      icon: Target,
      accent: "#7C3AED",
      status: "pipeline",
    },
  ];

  const consultantBreakdown = {
    byTier: [
      { label: "Elite",       count: 2,  color: "#D4AF37" },
      { label: "Experienced", count: 7,  color: "#0F2744" },
      { label: "Standard",    count: 3,  color: "#6B7280" },
    ],
    byLocation: [
      { label: "Diaspora",     count: 8,  color: "#059669" },
      { label: "Nigeria-based",count: 4,  color: "#0F2744" },
    ],
    byExpertise: [
      { label: "Revenue Cycle", count: 4, color: "#D4AF37" },
      { label: "Operations",    count: 5, color: "#0F2744" },
      { label: "Clinical",      count: 2, color: "#059669" },
      { label: "Finance",       count: 3, color: "#7C3AED" },
    ],
  };

  const revenueMilestones = [
    { label: "$150k",  sublabel: "First client",  phase: "Phase 2", achieved: false },
    { label: "$500k",  sublabel: "Validation",    phase: "Phase 2", achieved: false },
    { label: "$1.8M",  sublabel: "Break-even",    phase: "Phase 3", achieved: false },
    { label: "$5M",    sublabel: "Scale trigger",  phase: "Phase 4", achieved: false },
    { label: "$50M",   sublabel: "End goal",       phase: "Phase 5", achieved: false },
  ];

  return (
    <div className="p-6 max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Metrics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pre-launch baseline</p>
        </div>
        <div
          className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }}
        >
          <AlertCircle size={11} />
          Pre-launch estimates
        </div>
      </div>

      {/* Note */}
      <div
        className="px-4 py-3 rounded-xl text-xs"
        style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}
      >
        Metrics will auto-populate from platform data after launch. These are pre-launch estimates.
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, target, pct, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${accent}18` }}
              >
                <Icon size={13} style={{ color: accent }} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{target}</p>
            {pct !== null && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, background: accent }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue journey */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Revenue Journey: $0 to $50M</h3>
        <p className="text-xs text-gray-400 mb-5">Milestone roadmap</p>
        <div className="space-y-3">
          {revenueMilestones.map((m) => (
            <div key={m.label} className="flex items-center gap-4">
              <div
                className="w-14 text-right text-xs font-bold shrink-0"
                style={{ color: m.achieved ? "#059669" : "#9CA3AF" }}
              >
                {m.label}
              </div>
              <div
                className="w-3 h-3 rounded-full border-2 shrink-0"
                style={{
                  background: m.achieved ? "#059669" : "#fff",
                  borderColor: m.achieved ? "#059669" : "#D1D5DB",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">{m.sublabel}</p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ background: "#F3F4F6", color: "#6B7280" }}
              >
                {m.phase}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Consultant network breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* By tier */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
          <h4 className="text-xs font-semibold text-gray-700 mb-3">By Tier</h4>
          <div className="space-y-2.5">
            {consultantBreakdown.byTier.map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
            <div className="flex gap-1 h-3">
              {consultantBreakdown.byTier.map(({ label, count, color }) => (
                <div
                  key={label}
                  className="h-full rounded-sm first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(count / 12) * 100}%`, background: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* By location */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
          <h4 className="text-xs font-semibold text-gray-700 mb-3">By Location</h4>
          <div className="space-y-2.5">
            {consultantBreakdown.byLocation.map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
            <div className="flex gap-1 h-3">
              {consultantBreakdown.byLocation.map(({ label, count, color }) => (
                <div
                  key={label}
                  className="h-full rounded-sm first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(count / 12) * 100}%`, background: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* By expertise */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
          <h4 className="text-xs font-semibold text-gray-700 mb-3">By Expertise</h4>
          <div className="space-y-2.5">
            {consultantBreakdown.byExpertise.map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
            <div className="flex gap-1 h-3">
              {consultantBreakdown.byExpertise.map(({ label, count, color }) => (
                <div
                  key={label}
                  className="h-full rounded-sm first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(count / 14) * 100}%`, background: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
