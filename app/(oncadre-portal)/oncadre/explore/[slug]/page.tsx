import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { getCadreShortLabel } from "@/lib/cadreHealth/cadres";
import { REVIEW_DIMENSIONS, CATEGORY_DIMENSIONS } from "@/lib/cadreHealth/reviewDimensions";
import HospitalReviewFormWrapper from "./ReviewFormWrapper";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const FACILITY_TYPE_LABELS: Record<string, string> = {
  PUBLIC_TERTIARY: "Public Tertiary",
  PUBLIC_SECONDARY: "Public Secondary",
  PUBLIC_PRIMARY: "Public Primary",
  PRIVATE_TERTIARY: "Private Tertiary",
  PRIVATE_SECONDARY: "Private Secondary",
  PRIVATE_CLINIC: "Private Clinic",
  FAITH_BASED: "Faith-Based",
  NGO: "NGO",
  MILITARY: "Military",
  INTERNATIONAL: "International",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-Time",
  LOCUM: "Locum",
  NYSC: "NYSC",
  HOUSE_OFFICER: "House Officer",
  RESIDENCY: "Residency",
};

// Build the 12-dimension definition list from our config
const DIMENSION_DEFINITIONS = REVIEW_DIMENSIONS.map((d) => ({
  key: d.ratingField,
  label: d.label,
  shortLabel: d.label.split(" & ")[0].split(",")[0], // shorter label for bars
}));

function facilityTypeLabel(type: string): string {
  return FACILITY_TYPE_LABELS[type] ?? type;
}

function ratingBarColor(rating: number): string {
  if (rating >= 4) return "bg-emerald-500";
  if (rating >= 3) return "bg-amber-500";
  return "bg-red-500";
}

