import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MaarovaLogoutButton from "./MaarovaLogoutButton";
import MaarovaMobileNav from "./MaarovaMobileNav";

const baseNavItems = [
  { label: "Dashboard", href: "/maarova/portal/dashboard", icon: "grid" },
  { label: "Assessment", href: "/maarova/portal/assessment", icon: "clipboard" },
  { label: "Results", href: "/maarova/portal/results", icon: "bar-chart" },
  { label: "Development", href: "/maarova/portal/development", icon: "target" },
  { label: "360 Feedback", href: "/maarova/portal/three-sixty", icon: "users" },
  { label: "Profile", href: "/maarova/portal/profile", icon: "user" },
];

const managerNavItems = [
  { label: "Team", href: "/maarova/portal/team", icon: "people" },
];

const hrNavItems = [
  { label: "Org Dashboard", href: "/maarova/portal/org", icon: "building" },
  { label: "People", href: "/maarova/portal/org/users", icon: "people" },
  { label: "Org Goals", href: "/maarova/portal/org/goals", icon: "flag" },
];

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    clipboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    "bar-chart": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    target: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    people: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    building: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    flag: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  };
  return <>{icons[icon] ?? null}</>;
}

export default async function MaarovaPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getMaarovaSession();

  if (!session) {
    redirect("/maarova/portal/login");
  }

  const role = session.role ?? "USER";
  const isManager = role === "MANAGER" || role === "HR_ADMIN";
  const isHR = role === "HR_ADMIN";

  const allNavItems = [
    ...baseNavItems,
    ...(isManager ? managerNavItems : []),
    ...(isHR ? hrNavItems : []),
  ];

  return (
    <div className="flex min-h-[100dvh] overflow-hidden bg-gray-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex w-64 flex-col flex-shrink-0" style={{ backgroundColor: "#0f1a2a" }}>
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Image
              src="/cfa-logo-white.svg"
              alt="CFA"
              width={32}
              height={32}
              className="rounded"
            />
            <div>
              <span className="text-white font-semibold text-lg tracking-tight">
                Maarova
              </span>
              <p className="text-gray-400 text-xs">Leadership Assessment</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {baseNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          ))}

          {/* Manager section */}
          {isManager && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Management
                </p>
              </div>
              {managerNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {/* HR Admin section */}
          {isHR && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Organisation
                </p>
              </div>
              {hrNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                >
                  <NavIcon icon={item.icon} />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: "#D4A574" }}>
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {session.name}
              </p>
              <p className="text-gray-400 text-xs truncate">{session.email}</p>
            </div>
          </div>
          <MaarovaLogoutButton />
        </div>
      </aside>

      {/* Mobile Header + Nav */}
      <MaarovaMobileNav
        userName={session.name}
        userEmail={session.email}
        navItems={allNavItems}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
