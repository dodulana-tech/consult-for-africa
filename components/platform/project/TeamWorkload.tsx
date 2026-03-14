"use client";

interface TimeEntry {
  hours: number;
  billableAmount: number | null;
  currency: string;
}

interface Assignment {
  id: string;
  role: string;
  status: string;
  rateAmount: number;
  rateCurrency: string;
  rateType: string;
  estimatedHours: number | null;
  consultant: {
    id: string;
    name: string;
    consultantProfile: { title: string | null; tier: string } | null;
  };
  deliverables: { status: string }[];
  timeEntries: TimeEntry[];
}

export default function TeamWorkload({ assignments }: { assignments: Assignment[] }) {
  const active = assignments.filter((a) => a.status === "ACTIVE" || a.status === "PENDING");

  if (active.length === 0) {
    return (
      <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Team Workload</h3>
        <p className="text-xs text-gray-400">No consultants assigned yet.</p>
      </div>
    );
  }

  const maxHours = Math.max(
    ...active.map((a) => a.timeEntries.reduce((s, te) => s + te.hours, 0)),
    1
  );

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Team Workload</h3>
        <span className="text-xs text-gray-400">{active.length} active</span>
      </div>

      <div className="space-y-3">
        {active.map((a) => {
          const totalHours = a.timeEntries.reduce((s, te) => s + te.hours, 0);
          const approved = a.deliverables.filter(
            (d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT"
          ).length;
          const initials = a.consultant.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const barPct = maxHours > 0 ? (totalHours / maxHours) * 100 : 0;
          const estimated = a.estimatedHours ?? null;
          const utilizationPct =
            estimated && estimated > 0 ? Math.round((totalHours / estimated) * 100) : null;

          return (
            <div key={a.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                  style={{ background: "#0F2744" }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-900 truncate">{a.consultant.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">{totalHours.toFixed(0)}h logged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{a.role}</span>
                    {utilizationPct !== null && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background: utilizationPct > 90 ? "#FEF2F2" : utilizationPct > 70 ? "#FFFBEB" : "#ECFDF5",
                          color: utilizationPct > 90 ? "#EF4444" : utilizationPct > 70 ? "#F59E0B" : "#10B981",
                        }}
                      >
                        {utilizationPct}% utilization
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-8">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${barPct}%`, background: "#0F2744", opacity: 0.6 }}
                  />
                  {estimated && (
                    <div
                      className="h-full rounded-full -mt-1.5"
                      style={{
                        width: `${Math.min(100, (estimated / Math.max(estimated, totalHours)) * 100)}%`,
                        background: "#D4AF37",
                        opacity: 0.3,
                      }}
                    />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{approved} deliv.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div
        className="pt-3 flex items-center justify-between text-xs"
        style={{ borderTop: "1px solid #F3F4F6" }}
      >
        <span className="text-gray-500">Total hours logged</span>
        <span className="font-semibold text-gray-900">
          {active.reduce((s, a) => s + a.timeEntries.reduce((ss, te) => ss + te.hours, 0), 0).toFixed(0)}h
        </span>
      </div>
    </div>
  );
}
