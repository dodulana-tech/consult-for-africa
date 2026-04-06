import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCadreLabel, getRegulatoryBody } from "@/lib/cadreHealth/cadres";
import { VerifyButton } from "@/components/cadrehealth/VerifyButton";

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  UNVERIFIED: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-red-100 text-red-600",
};

const VERIFICATION_COLORS: Record<string, string> = {
  NOT_SUBMITTED: "bg-gray-100 text-gray-500",
  PENDING: "bg-amber-100 text-amber-700",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-600",
  EXPIRED: "bg-orange-100 text-orange-600",
};

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    include: {
      credentials: { orderBy: { createdAt: "desc" } },
      qualifications: { orderBy: { yearObtained: "desc" } },
      cpdEntries: { orderBy: { dateCompleted: "desc" }, take: 20 },
      workHistory: { orderBy: { startDate: "desc" } },
      salaryReports: {
        orderBy: { reportedAt: "desc" },
        take: 5,
        select: {
          id: true,
          cadre: true,
          role: true,
          state: true,
          baseSalary: true,
          currency: true,
          totalMonthlyTakeHome: true,
          reportedAt: true,
        },
      },
      facilityReviews: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          facility: { select: { name: true, slug: true } },
        },
      },
      mandateMatches: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          mandate: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!professional) notFound();

  const totalCPDPoints = professional.cpdEntries.reduce(
    (acc, e) => acc + Number(e.points),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/cadrehealth"
            className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; CadreHealth Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {professional.firstName} {professional.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>{getCadreLabel(professional.cadre)}</span>
            {professional.subSpecialty && (
              <>
                <span>&middot;</span>
                <span>{professional.subSpecialty}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              ACCOUNT_STATUS_COLORS[professional.accountStatus] || "bg-gray-100 text-gray-600"
            }`}
          >
            {professional.accountStatus.replace(/_/g, " ")}
          </span>
          {professional.accountStatus !== "VERIFIED" && (
            <VerifyButton professionalId={professional.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">Personal Information</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={professional.email} />
            <Row label="Phone" value={professional.phone || "Not provided"} />
            <Row
              label="Location"
              value={
                professional.isDiaspora
                  ? `Diaspora (${professional.diasporaCountry || "N/A"})`
                  : [professional.city, professional.state].filter(Boolean).join(", ") || "N/A"
              }
            />
            <Row label="Country" value={professional.country} />
            {professional.yearsOfExperience != null && (
              <Row label="Experience" value={`${professional.yearsOfExperience} years`} />
            )}
            {professional.currentRole && (
              <Row label="Current Role" value={professional.currentRole} />
            )}
            {professional.currentFacility && (
              <Row label="Current Facility" value={professional.currentFacility} />
            )}
            <Row label="Regulatory Body" value={getRegulatoryBody(professional.cadre)} />
            {professional.availability && (
              <Row
                label="Availability"
                value={professional.availability.replace(/_/g, " ")}
              />
            )}
            {professional.openTo.length > 0 && (
              <Row
                label="Open To"
                value={professional.openTo.map((o) => o.replace(/_/g, " ")).join(", ")}
              />
            )}
            {professional.noticePeriodWeeks != null && (
              <Row label="Notice Period" value={`${professional.noticePeriodWeeks} weeks`} />
            )}
            {professional.referralCode && (
              <Row label="Referral Code" value={professional.referralCode} />
            )}
            <Row label="Profile Completeness" value={`${professional.profileCompleteness}%`} />
            <Row label="Joined" value={professional.createdAt.toLocaleDateString()} />
          </dl>
        </div>

        {/* Credentials */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            Credentials ({professional.credentials.length})
          </h2>
          {professional.credentials.length === 0 ? (
            <p className="text-sm text-gray-400">No credentials submitted yet</p>
          ) : (
            <div className="space-y-3">
              {professional.credentials.map((c) => (
                <div key={c.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-500">{c.regulatoryBody}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        VERIFICATION_COLORS[c.verificationStatus] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.verificationStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-400">
                    {c.licenseNumber && <span>License: {c.licenseNumber}</span>}
                    {c.expiryDate && (
                      <span>Expires: {c.expiryDate.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Qualifications */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            Qualifications ({professional.qualifications.length})
          </h2>
          {professional.qualifications.length === 0 ? (
            <p className="text-sm text-gray-400">No qualifications added yet</p>
          ) : (
            <div className="space-y-3">
              {professional.qualifications.map((q) => (
                <div key={q.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{q.name}</p>
                      <p className="text-xs text-gray-500">
                        {q.type.replace(/_/g, " ")}
                        {q.institution && ` - ${q.institution}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        VERIFICATION_COLORS[q.verificationStatus] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {q.verificationStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-400">
                    {q.yearObtained && <span>Year: {q.yearObtained}</span>}
                    {q.score && <span>Score: {q.score}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CPD */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            CPD Entries ({professional.cpdEntries.length})
          </h2>
          <p className="mb-3 text-sm text-gray-500">
            Total points: <strong>{totalCPDPoints}</strong>
          </p>
          {professional.cpdEntries.length === 0 ? (
            <p className="text-sm text-gray-400">No CPD entries logged yet</p>
          ) : (
            <div className="space-y-2">
              {professional.cpdEntries.map((e) => (
                <div key={e.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.activity}</p>
                    <p className="text-xs text-gray-500">
                      {e.category.replace(/_/g, " ")}
                      {e.provider && ` - ${e.provider}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.dateCompleted.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {Number(e.points)} pts
                    </span>
                    {e.verified && (
                      <p className="text-xs text-emerald-600">Verified</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Work History */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            Work History ({professional.workHistory.length})
          </h2>
          {professional.workHistory.length === 0 ? (
            <p className="text-sm text-gray-400">No work history added yet</p>
          ) : (
            <div className="space-y-3">
              {professional.workHistory.map((w) => (
                <div key={w.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-gray-900">{w.role}</p>
                  <p className="text-xs text-gray-500">
                    {w.facilityName}
                    {w.department && ` - ${w.department}`}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-400">
                    <span>
                      {w.startDate.toLocaleDateString()} -{" "}
                      {w.isCurrent ? "Present" : w.endDate?.toLocaleDateString() || "N/A"}
                    </span>
                    {w.confirmedByFacility && (
                      <span className="text-emerald-600">Confirmed by facility</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Salary Reports (admin view) */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            Salary Reports ({professional.salaryReports.length})
          </h2>
          {professional.salaryReports.length === 0 ? (
            <p className="text-sm text-gray-400">No salary reports submitted</p>
          ) : (
            <div className="space-y-2">
              {professional.salaryReports.map((s) => (
                <div key={s.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.role}</p>
                      <p className="text-xs text-gray-500">{s.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: s.currency,
                          maximumFractionDigits: 0,
                        }).format(Number(s.baseSalary))}
                      </p>
                      {s.totalMonthlyTakeHome && (
                        <p className="text-xs text-gray-400">
                          Take-home:{" "}
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency: s.currency,
                            maximumFractionDigits: 0,
                          }).format(Number(s.totalMonthlyTakeHome))}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Reported: {s.reportedAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Facility Reviews (admin can see which facility, content stays anonymous externally) */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            Facility Reviews ({professional.facilityReviews.length})
          </h2>
          {professional.facilityReviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews submitted</p>
          ) : (
            <div className="space-y-2">
              {professional.facilityReviews.map((r) => (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {r.facility.name}
                    </p>
                    <span className="shrink-0 rounded-full bg-[#0B3C5D]/10 px-2 py-0.5 text-xs font-bold text-[#0B3C5D]">
                      {r.overallRating}/5
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-400">
                    {r.roleAtFacility && <span>{r.roleAtFacility}</span>}
                    {r.employmentType && <span>{r.employmentType.replace(/_/g, " ")}</span>}
                    <span>{r.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mandate Matches */}
        {professional.mandateMatches.length > 0 && (
          <div className="rounded-xl border bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 font-semibold text-gray-900">
              Mandate Matches ({professional.mandateMatches.length})
            </h2>
            <div className="space-y-2">
              {professional.mandateMatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Link
                      href={`/admin/cadrehealth/mandates/${m.mandate.id}`}
                      className="text-sm font-medium text-[#0B3C5D] hover:underline"
                    >
                      {m.mandate.title}
                    </Link>
                    <p className="text-xs text-gray-400">
                      Status: {m.status} | Mandate: {m.mandate.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  {m.matchScore != null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        m.matchScore >= 80
                          ? "bg-green-100 text-green-700"
                          : m.matchScore >= 60
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {m.matchScore}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Readiness Scores */}
        {(professional.readinessScoreDomestic != null ||
          professional.readinessScoreUK != null ||
          professional.readinessScoreUS != null) && (
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Career Readiness Scores</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {professional.readinessScoreDomestic != null && (
                <ScoreCard label="Nigeria" score={professional.readinessScoreDomestic} />
              )}
              {professional.readinessScoreUK != null && (
                <ScoreCard label="UK" score={professional.readinessScoreUK} />
              )}
              {professional.readinessScoreUS != null && (
                <ScoreCard label="US" score={professional.readinessScoreUS} />
              )}
              {professional.readinessScoreCanada != null && (
                <ScoreCard label="Canada" score={professional.readinessScoreCanada} />
              )}
              {professional.readinessScoreGulf != null && (
                <ScoreCard label="Gulf" score={professional.readinessScoreGulf} />
              )}
            </div>
            {professional.readinessComputedAt && (
              <p className="mt-2 text-xs text-gray-400">
                Computed: {professional.readinessComputedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-40 shrink-0 font-medium text-gray-500">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${
          score >= 70
            ? "text-emerald-600"
            : score >= 40
            ? "text-amber-600"
            : "text-red-500"
        }`}
      >
        {score}%
      </p>
    </div>
  );
}
