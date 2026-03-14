"use client";

interface Props {
  healthScore: number | null;
  budgetPct: number;
  timelinePct: number;
  daysRemaining: number;
  deliverablesPct: number; // % approved
  qualityAvg: number | null; // average review score if any
}

const band = (score: number) =>
  score >= 4 ? { label: "On Track", color: "#10B981", bg: "#ECFDF5" } :
  score >= 3 ? { label: "Caution", color: "#F59E0B", bg: "#FFFBEB" } :
               { label: "At Risk", color: "#EF4444", bg: "#FEF2F2" };

export default function HealthScoreBar({ healthScore, budgetPct, timelinePct, daysRemaining, deliverablesPct, qualityAvg }: Props) {
  const health = healthScore ?? 3;
  const b = band(health);

  const metrics = [
    {
      label: "Budget",
      value: `${budgetPct}%`,
      note: budgetPct > 90 ? "Over budget risk" : budgetPct > 75 ? "Monitor closely" : "On track",
      status: budgetPct > 90 ? "red" : budgetPct > 75 ? "amber" : "green",
    },
    {
      label: "Timeline",
      value: daysRemaining < 0 ? `${Math.abs(daysRemaining)}d over` : `${daysRemaining}d left`,
      note: daysRemaining < 0 ? "Overdue" : daysRemaining < 14 ? "Closing soon" : `${timelinePct}% elapsed`,
      status: daysRemaining < 0 ? "red" : daysRemaining < 14 ? "amber" : "green",
    },
    {
      label: "Deliverables",
      value: `${deliverablesPct}%`,
      note: "Approved",
      status: deliverablesPct >= 80 ? "green" : deliverablesPct >= 50 ? "amber" : "red",
    },
    {
      label: "Quality",
      value: qualityAvg ? `${qualityAvg.toFixed(1)}/10` : "N/A",
      note: qualityAvg ? (qualityAvg >= 7 ? "Strong" : qualityAvg >= 5 ? "Acceptable" : "Needs work") : "No reviews yet",
      status: !qualityAvg ? "grey" : qualityAvg >= 7 ? "green" : qualityAvg >= 5 ? "amber" : "red",
    },
  ] as const;

  const dotColor: Record<string, string> = {
    green: "#10B981",
    amber: "#F59E0B",
    red: "#EF4444",
    grey: "#D1D5DB",
  };

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Project Health</h3>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: b.bg, color: b.color }}
        >
          {b.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full"
            style={{ background: i <= health ? b.color : "#F3F4F6" }}
          />
        ))}
        <span className="text-xs font-semibold shrink-0" style={{ color: b.color }}>{health}/5</span>
      </div>

      {/* Dimension breakdown */}
      <div className="space-y-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: dotColor[m.status] }}
            />
            <span className="text-xs text-gray-500 w-20 shrink-0">{m.label}</span>
            <span className="text-xs font-semibold text-gray-900 w-16 shrink-0">{m.value}</span>
            <span className="text-xs text-gray-400">{m.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
