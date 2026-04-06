import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import Link from "next/link";

const navItems = [
  { href: "/oncadre/dashboard", label: "Dashboard", icon: "home" },
  { href: "/oncadre/profile", label: "Profile", icon: "user" },
  { href: "/oncadre/salary-map", label: "Salary Map", icon: "salary" },
  { href: "/oncadre/explore", label: "Hospitals", icon: "hospital" },
  { href: "/oncadre/referrals", label: "Referrals", icon: "referral" },
];

export default async function OncadrePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

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
          <Link
            href="/oncadre/dashboard"
            className="text-xl font-bold tracking-tight text-[#0B3C5D]"
          >
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>

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
            {session.accountStatus === "VERIFIED" && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                  color: "#065f46",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "#0B3C5D" }}
            >
              {session.firstName?.[0]}
              {session.lastName?.[0]}
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
              <NavIcon icon={item.icon} />
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

/* Mini icons for mobile bottom tabs */
function NavIcon({ icon }: { icon: string }) {
  const cls = "h-5 w-5";
  switch (icon) {
    case "home":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
      );
    case "user":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "salary":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "hospital":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "referral":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}
