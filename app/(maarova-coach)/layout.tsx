import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CoachLogoutButton from "./CoachLogoutButton";
import CoachMobileNav from "./CoachMobileNav";
import CoachBottomTabs from "./CoachBottomTabs";

const navItems = [
  { label: "Dashboard", href: "/maarova/coach/dashboard" },
];

export default async function CoachPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getMaarovaCoachSession();

  if (!session) {
    redirect("/maarova/coach/login");
  }

  return (
    <div className="flex h-[100dvh] bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col flex-shrink-0" style={{ backgroundColor: "#0f1a2a" }}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Image src="/logo-cfa.png" alt="C4A" width={32} height={32} className="rounded" />
            <div>
              <span className="text-white font-semibold text-lg tracking-tight">Maarova</span>
              <p className="text-gray-400 text-xs">Coach Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: "#D4A574" }}>
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{session.name}</p>
              <p className="text-gray-400 text-xs truncate">{session.email}</p>
            </div>
          </div>
          <CoachLogoutButton />
        </div>
      </aside>

      {/* Mobile Nav */}
      <CoachMobileNav userName={session.name} navItems={navItems} />

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 pb-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom,0px))] lg:pb-0">{children}</main>
      <CoachBottomTabs />
    </div>
  );
}
