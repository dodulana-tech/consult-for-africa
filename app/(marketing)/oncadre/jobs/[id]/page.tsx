import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { getCadreSession } from "@/lib/cadreAuth";
import ApplyButtonClient from "./ApplyButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Decimal } from "@prisma/client/runtime/library";

function formatSalary(min?: Decimal | null, max?: Decimal | null, currency?: string | null): string | null {
  if (!min && !max) return null;
  const cur = currency || "NGN";
  const fmt = (n: Decimal) => {
    const val = Number(n);
    if (val >= 1_000_000) return `${cur} ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${cur} ${(val / 1_000).toFixed(0)}k`;
    return `${cur} ${val.toLocaleString()}`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

const MANDATE_TYPE_LABELS: Record<string, string> = {
  PERMANENT: "Permanent",
  LOCUM: "Locum",
  CONTRACT: "Contract",
  CONSULTING: "Consulting",
  INTERNATIONAL: "International",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await prisma.cadreMandate.findUnique({
    where: { id },
    select: { title: true, facilityName: true, facility: { select: { name: true } }, locationState: true },
  });
  if (!job) return { title: "Job Not Found | CadreHealth" };
  const facilityName = job.facility?.name || job.facilityName || "CadreHealth Partner";
  return {
    title: `${job.title} at ${facilityName} | CadreHealth`,
    description: `Apply for ${job.title} at ${facilityName}${job.locationState ? ` in ${job.locationState}` : ""}. Healthcare jobs on CadreHealth.`,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await prisma.cadreMandate.findUnique({
    where: { id, isPublished: true, status: "OPEN" },
    include: {
      facility: {
        select: { name: true, slug: true, state: true, city: true, type: true, overallRating: true, totalReviews: true },
      },
    },
  });

  if (!job) notFound();

  const session = await getCadreSession();
  const salary = formatSalary(job.salaryRangeMin, job.salaryRangeMax, job.salaryCurrency);
  const facilityName = job.facility?.name || job.facilityName || "Confidential";
  const location = [job.locationCity, job.locationState].filter(Boolean).join(", ") || "Nigeria";

  // Check if user already applied
  let hasApplied = false;
  if (session) {
    const existingMatch = await prisma.cadreMandateMatch.findUnique({
      where: { mandateId_professionalId: { mandateId: job.id, professionalId: session.sub } },
    });
    hasApplied = !!existingMatch;
  }

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.title,
    datePosted: job.createdAt.toISOString(),
    employmentType: job.type === "PERMANENT" ? "FULL_TIME" : job.type === "LOCUM" ? "TEMPORARY" : "CONTRACT",
    hiringOrganization: {
      "@type": "Organization",
      name: facilityName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.locationCity || undefined,
        addressRegion: job.locationState || undefined,
        addressCountry: "NG",
      },
    },
    ...(job.salaryRangeMin || job.salaryRangeMax
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salaryCurrency || "NGN",
            value: {
              "@type": "QuantitativeValue",
              ...(job.salaryRangeMin ? { minValue: Number(job.salaryRangeMin) } : {}),
              ...(job.salaryRangeMax ? { maxValue: Number(job.salaryRangeMax) } : {}),
              unitText: "MONTH",
            },
          },
        }
      : {}),
    url: `https://consultforafrica.com/oncadre/jobs/${job.id}`,
  };

  return (
    <main className="bg-[#F8F9FB] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back link */}
      <div className="bg-white" style={{ borderBottom: "1px solid #E8EBF0" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3">
          <Link
            href="/oncadre/jobs"
            className="text-sm text-gray-500 hover:text-[#0B3C5D] transition-colors"
          >
            &larr; Back to all jobs
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div
              className="rounded-2xl bg-white p-6 sm:p-8"
              style={{
                border: "1px solid #E8EBF0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(11,60,93,0.06)", color: "#0B3C5D" }}
                >
                  {getCadreLabel(job.cadre)}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ background: "rgba(107,114,128,0.06)", color: "#4B5563" }}
                >
                  {MANDATE_TYPE_LABELS[job.type] || job.type}
                </span>
                {job.urgency && (
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: job.urgency === "URGENT" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
                      color: job.urgency === "URGENT" ? "#DC2626" : "#D97706",
                    }}
                  >
                    {job.urgency}
                  </span>
                )}
              </div>

              <h1
                className="font-bold text-gray-900 leading-tight"
                style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)" }}
              >
                {job.title}
              </h1>
              <p className="mt-2 text-gray-500">{facilityName}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </span>
                {salary && (
                  <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                    {salary}
                  </span>
                )}
                {job.isRemoteOk && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}
                  >
                    Remote OK
                  </span>
                )}
              </div>

              {salary && (
                <p className="mt-1 text-xs text-gray-400">per month</p>
              )}
            </div>

            {/* Description */}
            {job.description && (
              <div
                className="rounded-2xl bg-white p-6 sm:p-8"
                style={{
                  border: "1px solid #E8EBF0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  About This Role
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {job.description.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {(job.requiredQualifications.length > 0 ||
              job.preferredQualifications.length > 0 ||
              job.minYearsExperience ||
              job.subSpecialty) && (
              <div
                className="rounded-2xl bg-white p-6 sm:p-8"
                style={{
                  border: "1px solid #E8EBF0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Requirements
                </h2>
                <div className="space-y-4">
                  {job.subSpecialty && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Sub-specialty</h3>
                      <p className="mt-1 text-sm text-gray-600">{job.subSpecialty}</p>
                    </div>
                  )}
                  {job.minYearsExperience && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Minimum Experience
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {job.minYearsExperience} years
                      </p>
                    </div>
                  )}
                  {job.requiredQualifications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Required Qualifications
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {job.requiredQualifications.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1 text-[#D4AF37] shrink-0">&#10003;</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.preferredQualifications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Preferred Qualifications
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {job.preferredQualifications.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-1 text-gray-300 shrink-0">&#9675;</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.isRelocationRequired && (
                    <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      Relocation may be required for this role.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply card */}
            <div
              className="rounded-2xl bg-white p-6 sticky top-20"
              style={{
                border: "1px solid #E8EBF0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              {hasApplied ? (
                <div className="text-center">
                  <div
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "rgba(16,185,129,0.1)" }}
                  >
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="mt-3 font-semibold text-gray-900">Application Submitted</p>
                  <p className="mt-1 text-sm text-gray-500">
                    You have already applied for this role.
                  </p>
                </div>
              ) : session ? (
                <ApplyButtonClient jobId={job.id} />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Sign in to apply for this position
                  </p>
                  <Link
                    href={`/oncadre/login?return=/oncadre/jobs/${job.id}`}
                    className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
                      boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
                    }}
                  >
                    Sign in to Apply
                  </Link>
                  <p className="mt-3 text-xs text-gray-400">
                    Don&apos;t have an account?{" "}
                    <Link href="/oncadre/register" className="text-[#0B3C5D] font-medium hover:underline">
                      Register free
                    </Link>
                  </p>
                </div>
              )}

              {job.applicationCount > 0 && (
                <p className="mt-4 text-center text-xs text-gray-400">
                  {job.applicationCount} application{job.applicationCount !== 1 ? "s" : ""} so far
                </p>
              )}
            </div>

            {/* Facility info */}
            {job.facility && (
              <div
                className="rounded-2xl bg-white p-6"
                style={{
                  border: "1px solid #E8EBF0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  About the Facility
                </h3>
                <p className="text-sm font-medium text-gray-800">
                  {job.facility.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {job.facility.type?.replace(/_/g, " ")} &middot;{" "}
                  {[job.facility.city, job.facility.state].filter(Boolean).join(", ")}
                </p>
                {job.facility.overallRating && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-xs text-amber-400">&#9733;</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Number(job.facility.overallRating).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({job.facility.totalReviews} reviews)
                    </span>
                  </div>
                )}
                <Link
                  href={`/oncadre/hospitals/${job.facility.slug}`}
                  className="mt-3 block text-xs font-medium text-[#0B3C5D] hover:underline"
                >
                  View hospital reviews &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

