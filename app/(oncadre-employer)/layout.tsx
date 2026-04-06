import { redirect } from "next/navigation";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import Link from "next/link";

const navItems = [
  { href: "/oncadre/employer/dashboard", label: "Dashboard", icon: "home" },
  { href: "/oncadre/employer/post-role", label: "Post Role", icon: "plus" },
  { href: "/oncadre/employer/search", label: "Search", icon: "search" },
];

export default async function OncadreEmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCadreEmployerSession();
  if (!session) redirect("/oncadre/employer/login");

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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/oncadre/employer/dashboard"
              className="text-xl font-bold tracking-tight text-[#0B3C5D]"
            >
              Cadre<span style={{ color: "#D4AF37" }}>Health</span>
            </Link>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgba(212,175,55,0.1)", color: "#B8941E" }}
            >
              Employer
            </span>
          </div>

          <div className="hidden sm:flex sm:items-center sm:gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-[#0B3C5D]/5 hover:text-[#0B3C5D]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {session.isVerified && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                  color: "#065f46",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                Verified
              </span>
            )}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "#0B3C5D" }}
            >
              {session.contactName?.[0]?.toUpperCase() || "E"}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 bg-white sm:hidden"
        style={{
          borderTop: "1px solid #E8EBF0",
          boxShadow: "0 -1px 3px rgba(0,0,0,0.04), 0 -4px 12px rgba(0,0,0,0.03)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex" style={{ minHeight: "56px" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-gray-400 transition-colors duration-200 hover:text-[#0B3C5D]"
              style={{ minHeight: "44px" }}
            >
              <EmployerNavIcon icon={item.icon} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function EmployerNavIcon({ icon }: { icon: string }) {
  const cls = "h-5 w-5";
  switch (icon) {
    case "home":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      );
    case "plus":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
        </svg>
      );
    case "search":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    default:
      return null;
  }
}
