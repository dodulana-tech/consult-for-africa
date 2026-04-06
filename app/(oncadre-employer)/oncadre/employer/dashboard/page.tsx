import { redirect } from "next/navigation";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EmployerDashboard() {
  const session = await getCadreEmployerSession();
  if (!session) redirect("/oncadre/employer/login");

  // Get employer stats
  const [activeListings, totalApplications] = await Promise.all([
    prisma.cadreMandate.count({
      where: {
        facilityId: session.facilityId || undefined,
        facilityName: session.facilityId ? undefined : session.companyName,
        status: "OPEN",
        isPublished: true,
      },
    }),
    prisma.cadreMandate
      .aggregate({
        where: {
          facilityId: session.facilityId || undefined,
          facilityName: session.facilityId ? undefined : session.companyName,
          isPublished: true,
        },
        _sum: { applicationCount: true },
      })
      .then((r) => r._sum.applicationCount || 0),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
        style={{
          background: "linear-gradient(135deg, #0B3C5D 0%, #0E4D6E 50%, #0B3C5D 100%)",
          boxShadow: "0 4px 24px rgba(11,60,93,0.18)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 50% 80% at 90% 20%, rgba(212,175,55,0.12) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <p
            className="text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: "#D4AF37" }}
          >
            Employer Dashboard
          </p>
          <h1
            className="mt-2 font-bold text-white"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
          >
            Welcome, {session.contactName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {session.companyName}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Listings"
          value={activeListings.toString()}
          subtitle="Published open positions"
          href="/oncadre/employer/post-role"
          accent="#0B3C5D"
        />
        <StatCard
          title="Total Applications"
          value={totalApplications.toString()}
          subtitle="Across all listings"
          href="/oncadre/employer/dashboard"
          accent="#D4AF37"
        />
        <StatCard
          title="Search Professionals"
          value="Browse"
          subtitle="Find talent by cadre and specialty"
          href="/oncadre/employer/search"
          accent="#10B981"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          href="/oncadre/employer/post-role"
          className="group rounded-2xl bg-white p-6 transition-all duration-200 hover:scale-[1.01]"
          style={{
            border: "1px solid #E8EBF0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(11,60,93,0.06)" }}
          >
            <svg className="h-6 w-6 text-[#0B3C5D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition-colors">
            Post a New Role
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a job listing and reach verified healthcare professionals.
          </p>
        </Link>

        <Link
          href="/oncadre/employer/search"
          className="group rounded-2xl bg-white p-6 transition-all duration-200 hover:scale-[1.01]"
          style={{
            border: "1px solid #E8EBF0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(16,185,129,0.06)" }}
          >
            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
            Search Professionals
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Find doctors, nurses, pharmacists, and more by specialty, location, and availability.
          </p>
        </Link>
      </div>

      {/* Verification CTA */}
      {!session.isVerified && (
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))",
            border: "1px solid rgba(212,175,55,0.15)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(212,175,55,0.12)" }}
            >
              <svg className="h-6 w-6" style={{ color: "#B8941E" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Get Verified
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Verified employers get priority access to professional profiles and
                can send direct contact requests. Contact us to verify your facility.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  href,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white p-6 transition-all duration-200 hover:scale-[1.01]"
      style={{
        border: "1px solid #E8EBF0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-2 w-2 rounded-full" style={{ background: accent }} />
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      <div className="mt-3 text-3xl font-bold" style={{ color: accent }}>
        {value}
      </div>
      <p className="mt-1.5 text-sm text-gray-400 group-hover:text-gray-500 transition-colors duration-200">
        {subtitle}
      </p>
    </Link>
  );
}
