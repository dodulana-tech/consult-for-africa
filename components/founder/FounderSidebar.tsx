"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  TrendingUp,
  BookOpen,
  BarChart3,
  Sparkles,
  ArrowLeft,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/founder/dashboard",  icon: LayoutDashboard },
  { label: "Execution",     href: "/founder/tasks",      icon: CheckSquare },
  { label: "Progress",      href: "/founder/progress",   icon: TrendingUp },
  { label: "Knowledge Hub", href: "/founder/knowledge",  icon: BookOpen },
  { label: "Metrics",       href: "/founder/metrics",    icon: BarChart3 },
  { label: "Imara",         href: "/founder/ai-coach",   icon: Sparkles },
];

export default function FounderSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const name = session?.user?.name ?? "Founder";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className="flex flex-col shrink-0 h-screen"
      style={{
        width: 220,
        background: "#0F2744",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-bold leading-tight" style={{ color: "#D4AF37" }}>
          CFA Founder
        </p>
        <p className="text-[10px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          Command Center
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/founder/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: active ? "rgba(212,175,55,0.12)" : "transparent",
                color: active ? "#D4AF37" : "rgba(255,255,255,0.55)",
              }}
            >
              <Icon
                size={15}
                className="shrink-0"
                style={{ color: active ? "#D4AF37" : "rgba(255,255,255,0.4)" }}
              />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={11} style={{ color: "#D4AF37" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className="px-3 py-4 space-y-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate leading-tight">{name}</p>
            <p className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>
              Founder
            </p>
          </div>
        </div>

        {/* Back to Platform */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          <ArrowLeft size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
          Back to Platform
        </Link>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          <LogOut size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