function ratingTextColor(rating: number): string {
  if (rating >= 4) return "text-emerald-600";
  if (rating >= 3) return "text-amber-600";
  return "text-red-600";
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `\u20A6${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `\u20A6${Math.round(amount / 1_000)}k`;
  return `\u20A6${Math.round(amount).toLocaleString()}`;
}

function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const cls = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${cls} ${
            star <= Math.round(rating) ? "text-[#D4AF37]" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function InsightPill({
  value,
  label,
  good,
}: {
  value: number;
  label: string;
  good: boolean;
}) {
  const color = good
    ? value >= 70
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : value >= 40
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200"
    : // For negative metrics (bullying), invert
      value <= 20
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : value <= 50
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`rounded-lg border px-4 py-3 ${color}`}>
      <span className="text-2xl font-bold">{Math.round(value)}%</span>
      <p className="mt-0.5 text-sm leading-snug">{label}</p>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function HospitalDeepDivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const { slug } = await params;
  const sp = await searchParams;
  const reviewSort = typeof sp.reviewSort === "string" ? sp.reviewSort : "recent";

  // Load facility with reviews, salary reports, and related data
  const facility = await prisma.cadreFacility.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { isApproved: true },
        orderBy:
          reviewSort === "highest"
            ? { overallRating: "desc" }
            : reviewSort === "lowest"
              ? { overallRating: "asc" }
              : reviewSort === "helpful"
                ? { helpfulCount: "desc" }
                : { createdAt: "desc" },
      },
      salaryReports: true,
    },
  });

  if (!facility) notFound();

  // Count current staff at this facility
  const currentStaffCount = await prisma.cadreProfessional.count({
    where: { currentFacilityId: facility.id },
  });

  // Check if user has already reviewed
  const existingReview = await prisma.cadreFacilityReview.findUnique({
    where: {
      professionalId_facilityId: {
        professionalId: session.sub,
        facilityId: facility.id,
      },
    },
  });

  // Related hospitals (same state or same type, excluding current)
  const relatedHospitals = await prisma.cadreFacility.findMany({
    where: {
      id: { not: facility.id },
      OR: [{ state: facility.state }, { type: facility.type }],
    },
    select: {
      slug: true,
      name: true,
      type: true,
      state: true,
      city: true,
      overallRating: true,
      totalReviews: true,
    },
    orderBy: { totalReviews: "desc" },
    take: 3,
  });

  // Compute salary aggregates by role
  const salaryByRole = new Map<
    string,
    { role: string; salaries: number[]; paidOnTime: number; totalPaidOnTime: number; delays: number[] }
  >();

  for (const report of facility.salaryReports) {
    const takeHome = report.totalMonthlyTakeHome
      ? Number(report.totalMonthlyTakeHome)
      : Number(report.baseSalary) + Number(report.allowances ?? 0);

    if (!salaryByRole.has(report.role)) {
      salaryByRole.set(report.role, {
        role: report.role,
        salaries: [],
        paidOnTime: 0,
        totalPaidOnTime: 0,
        delays: [],
      });
    }

    const entry = salaryByRole.get(report.role)!;
    entry.salaries.push(takeHome);
    if (report.paidOnTime !== null) {
      entry.totalPaidOnTime++;
      if (report.paidOnTime) entry.paidOnTime++;
    }
    if (report.averagePayDelayDays !== null) {
      entry.delays.push(report.averagePayDelayDays);
    }
  }

  const salaryData = Array.from(salaryByRole.values()).map((entry) => {
    const sorted = entry.salaries.sort((a, b) => a - b);
    return {
      role: entry.role,
      count: sorted.length,
      min: sorted[0],
      median: sorted[Math.floor(sorted.length / 2)],
      max: sorted[sorted.length - 1],
      paidOnTimePct:
        entry.totalPaidOnTime > 0
          ? Math.round((entry.paidOnTime / entry.totalPaidOnTime) * 100)
          : null,
      avgDelay:
        entry.delays.length > 0
          ? Math.round(entry.delays.reduce((a, b) => a + b, 0) / entry.delays.length)
          : null,
    };
  });

  // Star distribution
  const starDist = [0, 0, 0, 0, 0]; // index 0 = 1-star, index 4 = 5-star
  for (const r of facility.reviews) {
    if (r.overallRating >= 1 && r.overallRating <= 5) {
      starDist[r.overallRating - 1]++;
    }
  }
  const maxStarCount = Math.max(...starDist, 1);

  const overallRating = facility.overallRating ? Number(facility.overallRating) : null;
  const recommendPct = facility.wouldRecommendPct ? Number(facility.wouldRecommendPct) : null;

  // Binary aggregates
  const paidOnTimePct = facility.paidOnTimePct ? Number(facility.paidOnTimePct) : null;
  const witnessedBullyingPct = facility.witnessedBullyingPct ? Number(facility.witnessedBullyingPct) : null;
  const wouldBringFamilyPct = facility.wouldBringFamilyPct ? Number(facility.wouldBringFamilyPct) : null;
  const situationImprovingPct = facility.situationImprovingPct ? Number(facility.situationImprovingPct) : null;

  // Call duration distribution from reviews
  const callDurations = facility.reviews
    .map((r) => r.callDuration)
    .filter((v): v is string => v !== null);
  const callDurationDist = callDurations.length > 0
    ? {
        "<12hrs": callDurations.filter((v) => v === "<12hrs").length,
        "12-24hrs": callDurations.filter((v) => v === "12-24hrs").length,
        "24-36hrs": callDurations.filter((v) => v === "24-36hrs").length,
        "36hrs+": callDurations.filter((v) => v === "36hrs+").length,
        total: callDurations.length,
      }
    : null;

  const hasKeyInsights =
    paidOnTimePct !== null ||
    witnessedBullyingPct !== null ||
    wouldBringFamilyPct !== null ||
    situationImprovingPct !== null;

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/oncadre/explore" className="transition hover:text-[#0B3C5D]">
          Explore Hospitals
        </Link>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{facility.name}</span>
      </nav>

      {/* ================================================================== */}
      {/* A. HEADER                                                          */}
      {/* ================================================================== */}
      <section className="rounded-2xl border border-[#E8EBF0] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Hospital info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#0B3C5D]/10 px-3 py-1 text-xs font-semibold text-[#0B3C5D]">
                {facilityTypeLabel(facility.type)}
              </span>
              {facility.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {facility.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {facility.city}, {facility.state}
              </span>
              {facility.bedCount && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {facility.bedCount} beds
                </span>
              )}
              {currentStaffCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {currentStaffCount} on CadreHealth
                </span>
              )}
              {facility.website && (
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#0B3C5D] transition hover:underline"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Right: Rating summary + CTAs */}
          <div className="flex flex-col items-start gap-4 lg:items-end">
            {overallRating !== null ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`text-4xl font-bold ${ratingTextColor(overallRating)}`}>
                    {overallRating.toFixed(1)}
                  </span>
                  <div className="mt-1">
                    <Stars rating={overallRating} size="md" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {facility.totalReviews} review{facility.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
                {recommendPct !== null && facility.totalReviews >= 2 && (
                  <div className="border-l border-[#E8EBF0] pl-4">
                    <span className="text-2xl font-bold text-emerald-600">
                      {Math.round(recommendPct)}%
                    </span>
                    <p className="text-xs text-gray-500">would recommend</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No ratings yet</p>
            )}

            <div className="flex flex-wrap gap-3">
              {!existingReview && (
                <a
                  href="#write-review"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B3C5D] shadow-sm transition hover:bg-[#C4A030]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Write a Review
                </a>
              )}
              <Link
                href="/oncadre/salary-map"
                className="inline-flex items-center gap-2 rounded-lg border border-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#0B3C5D]/5"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Report Salary
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* B. RATING BREAKDOWN (12 dimensions)                                */}
      {/* ================================================================== */}
      {overallRating !== null && (
        <section className="rounded-2xl border border-[#E8EBF0] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-gray-900">Rating Breakdown</h2>
          <p className="mt-1 text-sm text-gray-500">
            Based on {facility.totalReviews} review{facility.totalReviews !== 1 ? "s" : ""} from verified professionals
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            {/* All 12 dimension bars */}
            <div className="space-y-3">
              {DIMENSION_DEFINITIONS.map((dim) => {
                const val = facility[dim.key as keyof typeof facility];
                const rating = val ? Number(val) : null;
                if (rating === null) return null;

                return (
                  <div key={dim.key} className="group">
                    <div className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-sm text-gray-700 sm:w-44 leading-tight">
                        {dim.shortLabel}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${ratingBarColor(rating)}`}
                          style={{ width: `${(rating / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`w-8 text-right text-sm font-semibold ${ratingTextColor(rating)}`}>
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Star distribution */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Star Distribution</h3>
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = starDist[star - 1];
                  const pct = (count / maxStarCount) * 100;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-sm text-gray-600">{star} star</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#D4AF37] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Call duration distribution */}
              {callDurationDist && callDurationDist.total >= 3 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">Call Duty Duration</h3>
                  <div className="space-y-2">
                    {(
                      [
                        { key: "<12hrs", label: "Under 12 hours" },
                        { key: "12-24hrs", label: "12 to 24 hours" },
                        { key: "24-36hrs", label: "24 to 36 hours" },
                        { key: "36hrs+", label: "Over 36 hours" },
                      ] as const
                    ).map(({ key, label }) => {
                      const count = callDurationDist[key];
                      const pct = (count / callDurationDist.total) * 100;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 text-xs text-gray-600">{label}</span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#0B3C5D]/60 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs text-gray-500">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key Insights */}
          {hasKeyInsights && (
            <div className="mt-8 border-t border-[#E8EBF0] pt-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Key Insights</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {paidOnTimePct !== null && (
                  <InsightPill
                    value={paidOnTimePct}
                    label="say they are paid on time"
                    good={true}
                  />
                )}
                {witnessedBullyingPct !== null && (
                  <InsightPill
                    value={witnessedBullyingPct}
                    label="have witnessed inter-cadre bullying"
                    good={false}
                  />
                )}
                {wouldBringFamilyPct !== null && (
                  <InsightPill
                    value={wouldBringFamilyPct}
                    label="would bring their family here for treatment"
                    good={true}
                  />
                )}
                {situationImprovingPct !== null && (
                  <InsightPill
                    value={situationImprovingPct}
                    label="say the situation is improving"
                    good={true}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ================================================================== */}
      {/* C. SALARY INTELLIGENCE                                             */}
      {/* ================================================================== */}
      <section className="rounded-2xl border border-[#E8EBF0] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-gray-900">Salary Intelligence</h2>
        <p className="mt-1 text-sm text-gray-500">
          Compensation data reported by professionals at this facility
        </p>

        {salaryData.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8EBF0]">
                  <th className="whitespace-nowrap pb-3 pr-4 font-semibold text-gray-700">Role</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-semibold text-gray-700">Reports</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-semibold text-gray-700">Min</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-semibold text-gray-700">Median</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-semibold text-gray-700">Max</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-semibold text-gray-700">Paid on Time</th>
                  <th className="whitespace-nowrap pb-3 font-semibold text-gray-700">Avg Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF0]">
                {salaryData.map((row) => (
                  <tr key={row.role}>
                    <td className="whitespace-nowrap py-3 pr-4 font-medium text-gray-900">{row.role}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-gray-600">{row.count}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-gray-600">{formatCurrency(row.min)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 font-semibold text-gray-900">{formatCurrency(row.median)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-gray-600">{formatCurrency(row.max)}</td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {row.paidOnTimePct !== null ? (
                        <span className={row.paidOnTimePct >= 80 ? "text-emerald-600 font-medium" : row.paidOnTimePct >= 50 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                          {row.paidOnTimePct}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3">
                      {row.avgDelay !== null ? (
                        <span className={row.avgDelay <= 7 ? "text-gray-600" : "text-red-600 font-medium"}>
                          {row.avgDelay} days
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border-2 border-dashed border-[#E8EBF0] px-6 py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              Be the first to share salary data for {facility.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Anonymous salary reports help your colleagues negotiate better
            </p>
            <Link
              href="/oncadre/salary-map"
              className="mt-4 inline-flex items-center rounded-lg bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
            >
              Report Your Salary
            </Link>
          </div>
        )}
      </section>

      {/* ================================================================== */}
      {/* D. REVIEWS (full text)                                             */}
      {/* ================================================================== */}
      <section className="rounded-2xl border border-[#E8EBF0] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
            <p className="mt-1 text-sm text-gray-500">
              {facility.reviews.length} review{facility.reviews.length !== 1 ? "s" : ""} from verified professionals
            </p>
          </div>

          {/* Sort selector */}
          {facility.reviews.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <div className="flex rounded-lg border border-[#E8EBF0] bg-[#F8F9FB]">
                {[
                  { value: "recent", label: "Recent" },
                  { value: "highest", label: "Highest" },
                  { value: "lowest", label: "Lowest" },
                  { value: "helpful", label: "Helpful" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={`/oncadre/explore/${slug}?reviewSort=${opt.value}`}
                    className={`px-3 py-1.5 text-xs font-medium transition ${
                      reviewSort === opt.value
                        ? "bg-[#0B3C5D] text-white rounded-lg"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {facility.reviews.length === 0 ? (
          <div className="mt-8 rounded-xl border-2 border-dashed border-[#E8EBF0] px-6 py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              Be the first to review {facility.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your review helps thousands of colleagues make better career decisions
            </p>
            {!existingReview && (
              <a
                href="#write-review"
                className="mt-4 inline-flex items-center rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
              >
                Write a Review
              </a>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {facility.reviews.map((review) => {
              const tenure = review.isCurrentEmployee
                ? `Current employee${review.workedFromYear ? ` since ${review.workedFromYear}` : ""}`
                : review.workedFromYear && review.workedToYear
                  ? `${review.workedFromYear} - ${review.workedToYear}`
                  : review.workedFromYear
                    ? `Since ${review.workedFromYear}`
                    : null;

              return (
                <article
                  key={review.id}
                  className="rounded-xl border border-[#E8EBF0] bg-[#F8F9FB] p-5 sm:p-6"
                >
                  {/* Review header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Stars rating={review.overallRating} size="md" />
                        <span className="text-sm font-semibold text-gray-900">
                          {review.overallRating}/5
                        </span>
                        {review.isDetailedReview && (
                          <span className="inline-flex items-center rounded-full bg-[#0B3C5D]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0B3C5D] uppercase tracking-wider">
                            Detailed
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {review.cadreAtFacility && (
                          <span className="inline-flex items-center rounded-full bg-[#0B3C5D]/10 px-2.5 py-0.5 text-xs font-medium text-[#0B3C5D]">
                            {getCadreShortLabel(review.cadreAtFacility)}
                          </span>
                        )}
                        {review.employmentType && (
                          <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {EMPLOYMENT_TYPE_LABELS[review.employmentType] ?? review.employmentType}
                          </span>
                        )}
                        {review.isCurrentEmployee && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Current
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {tenure && <span>{tenure}</span>}
                      <span>
                        {new Date(review.createdAt).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Situation trend + key indicators */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {review.wouldRecommend !== null && (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          review.wouldRecommend ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {review.wouldRecommend ? (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                        )}
                        {review.wouldRecommend ? "Would recommend" : "Would not recommend"}
                      </span>
                    )}
                    {review.situationTrend && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          review.situationTrend === "IMPROVING"
                            ? "bg-emerald-50 text-emerald-700"
                            : review.situationTrend === "DECLINING"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {review.situationTrend === "IMPROVING"
                          ? "Situation improving"
                          : review.situationTrend === "DECLINING"
                            ? "Situation declining"
                            : "Situation unchanged"}
                      </span>
                    )}
                  </div>

                  {/* Review content */}
                  <div className="mt-4 space-y-4">
                    {/* Best / worst thing (from detailed review) */}
                    {review.bestThing && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-emerald-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                            Best Thing
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 pl-3">
                          {review.bestThing}
                        </p>
                      </div>
                    )}

                    {review.worstThing && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-red-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                            Worst Thing
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 pl-3">
                          {review.worstThing}
                        </p>
                      </div>
                    )}

                    {review.pros && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-emerald-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                            Pros
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 pl-3">
                          {review.pros}
                        </p>
                      </div>
                    )}

                    {review.cons && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-red-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                            Cons
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 pl-3">
                          {review.cons}
                        </p>
                      </div>
                    )}

                    {review.advice && (
                      <div>
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="h-4 w-1 rounded-full bg-amber-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                            Advice
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 pl-3">
                          {review.advice}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Helpful */}
                  <div className="mt-4 flex items-center gap-3 border-t border-[#E8EBF0] pt-3">
                    <form action={`/api/cadre/hospitals/${slug}/reviews/${review.id}/helpful`} method="POST">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EBF0] bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        Helpful
                        {review.helpfulCount > 0 && (
                          <span className="text-gray-400">({review.helpfulCount})</span>
                        )}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ================================================================== */}
      {/* E. WRITE REVIEW SECTION                                            */}
      {/* ================================================================== */}
      <section id="write-review" className="scroll-mt-8">
        {existingReview ? (
          <div className="rounded-2xl border border-[#E8EBF0] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  You reviewed {facility.name}
                </h2>
                <p className="text-sm text-gray-500">
                  You rated this facility {existingReview.overallRating}/5. Editing reviews is coming soon.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E8EBF0] bg-white p-6 shadow-sm sm:p-8">
            <HospitalReviewFormWrapper
              facilitySlug={slug}
              facilityName={facility.name}
            />
          </div>
        )}
      </section>

      {/* ================================================================== */}
      {/* F. RELATED HOSPITALS                                               */}
      {/* ================================================================== */}
      {relatedHospitals.length > 0 && (
        <section className="rounded-2xl border border-[#E8EBF0] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Related Hospitals</h2>
              <p className="mt-1 text-sm text-gray-500">
                Other facilities in {facility.state} or of similar type
              </p>
            </div>
            <span className="text-xs text-gray-400">Compare hospitals coming soon</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedHospitals.map((related) => {
              const relRating = related.overallRating ? Number(related.overallRating) : null;

              return (
                <Link
                  key={related.slug}
                  href={`/oncadre/explore/${related.slug}`}
                  className="group rounded-xl border border-[#E8EBF0] bg-[#F8F9FB] p-4 transition hover:border-[#0B3C5D]/20 hover:shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition-colors line-clamp-2">
                    {related.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {facilityTypeLabel(related.type)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {related.city}, {related.state}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {relRating !== null ? (
                      <>
                        <span className={`text-lg font-bold ${ratingTextColor(relRating)}`}>
                          {relRating.toFixed(1)}
                        </span>
                        <Stars rating={relRating} />
                        <span className="text-xs text-gray-500">
                          ({related.totalReviews})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No reviews yet</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
