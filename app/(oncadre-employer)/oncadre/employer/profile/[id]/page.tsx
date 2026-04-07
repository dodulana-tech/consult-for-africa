import { redirect, notFound } from "next/navigation";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import Link from "next/link";

export default async function EmployerProfileViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCadreEmployerSession();
  if (!session) redirect("/oncadre/employer/login");

  const { id } = await params;

  const professional = await prisma.cadreProfessional.findUnique({
    where: { id },
    include: {
      credentials: {
        select: {
          id: true,
          type: true,
          regulatoryBody: true,
          verificationStatus: true,
          verifiedAt: true,
        },
      },
      qualifications: {
        select: {
          id: true,
          type: true,
          name: true,
          institution: true,
          yearObtained: true,
        },
        orderBy: { yearObtained: "desc" },
      },
      workHistory: {
        select: {
          id: true,
          facilityName: true,
          role: true,
          department: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
        },
        orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
        take: 10,
      },
    },
  });

  if (!professional) notFound();

  // Increment profile views in the background
  prisma.cadreProfessional
    .update({
      where: { id },
      data: {
        profileViews: { increment: 1 },
        lastViewedAt: new Date(),
      },
    })
    .catch(() => {});

  // Check if this professional applied to any of this employer's mandates
  const appliedToEmployer = await prisma.cadreMandateMatch.findFirst({
    where: {
      professionalId: id,
      mandate: {
        facilityId: session.facilityId || undefined,
        facilityName: session.facilityId ? undefined : session.companyName,
      },
    },
    select: { id: true },
  });

  const p = professional;
  const location = [p.city, p.state].filter(Boolean).join(", ") || p.country;

  const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
    PRACTICING_LICENSE: "Practising Licence",
    FULL_REGISTRATION: "Full Registration",
    COGS: "Certificate of Good Standing",
    SPECIALIST_REGISTRATION: "Specialist Registration",
    ADDITIONAL_LICENSE: "Additional Licence",
  };

  const QUAL_TYPE_LABELS: Record<string, string> = {
    PRIMARY_DEGREE: "Primary Degree",
    POSTGRADUATE: "Postgraduate",
    FELLOWSHIP: "Fellowship",
    CERTIFICATION: "Certification",
    INTERNATIONAL_EXAM: "International Exam",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/oncadre/employer/applications"
        className="text-sm text-gray-400 hover:text-[#0B3C5D] transition-colors"
      >
        &larr; Back to applications
      </Link>

      {/* Profile header */}
      <div
        className="rounded-2xl bg-white p-6 sm:p-8"
        style={{
          border: "1px solid #E8EBF0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shrink-0"
            style={{ background: "#0B3C5D" }}
          >
            {p.firstName[0]}
            {p.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                {p.firstName} {p.lastName}
              </h1>
              {p.accountStatus === "VERIFIED" && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
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
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {getCadreLabel(p.cadre)}
              {p.subSpecialty ? ` - ${p.subSpecialty}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
              {p.yearsOfExperience != null && (
                <span>{p.yearsOfExperience} years experience</span>
              )}
              <span>{location}</span>
              {p.isDiaspora && p.diasporaCountry && (
                <span>Diaspora ({p.diasporaCountry})</span>
              )}
            </div>
            {p.currentRole && (
              <p className="mt-2 text-sm text-gray-600">
                Currently: {p.currentRole}
                {p.currentFacility ? ` at ${p.currentFacility}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Contact - only show if they applied to this employer */}
        {appliedToEmployer && (
          <div
            className="mt-5 rounded-xl p-4"
            style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}
          >
            <p className="text-xs font-semibold text-emerald-700 mb-1">
              This professional applied to one of your roles
            </p>
            <p className="text-sm text-gray-700">{p.email}</p>
          </div>
        )}

        {/* Profile completeness */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-400">Profile completeness</span>
            <span className="font-semibold text-gray-600">{p.profileCompleteness}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${p.profileCompleteness}%`,
                background: p.profileCompleteness >= 80 ? "#059669" : p.profileCompleteness >= 50 ? "#D4AF37" : "#9CA3AF",
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Readiness scores */}
        {p.readinessScoreDomestic != null && (
          <div
            className="rounded-2xl bg-white p-6"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Readiness Scores</h2>
            <div className="space-y-3">
              {[
                { label: "Domestic", score: p.readinessScoreDomestic },
                { label: "United Kingdom", score: p.readinessScoreUK },
                { label: "United States", score: p.readinessScoreUS },
                { label: "Canada", score: p.readinessScoreCanada },
                { label: "Gulf States", score: p.readinessScoreGulf },
              ]
                .filter((s) => s.score != null)
                .map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">{s.label}</span>
                      <span className="font-semibold text-gray-700">{s.score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.score}%`,
                          background: (s.score ?? 0) >= 70 ? "#059669" : (s.score ?? 0) >= 40 ? "#D4AF37" : "#DC2626",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Credentials */}
        {p.credentials.length > 0 && (
          <div
            className="rounded-2xl bg-white p-6"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Credentials</h2>
            <div className="space-y-3">
              {p.credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between rounded-lg bg-[#F8F9FB] px-4 py-3"
                  style={{ border: "1px solid #E8EBF0" }}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {CREDENTIAL_TYPE_LABELS[cred.type] || cred.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400">{cred.regulatoryBody}</p>
                  </div>
                  {cred.verificationStatus === "VERIFIED" && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}
                    >
                      Verified
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Qualifications */}
      {p.qualifications.length > 0 && (
        <div
          className="rounded-2xl bg-white p-6"
          style={{
            border: "1px solid #E8EBF0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Qualifications</h2>
          <div className="space-y-3">
            {p.qualifications.map((q) => (
              <div
                key={q.id}
                className="rounded-lg bg-[#F8F9FB] px-4 py-3"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{q.name}</p>
                    {q.institution && (
                      <p className="text-xs text-gray-500 mt-0.5">{q.institution}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "rgba(11,60,93,0.06)", color: "#0B3C5D" }}
                    >
                      {QUAL_TYPE_LABELS[q.type] || q.type.replace(/_/g, " ")}
                    </span>
                    {q.yearObtained && (
                      <p className="text-[10px] text-gray-400 mt-1">{q.yearObtained}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work History */}
      {p.workHistory.length > 0 && (
        <div
          className="rounded-2xl bg-white p-6"
          style={{
            border: "1px solid #E8EBF0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Work History</h2>
          <div className="space-y-4">
            {p.workHistory.map((w) => (
              <div key={w.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5"
                    style={{ background: w.isCurrent ? "#059669" : "#D4AF37" }}
                  />
                  <div className="w-[2px] flex-1 bg-gray-100 mt-1" />
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{w.role}</p>
                    {w.isCurrent && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {w.facilityName}
                    {w.department ? ` - ${w.department}` : ""}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {w.startDate
                      ? new Date(w.startDate).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
                      : ""}
                    {" - "}
                    {w.isCurrent
                      ? "Present"
                      : w.endDate
                        ? new Date(w.endDate).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
                        : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
