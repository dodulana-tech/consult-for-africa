"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Briefcase,
  FileCheck,
  Users,
  Building2,
  Clock,
  Settings,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserPlus,
  Share2,
  BookOpen,
  Library,
  GraduationCap,
  Wrench,
  Radio,
  Brain,
  ClipboardList,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Dashboard",      href: "/dashboard",     icon: LayoutDashboard },
  { label: "Projects",       href: "/projects",      icon: Briefcase },
  { label: "Deliverables",   href: "/deliverables",  icon: FileCheck },
  { label: "Proposals",      href: "/proposals",     icon: FileCheck },
  { label: "Consultants",    href: "/consultants",   icon: Users },
  { label: "Clients",        href: "/clients",       icon: Building2 },
  { label: "Time & Payments",href: "/timesheets",    icon: Clock },
  { label: "Opportunities",  href: "/opportunities", icon: Radio },
  { label: "Nuru",          href: "/ai",            icon: Sparkles },
  { label: "Knowledge Base", href: "/knowledge",     icon: BookOpen },
  { label: "Methodologies",  href: "/methodology",   icon: Library },
  { label: "Academy",        href: "/academy",       icon: GraduationCap },
  { label: "Tools",           href: "/tools",         icon: Wrench },
  { label: "Talent Pipeline",href: "/talent",        icon: UserPlus },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const isAdmin = ["PARTNER", "ADMIN"].includes(role);
  const isConsultant = role === "CONSULTANT";

  const visibleNav = NAV_ITEMS.filter(({ href }) => {
    if (isConsultant && (href === "/consultants" || href === "/clients" || href === "/talent" || href === "/proposals")) return false;
    return true;
  });

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
      style={{ background: "#ffffff", borderRight: "1px solid #E2E8F0" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 h-16 shrink-0"
        style={{ borderBottom: "1px solid #E2E8F0" }}
      >
        <Image src="/logo-cfa.png" alt="CFA" width={28} height={28} style={{ mixBlendMode: "multiply" }} />
        <div>
          <p className="font-semibold text-sm leading-tight" style={{ color: "#0F2744" }}>Consult For Africa</p>
          <p className="text-[10px] leading-tight" style={{ color: "#D4AF37" }}>Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group"
              style={{
                background: active ? "#EFF6FF" : "transparent",
                color: active ? "#0F2744" : "#64748B",
              }}
            >
              <Icon
                size={16}
                className="shrink-0 transition-colors"
                style={{ color: active ? "#0F2744" : "#94A3B8" }}
              />
              <span className="flex-1 font-medium">{label}</span>
              {active && <ChevronRight size={12} style={{ color: "#0F2744" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className="px-3 py-4 space-y-0.5"
        style={{ borderTop: "1px solid #E2E8F0" }}
      >
        <Link
          href="/refer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{
            background: pathname === "/refer" ? "#EFF6FF" : "transparent",
            color: pathname === "/refer" ? "#0F2744" : "#64748B",
          }}
        >
          <Share2 size={16} style={{ color: pathname === "/refer" ? "#0F2744" : "#94A3B8" }} />
          Refer & Invite
        </Link>
        {isAdmin && (
          <>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: pathname === "/admin/users" ? "#EFF6FF" : "transparent",
                color: pathname === "/admin/users" ? "#0F2744" : "#64748B",
              }}
            >
              <ShieldCheck size={16} style={{ color: pathname === "/admin/users" ? "#0F2744" : "#94A3B8" }} />
              User Management
            </Link>
            <Link
              href="/admin/referrals"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: pathname === "/admin/referrals" ? "#EFF6FF" : "transparent",
                color: pathname === "/admin/referrals" ? "#0F2744" : "#64748B",
              }}
            >
              <Share2 size={16} style={{ color: pathname === "/admin/referrals" ? "#0F2744" : "#94A3B8" }} />
              Referrals
            </Link>
            <Link
              href="/admin/onboarding"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: pathname.startsWith("/admin/onboarding") ? "#EFF6FF" : "transparent",
                color: pathname.startsWith("/admin/onboarding") ? "#0F2744" : "#64748B",
              }}
            >
              <ClipboardList size={16} style={{ color: pathname.startsWith("/admin/onboarding") ? "#0F2744" : "#94A3B8" }} />
              Onboarding
            </Link>
            <Link
              href="/admin/maarova"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: pathname.startsWith("/admin/maarova") ? "#EFF6FF" : "transparent",
                color: pathname.startsWith("/admin/maarova") ? "#0F2744" : "#64748B",
              }}
            >
              <Brain size={16} style={{ color: pathname.startsWith("/admin/maarova") ? "#0F2744" : "#94A3B8" }} />
              Maarova Admin
            </Link>
          </>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "#64748B" }}
        >
          <Settings size={16} style={{ color: "#94A3B8" }} />
          Settings
        </Link>
        <button
          onClick={() => { sessionStorage.clear(); signOut({ callbackUrl: "/login" }); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "#64748B" }}
        >
          <LogOut size={16} style={{ color: "#94A3B8" }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
