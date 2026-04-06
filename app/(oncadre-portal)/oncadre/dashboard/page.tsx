import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";

export default async function CadreDashboard() {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    include: {
      credentials: { take: 5, orderBy: { createdAt: "desc" } },
      cpdEntries: { take: 5, orderBy: { dateCompleted: "desc" } },
      qualifications: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  if (!professional) redirect("/oncadre/register");

  const cadreLabel = getCadreLabel(professional.cadre);
  const completeness = professional.profileCompleteness;

  // CPD summary
  const cpdTotal = professional.cpdEntries.reduce(
    (sum, e) => sum + Number(e.points),
    0
  );

  return (
    <div className="space-y-8">
      {/* Welcome header band */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
        style={{
          background: "linear-gradient(135deg, #0B3C5D 0%, #0E4D6E 50%, #0B3C5D 100%)",
          boxShadow: "0 4px 24px rgba(11,60,93,0.18)",
        }}
      >
        {/* Grain texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
          }}
        />
        {/* Gold accent glow */}
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
            {cadreLabel}
            {professional.subSpecialty ? ` / ${professional.subSpecialty}` : ""}
          </p>
          <h1
            className="mt-2 font-bold text-white"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
          >
            Welcome back, {professional.firstName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            {professional.yearsOfExperience
              ? `${professional.yearsOfExperience} years of experience`
              : "Complete your profile to get started"}
          </p>
        </div>
      </div>

      {/* Profile completeness */}
      {completeness < 80 && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
            border: "1px solid rgba(245,158,11,0.2)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-900">
                Complete your profile
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                A stronger profile gets you better matches and unlocks salary data.
              </p>
            </div>
            <div
              className="text-3xl font-bold"
              style={{
                background: "linear-gradient(135deg, #D97706, #B45309)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {completeness}%
            </div>
          </div>
          <div
            className="mt-4 h-3 overflow-hidden rounded-full"
            style={{ background: "rgba(245,158,11,0.15)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${completeness}%`,
                background: "linear-gradient(90deg, #F59E0B, #D97706)",
                boxShadow: "0 0 8px rgba(245,158,11,0.4)",
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {professional.credentials.length === 0 && (
              <Link
                href="/oncadre/profile#credentials"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-amber-800 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                + Add practicing license
              </Link>
            )}
            {professional.qualifications.length === 0 && (
              <Link
                href="/oncadre/profile#qualifications"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-amber-800 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                + Add qualifications
              </Link>
            )}
            {!professional.salaryReportedAt && (
              <Link
                href="/oncadre/salary-map"
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-amber-800 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                + Share your salary (anonymous)
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Readiness score */}
        <DashCard
          title="Career Readiness"
          value={
            professional.readinessScoreDomestic
              ? `${professional.readinessScoreDomestic}%`
              : "--"
          }
          subtitle={
            professional.readinessScoreDomestic
              ? "Domestic employability"
              : "Take the assessment"
          }
          href="/oncadre/readiness"
          accent="#10B981"
        />

        {/* CPD tracker */}
        <DashCard
          title="CPD Points"
          value={cpdTotal.toString()}
          subtitle="Points this cycle"
          href="/oncadre/profile#cpd"
          accent="#3B82F6"
        />

        {/* Credentials */}
        <DashCard
          title="Credentials"
          value={professional.credentials.length.toString()}
          subtitle={
            professional.accountStatus === "VERIFIED"
              ? "Verified professional"
              : "Add credentials to get verified"
          }
          href="/oncadre/profile#credentials"
          accent="#8B5CF6"
        />

        {/* Salary intel */}
        <DashCard
          title="Salary Map"
          value={professional.salaryReportedAt ? "Unlocked" : "Locked"}
          subtitle={
            professional.salaryReportedAt
              ? "Share your salary to see others"
              : "Share your salary to unlock"
          }
          href="/oncadre/salary-map"
          accent="#F59E0B"
        />

        {/* Profile views */}
        <DashCard
          title="Profile Views"
          value={professional.profileViews.toString()}
          subtitle={
            professional.lastViewedAt
              ? `Last viewed ${professional.lastViewedAt.toLocaleDateString()}`
              : "Employers can find you here"
          }
          href="/oncadre/profile"
          accent="#EC4899"
        />

        {/* Hospital reviews */}
        <DashCard
          title="Hospital Reviews"
          value="Explore"
          subtitle="Read and write anonymous reviews"
          href="/oncadre/hospitals"
          accent="#EF4444"
        />

        {/* Referral */}
        <div
          className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, #0B3C5D 0%, #0E4D6E 100%)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          {/* Gold accent corner */}
          <div
            className="absolute top-0 right-0 h-20 w-20 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 100% 0%, rgba(212,175,55,0.2) 0%, transparent 70%)",
            }}
          />
          <h3
            className="text-xs font-medium uppercase tracking-[0.15em]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Your Referral Code
          </h3>
          <div className="mt-3 flex items-center gap-3">
            <code
              className="rounded-lg px-4 py-2.5 text-lg font-bold tracking-widest"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "#D4AF37",
              }}
            >
              {professional.referralCode}
            </code>
          </div>
          <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Share with colleagues. You both benefit when they join.
          </p>
        </div>
      </div>

      {/* Verification CTA */}
      {professional.accountStatus === "UNVERIFIED" && (
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg, rgba(11,60,93,0.06), rgba(11,60,93,0.03))",
            border: "1px solid rgba(11,60,93,0.12)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
              }}
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0B3C5D]">
                Get CadreHealth Verified
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Add your practicing license number to get verified against your
                regulatory body. Verified professionals get priority in matching
                and can review hospitals.
              </p>
              <Link
                href="/oncadre/profile#credentials"
                className="mt-4 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
                  boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
                }}
              >
                Add license details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Dashboard card ---- */

function DashCard({
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
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: accent }}
        />
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
