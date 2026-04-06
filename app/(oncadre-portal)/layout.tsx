import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import Link from "next/link";

const navItems = [
  { href: "/oncadre/dashboard", label: "Dashboard", icon: "home" },
  { href: "/oncadre/profile", label: "Profile", icon: "user" },
  { href: "/oncadre/salary-map", label: "Salary Map", icon: "salary" },
  { href: "/oncadre/hospitals", label: "Hospitals", icon: "hospital" },
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
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/oncadre/dashboard" className="text-xl font-bold text-[#0B3C5D]">
            Cadre<span className="text-[#D4AF37]">Health</span>
          </Link>

          <div className="hidden sm:flex sm:items-center sm:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-medium text-gray-900">
                {session.firstName} {session.lastName}
              </span>
            </div>
            {session.accountStatus === "VERIFIED" && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Verified
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white sm:hidden">
        <div className="flex h-14">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs text-gray-500"
            >
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 sm:pb-6">
        {children}
      </main>
    </div>
  );
}
