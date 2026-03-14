type Status =
  | "PLANNING" | "ACTIVE" | "ON_HOLD" | "AT_RISK" | "COMPLETED" | "CANCELLED"
  | "PENDING" | "IN_PROGRESS" | "DELAYED" | "SKIPPED"
  | "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "NEEDS_REVISION" | "APPROVED" | "DELIVERED_TO_CLIENT"
  | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  | string;

const STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PLANNING:             { bg: "#EFF6FF", text: "#3B82F6", dot: "#3B82F6" },
  ACTIVE:               { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  ON_HOLD:              { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  AT_RISK:              { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  COMPLETED:            { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  CANCELLED:            { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  PENDING:              { bg: "#FFF7ED", text: "#EA580C", dot: "#F97316" },
  IN_PROGRESS:          { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  DELAYED:              { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  DRAFT:                { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  SUBMITTED:            { bg: "#FFF7ED", text: "#EA580C", dot: "#F97316" },
  IN_REVIEW:            { bg: "#EFF6FF", text: "#3B82F6", dot: "#3B82F6" },
  NEEDS_REVISION:       { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  APPROVED:             { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  DELIVERED_TO_CLIENT:  { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  LOW:                  { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  MEDIUM:               { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  HIGH:                 { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  CRITICAL:             { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

const LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  AT_RISK: "At Risk",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DELAYED: "Delayed",
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  NEEDS_REVISION: "Needs Revision",
  APPROVED: "Approved",
  DELIVERED_TO_CLIENT: "Delivered",
  LOW: "Low Risk",
  MEDIUM: "Medium Risk",
  HIGH: "High Risk",
  CRITICAL: "Critical",
};

export default function StatusBadge({ status }: { status: Status }) {
  const style = STYLES[status] ?? { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" };
  const label = LABELS[status] ?? status.replace(/_/g, " ");

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
      {label}
    </span>
  );
}
