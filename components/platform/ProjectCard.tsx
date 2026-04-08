import Link from "next/link";
import { Calendar, Users, AlertTriangle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import {
  formatCompactCurrency,
  budgetUtilization,
  daysRemaining,
  healthBg,
} from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    status: string;
    riskLevel: string;
    healthScore: number | null;
    budgetAmount: number;
    budgetCurrency: "NGN" | "USD";
    actualSpent: number;
    startDate: Date;
    endDate: Date | null;
    serviceType: string;
    client: { name: string };
    engagementManager: { name: string } | null;
    _count?: { assignments: number };
  };
}

const SERVICE_LABELS: Record<string, string> = {
  HOSPITAL_OPERATIONS: "Hospital Operations",
  TURNAROUND: "Turnaround",
  EMBEDDED_LEADERSHIP: "Embedded Leadership",
  CLINICAL_GOVERNANCE: "Clinical Governance",
  DIGITAL_HEALTH: "Digital Health",
  HEALTH_SYSTEMS: "Health Systems",
  DIASPORA_EXPERTISE: "Diaspora Expertise",
  EM_AS_SERVICE: "EM as a Service",
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const utilization = budgetUtilization(project.actualSpent, project.budgetAmount);
  const days = daysRemaining(project.endDate);
  const health = project.healthScore ?? 3;
  const isOverBudget = utilization > 90;
  const isUrgent = days < 14 && days > 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-1">{project.client.name}</p>
          <h3 className="font-semibold text-gray-900 leading-snug text-sm group-hover:text-[#0F2744] transition-colors line-clamp-2">
            {project.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: healthBg(health).replace("bg-", "#") }}
            title={`Health: ${health}/5`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${healthBg(health)}`}
            />
          </div>
        </div>
      </div>

      {/* Service type + Status */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
          {SERVICE_LABELS[project.serviceType] ?? project.serviceType}
        </span>
        <StatusBadge status={project.status} />
      </div>

      {/* Budget bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-400">Budget</span>
          <span className={`font-medium tabular-nums ${isOverBudget ? "text-red-600" : "text-gray-700"}`}>
            {utilization}%
            {isOverBudget && <AlertTriangle size={10} className="inline ml-1 text-red-500" />}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(utilization, 100)}%`,
              background: utilization > 90 ? "#EF4444" : utilization > 75 ? "#F59E0B" : "#10B981",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>{formatCompactCurrency(project.actualSpent, project.budgetCurrency)} spent</span>
          <span>{formatCompactCurrency(project.budgetAmount, project.budgetCurrency)} total</span>
        </div>
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <Calendar size={11} />
          <span className={isUrgent ? "text-amber-600 font-medium" : ""}>
            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={11} />
          <span>{project._count?.assignments ?? 0} consultants</span>
        </div>
      </div>
    </Link>
  );
}
