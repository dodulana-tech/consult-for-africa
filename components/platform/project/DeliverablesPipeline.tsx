"use client";

interface Deliverable {
  id: string;
  status: string;
  name: string;
}

const STAGES = [
  { key: "DRAFT", label: "Draft", color: "#9CA3AF", bg: "#F9FAFB" },
  { key: "SUBMITTED", label: "Submitted", color: "#3B82F6", bg: "#EFF6FF" },
  { key: "IN_REVIEW", label: "In Review", color: "#F59E0B", bg: "#FFFBEB" },
  { key: "NEEDS_REVISION", label: "Revision", color: "#EF4444", bg: "#FEF2F2" },
  { key: "APPROVED", label: "Approved", color: "#10B981", bg: "#ECFDF5" },
  { key: "DELIVERED_TO_CLIENT", label: "Delivered", color: "#8B5CF6", bg: "#F5F3FF" },
];

export default function DeliverablesPipeline({ deliverables }: { deliverables: Deliverable[] }) {
  const total = deliverables.length;

  if (total === 0) {
    return (
      <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Deliverables Pipeline</h3>
        <p className="text-xs text-gray-400">No deliverables yet.</p>
      </div>
    );
  }

  const counts = STAGES.map((s) => ({
    ...s,
    count: deliverables.filter((d) => d.status === s.key).length,
  })).filter((s) => s.count > 0);

  const maxCount = Math.max(...counts.map((s) => s.count), 1);

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Deliverables Pipeline</h3>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>

      {/* Funnel bars */}
      <div className="space-y-2">
        {STAGES.map((stage) => {
          const count = deliverables.filter((d) => d.status === stage.key).length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 shrink-0">{stage.label}</span>
              <div className="flex-1 h-5 rounded bg-gray-50 overflow-hidden relative">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${barWidth}%`, background: stage.color, opacity: 0.8 }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">
                {count > 0 ? count : ""}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="flex gap-2 flex-wrap pt-1">
        {counts.map((s) => (
          <span
            key={s.key}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: s.bg, color: s.color }}
          >
            {s.count} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
