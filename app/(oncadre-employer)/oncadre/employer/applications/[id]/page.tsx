import { redirect, notFound } from "next/navigation";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import Link from "next/link";
import ApplicantActions from "./ApplicantActions";

export default async function MandateApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCadreEmployerSession();
  if (!session) redirect("/oncadre/employer/login");

  const { id } = await params;

  const mandate = await prisma.cadreMandate.findFirst({
    where: {
      id,
      facilityId: session.facilityId || undefined,
      facilityName: session.facilityId ? undefined : session.companyName,
    },
    select: { id: true, title: true, cadre: true, type: true, status: true },
  });

  if (!mandate) notFound();

  const matches = await prisma.cadreMandateMatch.findMany({
    where: { mandateId: id },
    include: {
      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          cadre: true,
          subSpecialty: true,
          yearsOfExperience: true,
          state: true,
          city: true,
          accountStatus: true,
          readinessScoreDomestic: true,
          readinessScoreUK: true,
          readinessScoreUS: true,
          readinessScoreCanada: true,
          readinessScoreGulf: true,
          profileCompleteness: true,
          _count: { select: { credentials: true, qualifications: true } },
        },
      },
    },
    orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/oncadre/employer/applications"
          className="text-sm text-gray-400 hover:text-[#0B3C5D] transition-colors"
        >
          &larr; Back to applications
        </Link>
        <h1
          className="mt-3 font-bold text-gray-900"
          style={{ fontSize: "clamp(1.3rem, 3vw, 1.6rem)" }}
        >
          {mandate.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "rgba(11,60,93,0.06)", color: "#0B3C5D" }}
          >
            {getCadreLabel(mandate.cadre)}
          </span>
          <span className="text-xs text-gray-400">
            {matches.length} applicant{matches.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Applicant list */}
      {matches.length === 0 ? (
        <div
          className="rounded-2xl bg-white p-8 text-center"
          style={{
            border: "1px solid #E8EBF0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-sm text-gray-500">No applicants yet for this role.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const p = match.professional;
            const location = [p.city, p.state].filter(Boolean).join(", ") || "Nigeria";

            return (
              <div
                key={match.id}
                className="rounded-2xl bg-white p-5 sm:p-6"
                style={{
                  border: "1px solid #E8EBF0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Profile info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
                        style={{ background: "#0B3C5D" }}
                      >
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {p.firstName} {p.lastName}
                          </h3>
                          {p.accountStatus === "VERIFIED" && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                                color: "#065f46",
                                border: "1px solid rgba(16,185,129,0.2)",
                              }}
                            >
                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {getCadreLabel(p.cadre)}
                          {p.subSpecialty ? ` - ${p.subSpecialty}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                      {p.yearsOfExperience != null && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {p.yearsOfExperience} years
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {location}
                      </span>
                      {p._count.credentials > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          {p._count.credentials} credential{p._count.credentials !== 1 ? "s" : ""}
                        </span>
                      )}
                      {p._count.qualifications > 0 && (
                        <span>
                          {p._count.qualifications} qualification{p._count.qualifications !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Readiness scores */}
                    {p.readinessScoreDomestic != null && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { label: "Domestic", score: p.readinessScoreDomestic },
                          { label: "UK", score: p.readinessScoreUK },
                          { label: "US", score: p.readinessScoreUS },
                          { label: "Canada", score: p.readinessScoreCanada },
                          { label: "Gulf", score: p.readinessScoreGulf },
                        ]
                          .filter((s) => s.score != null)
                          .map((s) => (
                            <span
                              key={s.label}
                              className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                              style={{ background: "#F8F9FB", border: "1px solid #E8EBF0" }}
                            >
                              {s.label}: {s.score}%
                            </span>
                          ))}
                      </div>
                    )}

                    {match.matchScore != null && (
                      <div className="mt-2">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "rgba(212,175,55,0.1)",
                            color: "#B8941E",
                          }}
                        >
                          Match score: {match.matchScore}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Link
                      href={`/oncadre/employer/profile/${p.id}`}
                      className="rounded-lg px-4 py-2 text-xs font-semibold text-[#0B3C5D] transition hover:bg-[#0B3C5D]/5"
                      style={{ border: "1px solid #E8EBF0" }}
                    >
                      View Profile
                    </Link>
                    <ApplicantActions
                      mandateId={mandate.id}
                      matchId={match.id}
                      currentStatus={match.status}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
