"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useNavStore } from "@/lib/stores/navigation";

export interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  /** If set, calls this instead of navigating */
  action?: () => void;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  /** Dark variant for Maarova portals */
  variant?: "light" | "dark";
  /** Unique ID to scope layoutId animations per portal */
  portalId?: string;
}

export default function BottomTabBar({ tabs, variant = "light", portalId = "default" }: BottomTabBarProps) {
  const pathname = usePathname();
  const closeDrawer = useNavStore((s) => s.closeDrawer);

  // Close drawer on route change (handles browser back, programmatic nav)
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  const isDark = variant === "dark";

  const colors = isDark
    ? {
        bg: "#0f1a2a",
        border: "rgba(255,255,255,0.1)",
        active: "#D4A574",
        inactive: "rgba(255,255,255,0.4)",
      }
    : {
        bg: "#ffffff",
        border: "#e5eaf0",
        active: "#0F2744",
        inactive: "#94A3B8",
      };

  function isActive(tab: TabItem) {
    if (tab.action) return false;
    // Exact match for the first tab (typically dashboard/home)
    if (tab === tabs[0]) return pathname === tab.href;
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      role="tablist"
      aria-label="Navigation"
      style={{
        background: colors.bg,
        borderTop: `1px solid ${colors.border}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around" style={{ height: "var(--bottom-tab-height, 56px)" }}>
        {tabs.map((tab, i) => {
          const active = isActive(tab);
          const Icon = tab.icon;

          const content = (
            <div className="relative flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-1">
              {active && (
                <motion.div
                  layoutId={`tab-indicator-${portalId}`}
                  className="absolute -top-1 rounded-full"
                  style={{
                    width: 20,
                    height: 3,
                    background: colors.active,
                    borderRadius: 2,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                  style={{ color: active ? colors.active : colors.inactive }}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
                    style={{ background: "#EF4444" }}
                    aria-label={`${tab.badge} notifications`}
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>

              <span
                className="text-[10px] font-medium leading-tight"
                style={{ color: active ? colors.active : colors.inactive }}
              >
                {tab.label}
              </span>
            </div>
          );

          if (tab.action) {
            return (
              <button
                key={`action-${i}`}
                onClick={tab.action}
                role="tab"
                aria-selected={false}
                aria-label={tab.label}
                className="flex items-center justify-center"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className="flex items-center justify-center"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
