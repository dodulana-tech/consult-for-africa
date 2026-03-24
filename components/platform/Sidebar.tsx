"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
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
  Wrench,
  Brain,
  FileSearch,
  HeartPulse,
  Users,
  TrendingUp,
  FileCheck,
  GraduationCap,
  Radio,
  ClipboardList,
  Video,
  Menu,
  X,
  FileText,
  BarChart3,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
  roles?: string[]; // if set, only these roles see the section
}

// Role-based nav configuration
// CONSULTANT sees: Dashboard, Projects, Deliverables, Opportunities, Time, Knowledge, Nuru, Academy, Tools
// EM sees: Above + Clients, Pipeline, Consultants, Talent
// DIRECTOR+ sees: Above + Admin section

const NAV_SECTIONS: NavSection[] = [
  {
    title: "",
    items: [
      { label: "Dashboard",      href: "/dashboard",      icon: LayoutDashboard },
      { label: "Projects",       href: "/projects",       icon: Briefcase },
      { label: "Deliverables",   href: "/deliverables",   icon: FileCheck },
      { label: "Meetings",       href: "/meetings",       icon: Video },
    ],
  },
  {
    title: "Pipeline",
    items: [
      { label: "Pipeline",       href: "/pipeline",       icon: TrendingUp },
      { label: "Clients",        href: "/clients",        icon: Building2 },
    ],
    roles: ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"],
  },
  {
    title: "opportunities",
    items: [
      { label: "Opportunities",  href: "/opportunities",  icon: Radio },
    ],
    roles: ["CONSULTANT"],
  },
  {
    title: "Own Gigs",
    items: [
      { label: "My Gigs",       href: "/own-gigs",       icon: Briefcase },
    ],
    roles: ["CONSULTANT"],
  },
  {
    title: "Team",
    items: [
      { label: "Consultants",    href: "/consultants",    icon: Users },
      { label: "Talent",         href: "/talent",         icon: UserPlus },
    ],
    roles: ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"],
  },
  {
    title: "Operations",
    items: [
      { label: "Time & Payments",href: "/timesheets",     icon: Clock },
      { label: "Knowledge",      href: "/knowledge",      icon: BookOpen },
      { label: "Asset Library",   href: "/knowledge/library", icon: FileSearch },
      { label: "Academy",        href: "/academy",        icon: GraduationCap },
      { label: "Nuru",           href: "/ai",             icon: Sparkles },
      { label: "Tools",          href: "/tools",          icon: Wrench },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Invoices",        href: "/finance/invoices",  icon: FileText },
      { label: "Reports",         href: "/finance/reports",   icon: BarChart3 },
    ],
    roles: ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"],
  },
  {
    title: "Admin",
    items: [
      { label: "Users",          href: "/admin/users",    icon: ShieldCheck },
      { label: "Onboarding",     href: "/admin/onboarding", icon: ClipboardList },
      { label: "Assessments",    href: "/admin/assessments", icon: FileSearch },
      { label: "Outreach",       href: "/admin/outreach", icon: Share2 },
      { label: "Maarova",        href: "/admin/maarova",  icon: Brain },
      { label: "Partners",       href: "/admin/partners",     icon: Building2 },
      { label: "Satisfaction",   href: "/admin/satisfaction", icon: HeartPulse },
      { label: "Gig Fees",       href: "/admin/own-gig-fees", icon: BarChart3 },
    ],
    roles: ["PARTNER", "ADMIN"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    if (href === "/pipeline") {
      return pathname.startsWith("/pipeline") ||
        pathname.startsWith("/discovery-calls") ||
        pathname.startsWith("/proposals") ||
        pathname.startsWith("/leads") ||
        pathname.startsWith("/admin/expansion-requests");
    }
    if (href === "/knowledge") {
      return pathname.startsWith("/knowledge") ||
        pathname.startsWith("/methodology");
    }
    return pathname.startsWith(href);
  }

  const navContent = (
    <>
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 h-14 lg:h-16 shrink-0"
        style={{ borderBottom: "1px solid #E2E8F0" }}
      >
        <Image src="/logo-cfa.png" alt="CFA" width={28} height={28} style={{ mixBlendMode: "multiply" }} />
        <div>
          <p className="font-semibold text-sm leading-tight" style={{ color: "#0F2744" }}>Consult For Africa</p>
          <p className="text-[10px] leading-tight" style={{ color: "#D4AF37" }}>Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV_SECTIONS.map((section) => {
          if (section.roles && !section.roles.includes(role)) return null;

          return (
            <div key={section.title || "main"} className="mb-1">
              {section.title && section.title !== "opportunities" && (
                <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group"
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
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className="px-3 py-3 space-y-0.5"
        style={{ borderTop: "1px solid #E2E8F0" }}
      >
        <Link
          href="/refer"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: pathname === "/refer" ? "#EFF6FF" : "transparent",
            color: pathname === "/refer" ? "#0F2744" : "#64748B",
          }}
        >
          <Share2 size={16} style={{ color: pathname === "/refer" ? "#0F2744" : "#94A3B8" }} />
          Refer & Invite
        </Link>
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "#64748B" }}
        >
          <Settings size={16} style={{ color: "#94A3B8" }} />
          Settings
        </Link>
        <button
          onClick={() => { sessionStorage.clear(); signOut({ callbackUrl: "/login" }); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "#64748B" }}
        >
          <LogOut size={16} style={{ color: "#94A3B8" }} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center gap-2">
          <Image src="/logo-cfa.png" alt="CFA" width={24} height={24} style={{ mixBlendMode: "multiply" }} />
          <span className="font-semibold text-sm" style={{ color: "#0F2744" }}>CFA</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
          style={{ color: "#64748B" }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col z-40"
        style={{ background: "#ffffff", borderRight: "1px solid #E2E8F0" }}
      >
        {navContent}
      </aside>

      {/* Mobile slide-out */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#ffffff", borderLeft: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center justify-end px-4 h-14" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: "#64748B" }}>
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {navContent}
        </div>
      </aside>
    </>
  );
}
