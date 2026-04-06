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
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {professional.firstName}
        </h1>
        <p className="mt-1 text-gray-500">
          {cadreLabel}
          {professional.subSpecialty ? ` - ${professional.subSpecialty}` : ""}
          {professional.yearsOfExperience
            ? ` / ${professional.yearsOfExperience} years`
            : ""}
        </p>
      </div>

      {/* Profile completeness */}
      {completeness < 80 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-900">
                Complete your profile
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                A stronger profile gets you better matches and unlocks salary data.
              </p>
            </div>
            <div className="text-3xl font-bold text-amber-700">
              {completeness}%
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {professional.credentials.length === 0 && (
              <Link
                href="/oncadre/profile#credentials"
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
              >
                + Add practicing license
              </Link>
            )}
            {professional.qualifications.length === 0 && (
              <Link
                href="/oncadre/profile#qualifications"
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
              >
                + Add qualifications
              </Link>
            )}
            {!professional.salaryReportedAt && (
              <Link
                href="/oncadre/salary-map"
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
              >
                + Share your salary (anonymous)
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Hospital reviews */}
        <DashCard
          title="Hospital Reviews"
          value="Explore"
          subtitle="Read and write anonymous reviews"
          href="/oncadre/hospitals"
          accent="#EF4444"
        />

        {/* Referral */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Your Referral Code</h3>
          <div className="mt-2 flex items-center gap-3">
            <code className="rounded-lg bg-gray-100 px-4 py-2 text-lg font-bold tracking-wider text-[#0B3C5D]">
              {professional.referralCode}
            </code>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Share with colleagues. You both benefit when they join.
          </p>
        </div>
      </div>

      {/* Verification CTA */}
      {professional.accountStatus === "UNVERIFIED" && (
        <div className="rounded-xl border border-[#0B3C5D]/20 bg-[#0B3C5D]/5 p-6">
          <h3 className="font-semibold text-[#0B3C5D]">
            Get CadreHealth Verified
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Add your practicing license number to get verified against your
            regulatory body. Verified professionals get priority in matching
            and can review hospitals.
          </p>
          <Link
            href="/oncadre/profile#credentials"
            className="mt-4 inline-flex items-center rounded-lg bg-[#0B3C5D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0A3350]"
          >
            Add license details
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Dashboard card ────────────────────────────────────────────────────── */

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
      className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 text-3xl font-bold" style={{ color: accent }}>
        {value}
      </div>
      <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </Link>
  );
}
