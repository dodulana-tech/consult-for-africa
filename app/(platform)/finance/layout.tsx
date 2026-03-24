"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { label: "Invoices", href: "/finance/invoices", icon: FileText },
  { label: "Reports", href: "/finance/reports", icon: BarChart3 },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Sub-navigation */}
      <div
        className="flex items-center gap-1 px-6 pt-4 pb-0 shrink-0"
        style={{ background: "#ffffff" }}
      >
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                color: active ? "#0F2744" : "#64748B",
                borderBottom: active ? "2px solid #D4AF37" : "2px solid transparent",
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
