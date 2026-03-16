import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: "default" | "warning" | "danger" | "success";
  href?: string;
}

const ACCENT = {
  default: { icon: "#4A90E2", bg: "#EFF6FF" },
  success: { icon: "#10B981", bg: "#ECFDF5" },
  warning: { icon: "#F59E0B", bg: "#FFFBEB" },
  danger:  { icon: "#EF4444", bg: "#FEF2F2" },
};

export default function StatCard({ label, value, sub, icon: Icon, accent = "default", href }: StatCardProps) {
  const colors = ACCENT[accent];
  const content = (
    <>
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: colors.bg }}
      >
        <Icon size={18} style={{ color: colors.icon }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs mt-1" style={{ color: colors.icon }}>{sub}</p>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4 transition-shadow hover:shadow-md hover:border-gray-200"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex items-start gap-4">
      {content}
    </div>
  );
}
