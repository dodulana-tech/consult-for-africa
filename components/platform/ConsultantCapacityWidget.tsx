import Link from "next/link";
import { Gauge, Sparkles, Briefcase } from "lucide-react";
import type { CapacitySnapshot } from "@/lib/capacity";

export default function ConsultantCapacityWidget({
  capacity,
  openOpportunities,
}: {
  capacity: CapacitySnapshot;
  openOpportunities: number;
}) {
  const util = capacity.utilizationPercent;
  const barColor =
    util > 100 ? "#DC2626" : util > capacity.maxUtilization ? "#F59E0B" : "#10B981";
  const barWidth = Math.min(util, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Capacity gauge */}
      <div
        className="rounded-xl p-5 col-span-2"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">My Workload</h3>
        </div>

        {/* Utilization bar */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold" style={{ color: barColor }}>
              {util}%
            </span>
            <span className="text-xs text-gray-400">
              {capacity.allocatedHoursPerWeek}h / {capacity.weeklyCapacityHours}h per week
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${barWidth}%`, background: barColor }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">0%</span>
            <span
              className="text-[10px] font-medium"
              style={{ color: "#F59E0B", marginLeft: `${capacity.maxUtilization - 5}%` }}
            >
              {capacity.maxUtilization}% threshold
            </span>
            <span className="text-[10px] text-gray-400">100%</span>
          </div>
        </div>

        {/* Active assignments breakdown */}
        {capacity.assignments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Active Commitments
            </p>
            {capacity.assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                style={{ background: "#F9FAFB" }}
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={11} className="text-gray-400" />
                  <span className="text-gray-700 font-medium">{a.projectName}</span>
                  <span className="text-gray-400">{a.role}</span>
                </div>
                <span className="font-semibold text-gray-600">{a.hoursPerWeek}h/wk</span>
              </div>
            ))}
          </div>
        )}

        {capacity.assignments.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">
            No active assignments. Browse opportunities to find your next project.
          </p>
        )}
      </div>

      {/* Opportunities card */}
      <Link
        href="/opportunities"
        className="rounded-xl p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
        style={{ background: "#0F2744", border: "1px solid #0F2744" }}
      >
        <Sparkles size={24} className="text-yellow-400 mb-3" />
        <p className="text-2xl font-bold text-white">{openOpportunities}</p>
        <p className="text-xs text-white/60 mt-1">Open Opportunities</p>
        <span className="mt-3 text-xs font-semibold text-yellow-400">
          Browse &rarr;
        </span>
      </Link>
    </div>
  );
}
