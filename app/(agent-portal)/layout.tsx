import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AgentLogoutButton from "./AgentLogoutButton";

const navItems = [
  { href: "/agent/dashboard", label: "Dashboard" },
  { href: "/agent/opportunities", label: "Opportunities" },
  { href: "/agent/deals", label: "Deals" },
  { href: "/agent/earnings", label: "Earnings" },
  { href: "/agent/profile", label: "Profile" },
];

export default async function AgentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const isPending = session.status === "APPLIED" || session.status === "VETTING";

  return (
    <div className="min-h-screen" style={{ background: "#F8F9FB" }}>
      {/* Top nav */}
      <nav
        className="sticky top-0 z-50 bg-white"
        style={{
          borderBottom: "1px solid #E8EBF0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/agent/dashboard"
            className="flex items-center gap-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 26, width: "auto" }} />
            <span className="text-sm font-bold" style={{ color: "#0F2744" }}>
              Agent Portal
            </span>
          </Link>

          {!isPending && (
            <div className="hidden items-center gap-0.5 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition hover:bg-[#0F2744]/5 hover:text-[#0F2744]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            {isPending && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Pending Review
              </span>
            )}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "#0F2744" }}
            >
              {session.firstName?.[0]}{session.lastName?.[0]}
            </div>
            <AgentLogoutButton />
          </div>
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      {!isPending && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 bg-white sm:hidden"
          style={{
            borderTop: "1px solid #E8EBF0",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="flex" style={{ minHeight: "56px" }}>
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-400"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:pb-6 pb-24">
        {children}
      </main>
    </div>
  );
}
