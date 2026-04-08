"use client";

import Link from "next/link";
import { LayoutGrid, Pencil } from "lucide-react";

export default function MandateTabSwitcher({
  currentTab,
  mandateId,
}: {
  currentTab: "overview" | "edit";
  mandateId: string;
}) {
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutGrid, href: `/admin/cadrehealth/mandates/${mandateId}` },
    { key: "edit", label: "Edit", icon: Pencil, href: `/admin/cadrehealth/mandates/${mandateId}?tab=edit` },
  ];

  return (
    <div className="flex gap-1 rounded-xl bg-gray-100 p-1" style={{ width: "fit-content" }}>
      {tabs.map((tab) => {
        const isActive = tab.key === currentTab;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-white text-[#0F2744] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
