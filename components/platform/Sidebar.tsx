"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Briefcase,
  Megaphone,
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
  X,
  FileText,
  BarChart3,
  Stethoscope,
  Banknote,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import { useNavStore } from "@/lib/stores/navigation";

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
// ACADEMY_LEARNER sees: Academy only (+ Settings/Sign out in bottom)

const STAFF_ROLES = ["CONSULTANT", "ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

const NAV_SECTIONS: NavSection[] = [
  {
    title: "",
    items: [
      { label: "Dashboard",      href: "/dashboard",      icon: LayoutDashboard },
      { label: "Projects",       href: "/projects",       icon: Briefcase },
      { label: "Deliverables",   href: "/deliverables",   icon: FileCheck },
      { label: "Meetings",       href: "/meetings",       icon: Video },
    ],
    roles: STAFF_ROLES,
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
      { label: "Nuru",           href: "/ai",             icon: Sparkles },
      { label: "Tools",          href: "/tools",          icon: Wrench },
    ],
    roles: STAFF_ROLES,
  },
  {
    title: "Marketing",
    items: [
      { label: "Campaigns",      href: "/campaigns",      icon: Megaphone },
    ],
    roles: ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"],
  },
  {
    title: "Learning",
    items: [
      { label: "Academy",        href: "/academy",        icon: GraduationCap },
    ],
  },
  {
    title: "CadreHealth",
    items: [
      { label: "Dashboard",       href: "/admin/cadrehealth",            icon: Stethoscope },
      { label: "Mandates",        href: "/admin/cadrehealth/mandates",   icon: ClipboardList },
      { label: "Outreach",        href: "/admin/cadrehealth/outreach",   icon: Radio },
      { label: "Import",          href: "/admin/cadrehealth/import",     icon: UserPlus },
      { label: "Referrals",       href: "/admin/cadrehealth/referrals",  icon: Share2 },
      { label: "Mentorship",      href: "/admin/cadrehealth/mentorship", icon: Users },
    ],
    roles: ["DIRECTOR", "PARTNER", "ADMIN"],
  },
  {
    title: "Agent Channel",
    items: [
      { label: "Agents",            href: "/admin/agents",               icon: Users },
      { label: "Opportunities",     href: "/admin/agent-opportunities",  icon: Briefcase },
      { label: "Payouts",           href: "/admin/agent-payouts",        icon: Banknote },
    ],
    roles: ["DIRECTOR", "PARTNER", "ADMIN"],
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
      { label: "Referrals",      href: "/admin/referrals", icon: Share2 },
      { label: "Maarova",        href: "/admin/maarova",  icon: Brain },
      { label: "Partners",       href: "/admin/partners",     icon: Building2 },
      { label: "Satisfaction",   href: "/admin/satisfaction", icon: HeartPulse },
      { label: "Gig Approvals",  href: "/admin/own-gig-approvals", icon: FileCheck },
      { label: "Gig Fees",       href: "/admin/own-gig-fees", icon: BarChart3 },
    ],
    roles: ["PARTNER", "ADMIN"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const email = session?.user?.email ?? "";
  const { drawerOpen: mobileOpen, closeDrawer: closeMobile } = useNavStore();

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
        <Image src="/logo-cfa.png" alt="C4A" width={28} height={28} style={{ mixBlendMode: "multiply" }} />
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
                      onClick={() => closeMobile()}
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
        {email === "debo.odulana@consultforafrica.com" && (
          <Link
            href="/founder/dashboard"
            onClick={() => closeMobile()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: pathname.startsWith("/founder") ? "#EFF6FF" : "transparent",
              color: pathname.startsWith("/founder") ? "#0F2744" : "#64748B",
            }}
          >
            <Sparkles size={16} style={{ color: pathname.startsWith("/founder") ? "#0F2744" : "#94A3B8" }} />
            Founder Mode
          </Link>
        )}
        {role !== "ACADEMY_LEARNER" && (
          <Link
            href="/refer"
            onClick={() => closeMobile()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: pathname === "/refer" ? "#EFF6FF" : "transparent",
              color: pathname === "/refer" ? "#0F2744" : "#64748B",
            }}
          >
            <Share2 size={16} style={{ color: pathname === "/refer" ? "#0F2744" : "#94A3B8" }} />
            Refer & Invite
          </Link>
        )}
        <Link
          href="/settings"
          onClick={() => closeMobile()}
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
      {/* Mobile top bar - brand only, navigation via bottom tabs */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 pb-3"
        style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}
      >
        <div className="flex items-center gap-2">
          <Image src="/logo-cfa.png" alt="C4A" width={24} height={24} style={{ mixBlendMode: "multiply" }} />
          <span className="font-semibold text-sm" style={{ color: "#0F2744" }}>C4A</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={closeMobile} />
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-[100dvh] w-60 flex-col z-40"
        style={{ background: "#ffffff", borderRight: "1px solid #E2E8F0" }}
      >
        {navContent}
      </aside>

      {/* Mobile slide-out */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-50 w-[85vw] max-w-72 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#ffffff", borderLeft: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center justify-end px-4 h-14" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <button onClick={() => closeMobile()} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: "#64748B" }}>
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto pb-[calc(var(--bottom-tab-height,56px)+env(safe-area-inset-bottom,0px))]">
          {navContent}
        </div>
      </aside>
    </>
  );
}
