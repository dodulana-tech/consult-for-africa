import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCadreLabel, getRegulatoryBody } from "@/lib/cadreHealth/cadres";
import { VerifyButton } from "@/components/cadrehealth/VerifyButton";
import { InviteProfessionalButton, InviteMentorButton, PushSingleToOutreachButton } from "@/components/cadrehealth/AdminActions";
import { ArrowLeft, FileText, Download, Calendar } from "lucide-react";
import { RecruitmentActions } from "@/components/cadrehealth/RecruitmentActions";

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  UNVERIFIED: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  SUSPENDED: "bg-red-50 text-red-600",
};

const VERIFICATION_COLORS: Record<string, string> = {
  NOT_SUBMITTED: "bg-gray-100 text-gray-500",
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-600",
  EXPIRED: "bg-orange-50 text-orange-600",
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
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            CadreHealth Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            {professional.firstName} {professional.lastName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>{getCadreLabel(professional.cadre)}</span>
            {professional.subSpecialty && (
              <>
                <span className="text-gray-300">/</span>
                <span>{professional.subSpecialty}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
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

      {/* Admin Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <InviteProfessionalButton professionalId={professional.id} />
        <InviteMentorButton professionalId={professional.id} />
        <PushSingleToOutreachButton professionalId={professional.id} />
      </div>

      {/* Summary & CV */}
      {(professional.summary || professional.cvFileUrl) && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {professional.summary && (
                <div>
                  <h2 className="mb-2 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>Summary</h2>
                  <p className="text-sm leading-relaxed text-gray-600">{professional.summary}</p>
                </div>
              )}
            </div>
            {professional.cvFileUrl && (
              <a
                href={professional.cvFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
                style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
              >
                <Download className="h-4 w-4" />
                Download CV
              </a>
            )}
          </div>
        </div>
      )}

      {/* Recruitment Pipeline */}
      <RecruitmentActions
        professionalId={professional.id}
        currentStage={professional.recruitmentStage}
        interviewDate={professional.interviewDate?.toISOString() ?? null}
        notes={professional.recruitmentNotes}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <Card title="Personal Information">
          <dl className="space-y-2.5 text-sm">
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
            <Row
              label="Joined"
              value={professional.createdAt.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </dl>
        </Card>

        {/* Credentials */}
        <Card title={`Credentials (${professional.credentials.length})`}>
          {professional.credentials.length === 0 ? (
            <EmptyState text="No credentials submitted yet" />
          ) : (
            <div className="space-y-3">
              {professional.credentials.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.type.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{c.regulatoryBody}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        VERIFICATION_COLORS[c.verificationStatus] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.verificationStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-400">
                    {c.licenseNumber && <span>License: {c.licenseNumber}</span>}
                    {c.expiryDate && (
                      <span>Expires: {c.expiryDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Qualifications */}
        <Card title={`Qualifications (${professional.qualifications.length})`}>
          {professional.qualifications.length === 0 ? (
            <EmptyState text="No qualifications added yet" />
          ) : (
            <div className="space-y-3">
              {professional.qualifications.map((q) => (
                <div key={q.id} className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{q.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {q.type.replace(/_/g, " ")}
                        {q.institution && ` - ${q.institution}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        VERIFICATION_COLORS[q.verificationStatus] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {q.verificationStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-400">
                    {q.yearObtained && <span>Year: {q.yearObtained}</span>}
                    {q.score && <span>Score: {q.score}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* CPD */}
        <Card title={`CPD Entries (${professional.cpdEntries.length})`}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#0B3C5D]/8 px-3 py-1.5">
            <span className="text-xs font-medium text-gray-500">Total Points</span>
            <span className="text-sm font-bold" style={{ color: "#0B3C5D" }}>{totalCPDPoints}</span>
          </div>
          {professional.cpdEntries.length === 0 ? (
            <EmptyState text="No CPD entries logged yet" />
          ) : (
            <div className="space-y-2">
              {professional.cpdEntries.map((e) => (
                <div key={e.id} className="flex items-start justify-between rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.activity}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {e.category.replace(/_/g, " ")}
                      {e.provider && ` - ${e.provider}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {e.dateCompleted.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-lg bg-[#0B3C5D]/8 px-2 py-0.5 text-sm font-bold" style={{ color: "#0B3C5D" }}>
                      {Number(e.points)} pts
                    </span>
                    {e.verified && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">Verified</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Work History */}
        <Card title={`Work History (${professional.workHistory.length})`}>
          {professional.workHistory.length === 0 ? (
            <EmptyState text="No work history added yet" />
          ) : (
            <div className="space-y-3">
              {professional.workHistory.map((w) => (
                <div key={w.id} className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-900">{w.role}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {w.facilityName}
                    {w.department && ` - ${w.department}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-gray-400">
                    <span>
                      {w.startDate.toLocaleDateString("en-NG", { month: "short", year: "numeric" })} -{" "}
                      {w.isCurrent ? "Present" : w.endDate?.toLocaleDateString("en-NG", { month: "short", year: "numeric" }) || "N/A"}
                    </span>
                    {w.confirmedByFacility && (
                      <span className="font-medium text-emerald-600">Confirmed by facility</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Salary Reports */}
        <Card title={`Salary Reports (${professional.salaryReports.length})`}>
          {professional.salaryReports.length === 0 ? (
            <EmptyState text="No salary reports submitted" />
          ) : (
            <div className="space-y-2">
              {professional.salaryReports.map((s) => (
                <div key={s.id} className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.role}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{s.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "#0B3C5D" }}>
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: s.currency,
                          maximumFractionDigits: 0,
                        }).format(Number(s.baseSalary))}
                      </p>
                      {s.totalMonthlyTakeHome && (
                        <p className="mt-0.5 text-xs text-gray-400">
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
                  <p className="mt-2 text-xs text-gray-400">
                    Reported: {s.reportedAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Facility Reviews */}
        <Card title={`Facility Reviews (${professional.facilityReviews.length})`}>
          {professional.facilityReviews.length === 0 ? (
            <EmptyState text="No reviews submitted" />
          ) : (
            <div className="space-y-2">
              {professional.facilityReviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {r.facility.name}
                    </p>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "#0B3C5D12", color: "#0B3C5D" }}>
                      {r.overallRating}/5
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-gray-400">
                    {r.roleAtFacility && <span>{r.roleAtFacility}</span>}
                    {r.employmentType && <span>{r.employmentType.replace(/_/g, " ")}</span>}
                    <span>{r.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Mandate Matches */}
        {professional.mandateMatches.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
              Mandate Matches ({professional.mandateMatches.length})
            </h2>
            <div className="space-y-2">
              {professional.mandateMatches.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50">
                  <div>
                    <Link
                      href={`/admin/cadrehealth/mandates/${m.mandate.id}`}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: "#0B3C5D" }}
                    >
                      {m.mandate.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Status: {m.status} | Mandate: {m.mandate.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  {m.matchScore != null && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        m.matchScore >= 80
                          ? "bg-emerald-50 text-emerald-700"
                          : m.matchScore >= 60
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-600"
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
          <Card title="Career Readiness Scores">
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
              <p className="mt-3 text-xs text-gray-400">
                Computed: {professional.readinessComputedAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-40 shrink-0 text-sm font-medium text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-gray-50 py-6 text-center">
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 text-center transition hover:shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p
        className={`mt-1.5 text-2xl font-bold ${
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
