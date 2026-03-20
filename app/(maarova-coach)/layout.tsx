import { getMaarovaCoachSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CoachLogoutButton from "./CoachLogoutButton";

const navItems = [
  { label: "Dashboard", href: "/maarova/coach/dashboard", icon: "grid" },
];

function NavIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  };
  return <>{icons[icon] ?? null}</>;
}

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
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 flex flex-col" style={{ backgroundColor: "#0f1a2a" }}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Image src="/cfa-logo-white.svg" alt="CFA" width={32} height={32} className="rounded" />
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
              <NavIcon icon={item.icon} />
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

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
