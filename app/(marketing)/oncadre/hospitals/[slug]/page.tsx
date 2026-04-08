import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";

export const dynamic = "force-dynamic";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Props {
  params: Promise<{ slug: string }>;
}

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

const DIMENSION_CONFIG = [
  { key: "compensationRating", label: "Compensation", color: "#10B981" },
  { key: "payTimelinessRating", label: "Pay Timeliness", color: "#3B82F6" },
  { key: "workloadRating", label: "Workload", color: "#8B5CF6" },
  { key: "equipmentRating", label: "Equipment", color: "#F59E0B" },
  { key: "managementRating", label: "Management", color: "#EF4444" },
  { key: "safetyRating", label: "Safety", color: "#06B6D4" },
  { key: "trainingRating", label: "Training", color: "#D946EF" },
  { key: "accommodationRating", label: "Accommodation", color: "#F97316" },
] as const;

/* ─── SEO Metadata ─────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const facility = await prisma.cadreFacility.findUnique({
    where: { slug },
    select: { name: true, type: true, state: true, city: true, overallRating: true, totalReviews: true },
  });

  if (!facility) return { title: "Hospital Not Found | CadreHealth" };

  const typeLabel = FACILITY_TYPE_LABELS[facility.type] || facility.type;
  const location = [facility.city, facility.state].filter(Boolean).join(", ");
  const rating = facility.overallRating ? Number(facility.overallRating).toFixed(1) : null;

  const title = rating
    ? `${facility.name} Reviews - ${rating}/5 from ${facility.totalReviews} Staff | CadreHealth`
    : `${facility.name} Reviews - Staff Reviews & Salary Data | CadreHealth`;

  const description = rating
    ? `${facility.name} (${typeLabel}, ${location}) rated ${rating}/5 by ${facility.totalReviews} verified healthcare workers. Anonymous reviews on salary, equipment, management, call duty, safety. Real data from real staff.`
    : `Working at ${facility.name}? Read anonymous reviews from verified healthcare staff. Salary data, equipment quality, pay timeliness, management, call duty schedule, and more.`;

  const keywords = [
    `${facility.name} reviews`,
    `${facility.name} salary`,
    `${facility.name} working conditions`,
    `${facility.name} staff reviews`,
    `hospital reviews ${facility.state}`,
    `${typeLabel} reviews Nigeria`,
    `healthcare jobs ${location}`,
    "hospital salary Nigeria",
    "CadreHealth",
  ].join(", ");

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://consultforafrica.com/oncadre/hospitals/${slug}`,
      siteName: "CadreHealth by Consult For Africa",
      locale: "en_NG",
    },
    twitter: {
      card: "summary",
      title: `${facility.name} - Staff Reviews | CadreHealth`,
      description,
    },
    alternates: {
      canonical: `https://consultforafrica.com/oncadre/hospitals/${slug}`,
    },
  };
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function HospitalDetailPage({ params }: Props) {
  const { slug } = await params;

  const facility = await prisma.cadreFacility.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          overallRating: true,
          compensationRating: true,
          payTimelinessRating: true,
          workloadRating: true,
          equipmentRating: true,
          managementRating: true,
          safetyRating: true,
          trainingRating: true,
          accommodationRating: true,
          pros: true,
          cons: true,
          advice: true,
          wouldRecommend: true,
          cadreAtFacility: true,
          employmentType: true,
          workedFromYear: true,
          workedToYear: true,
          isCurrentEmployee: true,
          helpfulCount: true,
          createdAt: true,
        },
      },
      _count: {
        select: { reviews: true, salaryReports: true },
      },
    },
  });

  if (!facility) notFound();

  // Check if visitor has contributed (for give-to-get gating)
  const session = await getCadreSession();
  let hasContributed = false;
  if (session) {
    const reviewCount = await prisma.cadreFacilityReview.count({
      where: { professionalId: session.sub },
    });
    hasContributed = reviewCount > 0;
  }

  // Fetch open jobs for this facility
  const openJobs = await prisma.cadreMandate.findMany({
    where: { facilityId: facility.id, isPublished: true, status: "OPEN" },
    select: { id: true, slug: true, title: true, cadre: true, type: true, salaryRangeMin: true, salaryRangeMax: true, salaryCurrency: true, urgency: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const overallRating = facility.overallRating ? Number(facility.overallRating) : null;
  const recommendPct = facility.wouldRecommendPct ? Number(facility.wouldRecommendPct) : null;

  // Rating breakdown (count of each star level)
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: facility.reviews.filter((r) => r.overallRating === star).length,
    pct:
      facility.reviews.length > 0
        ? Math.round(
            (facility.reviews.filter((r) => r.overallRating === star).length /
              facility.reviews.length) *
              100
          )
        : 0,
  }));

  // Dimension ratings from facility aggregates
  const dimensions = DIMENSION_CONFIG.map((d) => ({
    ...d,
    value: facility[d.key as keyof typeof facility]
      ? Number(facility[d.key as keyof typeof facility])
      : null,
  })).filter((d) => d.value !== null);

  // Salary summary
  const hasSalaryData = facility._count.salaryReports > 0;

  // JSON-LD: LocalBusiness structured data
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: facility.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: facility.city,
      addressRegion: facility.state,
      addressCountry: "Nigeria",
    },
    url: `https://consultforafrica.com/oncadre/hospitals/${slug}`,
  };
  if (facility.website) {
    jsonLd.sameAs = facility.website;
  }
  if (facility.totalReviews > 0 && overallRating !== null) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: overallRating.toFixed(1),
      reviewCount: facility.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <main
      className="min-h-screen bg-white pb-20"
      style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 1rem)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/oncadre" className="hover:text-[#0B3C5D] transition">
            CadreHealth
          </Link>
          <span>/</span>
          <Link href="/oncadre/hospitals" className="hover:text-[#0B3C5D] transition">
            Hospitals
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{facility.name}</span>
        </nav>

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {facility.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#0B3C5D]/10 px-3 py-1 text-xs font-medium text-[#0B3C5D]">
                  {FACILITY_TYPE_LABELS[facility.type] ?? facility.type}
                </span>
                <span className="text-sm text-gray-500">
                  {facility.city}, {facility.state}
                </span>
              </div>
              {facility.bedCount && (
                <p className="mt-2 text-sm text-gray-500">
                  {facility.bedCount} beds
                </p>
              )}
              {facility.website && (
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-[#0B3C5D] hover:underline"
                >
                  Visit website
                </a>
              )}
            </div>

            {/* Overall rating card */}
            {overallRating !== null && (
              <div className="shrink-0 rounded-xl bg-[#0B3C5D] px-6 py-5 text-center text-white">
                <div className="text-4xl font-bold">{overallRating.toFixed(1)}</div>
                <div className="mt-1 flex justify-center">{renderStarsWhite(overallRating)}</div>
                <div className="mt-2 text-sm text-white/80">
                  {facility.totalReviews} {facility.totalReviews === 1 ? "review" : "reviews"}
                </div>
                {recommendPct !== null && (
                  <div className="mt-1 text-sm font-medium text-[#D4AF37]">
                    {Math.round(recommendPct)}% recommend
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── About Section ─────────────────────────────────────────── */}
        {facility.description && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900">About {facility.name}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
              {facility.description.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {/* Quick facts */}
            <div className="mt-5 flex flex-wrap gap-3">
              {facility.yearEstablished && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600" style={{ border: "1px solid #E8EBF0" }}>
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Est. {facility.yearEstablished}
                </span>
              )}
              {facility.bedCount && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600" style={{ border: "1px solid #E8EBF0" }}>
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>
                  {facility.bedCount} beds
                </span>
              )}
              {facility.address && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600" style={{ border: "1px solid #E8EBF0" }}>
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {facility.address}
                </span>
              )}
              {facility.phone && (
                <a href={`tel:${facility.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-[#0B3C5D] hover:bg-gray-100 transition" style={{ border: "1px solid #E8EBF0" }}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {facility.phone}
                </a>
              )}
              {facility.email && (
                <a href={`mailto:${facility.email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-[#0B3C5D] hover:bg-gray-100 transition" style={{ border: "1px solid #E8EBF0" }}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {facility.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* ─── Open Jobs ──────────────────────────────────────────────── */}
        {openJobs.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Open Positions
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{openJobs.length}</span>
              </h2>
              <Link href="/oncadre/jobs" className="text-xs font-medium text-[#0B3C5D] hover:underline">
                View all jobs
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {openJobs.map((job) => {
                const salary = formatSalaryShort(job.salaryRangeMin, job.salaryRangeMax, job.salaryCurrency);
                return (
                  <Link
                    key={job.id}
                    href={`/oncadre/jobs/${job.slug || job.id}`}
                    className="group flex items-center justify-between rounded-xl p-4 transition-all hover:bg-gray-50"
                    style={{ border: "1px solid #E8EBF0" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition-colors">{job.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">{MANDATE_TYPE_LABELS[job.type] || job.type}</span>
                        {salary && <span className="text-xs font-medium text-gray-700">{salary}</span>}
                        {job.urgency === "HIGH" || job.urgency === "URGENT" ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: job.urgency === "URGENT" ? "#DC2626" : "#D97706" }}>
                            {job.urgency === "URGENT" ? "Urgent" : "Hiring"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#0B3C5D] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Dimension Ratings Bar Chart ─────────────────────────────── */}
        {dimensions.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Ratings by Category</h2>
            <div className="mt-4 space-y-3">
              {dimensions.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm text-gray-600 sm:w-40">
                    {d.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${((d.value ?? 0) / 5) * 100}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-semibold text-gray-800">
                    {d.value!.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Rating Breakdown ────────────────────────────────────────── */}
        {facility.totalReviews > 0 && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Rating Breakdown</h2>
            <div className="mt-4 space-y-2">
              {ratingBreakdown.map((b) => (
                <div key={b.star} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-gray-600">
                    {b.star} star{b.star !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-xs text-gray-500">
                    {b.count} ({b.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Salary Summary ──────────────────────────────────────────── */}
        {hasSalaryData && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Salary Data</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                {facility._count.salaryReports} {facility._count.salaryReports === 1 ? "report" : "reports"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Salary reports are available for this facility.{" "}
              {session ? (
                <Link href="/oncadre/salary-map" className="font-medium text-[#0B3C5D] hover:underline">
                  View on the Salary Map
                </Link>
              ) : (
                <Link href="/oncadre/register" className="font-medium text-[#0B3C5D] hover:underline">
                  Register to unlock salary data
                </Link>
              )}
            </p>
          </div>
        )}

        {/* ─── Reviews Section ─────────────────────────────────────────── */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            {session && (
              <Link
                href={`/oncadre/hospitals/${slug}`}
                className="rounded-lg bg-[#0B3C5D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0A3350]"
              >
                Write a Review
              </Link>
            )}
          </div>

          {/* Give-to-get gate */}
          {!hasContributed && facility.reviews.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
              <svg
                className="mx-auto h-8 w-8 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <h3 className="mt-3 text-base font-semibold text-amber-900">
                Review a hospital to read all reviews
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                Detailed review text is unlocked once you contribute a review of any hospital.
                Ratings and scores are always visible.
              </p>
              {!session && (
                <Link
                  href="/oncadre/register"
                  className="mt-4 inline-flex items-center rounded-lg bg-[#0B3C5D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A3350]"
                >
                  Register to get started
                </Link>
              )}
            </div>
          )}

          {/* Individual reviews */}
          {facility.reviews.length > 0 ? (
            <div className="mt-4 space-y-4">
              {facility.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  {/* Review header */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      {renderStarsSmall(review.overallRating)}
                      <span className="ml-1 text-sm font-semibold text-gray-800">
                        {review.overallRating}/5
                      </span>
                    </div>
                    {review.cadreAtFacility && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                        {review.cadreAtFacility.replace(/_/g, " ")}
                      </span>
                    )}
                    {review.employmentType && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                        {EMPLOYMENT_TYPE_LABELS[review.employmentType] ?? review.employmentType}
                      </span>
                    )}
                    {review.isCurrentEmployee && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Current employee
                      </span>
                    )}
                  </div>

                  {/* Tenure */}
                  {(review.workedFromYear || review.workedToYear) && (
                    <p className="mt-1 text-xs text-gray-400">
                      {review.workedFromYear && `${review.workedFromYear}`}
                      {review.workedFromYear && review.workedToYear && " - "}
                      {review.workedToYear
                        ? `${review.workedToYear}`
                        : review.isCurrentEmployee
                        ? " - Present"
                        : ""}
                    </p>
                  )}

                  {/* Recommend badge */}
                  {review.wouldRecommend !== null && (
                    <p className="mt-2 text-sm">
                      {review.wouldRecommend ? (
                        <span className="text-emerald-600 font-medium">Would recommend</span>
                      ) : (
                        <span className="text-red-500 font-medium">Would not recommend</span>
                      )}
                    </p>
                  )}

                  {/* Pros / Cons / Advice */}
                  <div className="mt-3 space-y-3">
                    {review.pros !== null ? (
                      hasContributed ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                            Pros
                          </h4>
                          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                            {review.pros}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                            Pros
                          </h4>
                          <p className="mt-1 text-sm text-gray-400 blur-sm select-none leading-relaxed">
                            This review text is locked. Submit a review of any hospital to unlock
                            detailed written reviews from other professionals.
                          </p>
                        </div>
                      )
                    ) : null}

                    {review.cons !== null ? (
                      hasContributed ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500">
                            Cons
                          </h4>
                          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                            {review.cons}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500">
                            Cons
                          </h4>
                          <p className="mt-1 text-sm text-gray-400 blur-sm select-none leading-relaxed">
                            This review text is locked. Submit a review of any hospital to unlock
                            detailed written reviews from other professionals.
                          </p>
                        </div>
                      )
                    ) : null}

                    {review.advice !== null ? (
                      hasContributed ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B3C5D]">
                            Advice to Management
                          </h4>
                          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                            {review.advice}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B3C5D]">
                            Advice to Management
                          </h4>
                          <p className="mt-1 text-sm text-gray-400 blur-sm select-none leading-relaxed">
                            This review text is locked. Submit a review of any hospital to unlock
                            detailed written reviews from other professionals.
                          </p>
                        </div>
                      )
                    ) : null}
                  </div>

                  {/* Date */}
                  <p className="mt-3 text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
              <p className="text-sm text-gray-500">
                No reviews yet. Be the first to review this hospital.
              </p>
              {session ? (
                <Link
                  href={`/oncadre/hospitals/${slug}`}
                  className="mt-4 inline-flex items-center rounded-lg bg-[#0B3C5D] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A3350]"
                >
                  Write a Review
                </Link>
              ) : (
                <Link
                  href="/oncadre/register"
                  className="mt-4 inline-flex items-center rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
                >
                  Register to review
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ─── CTA ─────────────────────────────────────────────────────── */}
        {!session && (
          <div className="mt-10 rounded-xl bg-[#0B3C5D] p-8 text-center text-white">
            <h2 className="text-xl font-bold sm:text-2xl">
              Join CadreHealth
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/80">
              Create your free profile to write reviews, see salary data,
              check your career readiness score, and connect with opportunities.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/oncadre/register"
                className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
              >
                Create free profile
              </Link>
              <Link
                href="/oncadre/login"
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Salary & mandate helpers ────────────────────────────────────────────── */

const MANDATE_TYPE_LABELS: Record<string, string> = {
  PERMANENT: "Permanent",
  LOCUM: "Locum",
  CONTRACT: "Contract",
  CONSULTING: "Consulting",
  INTERNATIONAL: "International",
};

function formatSalaryShort(min: unknown, max: unknown, currency: string | null): string | null {
  if (!min && !max) return null;
  const cur = currency || "NGN";
  const fmt = (n: unknown) => {
    const val = Number(n);
    if (val >= 1_000_000) return `${cur} ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${cur} ${(val / 1_000).toFixed(0)}k`;
    return `${cur} ${val.toLocaleString()}`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max)}`;
}

/* ─── Star helpers (server-compatible, no SVG gradients) ──────────────────── */

function renderStarsWhite(rating: number) {
  const full = Math.floor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`h-5 w-5 ${i < full ? "text-[#D4AF37]" : "text-white/30"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

function renderStarsSmall(rating: number) {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`h-3.5 w-3.5 ${i < rating ? "text-[#D4AF37]" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}
