import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import ShareButton from "@/components/cadrehealth/ShareButton";

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

  const session = await getCadreSession();
  let hasContributed = false;
  if (session) {
    const reviewCount = await prisma.cadreFacilityReview.count({
      where: { professionalId: session.sub },
    });
    hasContributed = reviewCount > 0;
  }

  const openJobs = await prisma.cadreMandate.findMany({
    where: { facilityId: facility.id, isPublished: true, status: "OPEN" },
    select: { id: true, slug: true, title: true, cadre: true, type: true, salaryRangeMin: true, salaryRangeMax: true, salaryCurrency: true, urgency: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const overallRating = facility.overallRating ? Number(facility.overallRating) : null;
  const recommendPct = facility.wouldRecommendPct ? Number(facility.wouldRecommendPct) : null;

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

  const dimensions = DIMENSION_CONFIG.map((d) => ({
    ...d,
    value: facility[d.key as keyof typeof facility]
      ? Number(facility[d.key as keyof typeof facility])
      : null,
  })).filter((d) => d.value !== null);

  const hasSalaryData = facility._count.salaryReports > 0;
  const typeLabel = FACILITY_TYPE_LABELS[facility.type] ?? facility.type;

  // JSON-LD
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
  if (facility.website) jsonLd.sameAs = facility.website;
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
    <main className="min-h-screen bg-[#F8F9FB]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #061424 0%, #0B3C5D 50%, #0F2744 100%)",
          paddingTop: "calc(var(--navbar-height, 4rem) + 1.5rem)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 500px 300px at 80% 30%, rgba(212,175,55,0.07) 0%, transparent 70%), radial-gradient(ellipse 400px 300px at 15% 70%, rgba(26,157,217,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-14 sm:px-6 sm:pb-16">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/40">
            <Link href="/oncadre" className="transition hover:text-white/70">
              CadreHealth
            </Link>
            <span>/</span>
            <Link href="/oncadre/hospitals" className="transition hover:text-white/70">
              Hospitals
            </Link>
            <span>/</span>
            <span className="truncate text-white/70">{facility.name}</span>
          </nav>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                {facility.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {typeLabel}
                </span>
                <span className="flex items-center gap-1 text-sm text-white/50">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {facility.city}, {facility.state}
                </span>
              </div>
              {facility.bedCount && (
                <p className="mt-2 text-sm text-white/40">{facility.bedCount} beds</p>
              )}
              {facility.website && (
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white/80"
                >
                  Visit website
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}

              {/* Action row */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {session ? (
                  <Link
                    href={`/oncadre/hospitals/${slug}`}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:shadow-lg"
                    style={{ background: "linear-gradient(135deg, #D4AF37, #C4A030)", color: "#0F2744" }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Write a review
                  </Link>
                ) : (
                  <Link
                    href="/oncadre/register"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:shadow-lg"
                    style={{ background: "linear-gradient(135deg, #D4AF37, #C4A030)", color: "#0F2744" }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Join to review
                  </Link>
                )}
                <ShareButton
                  title={`${facility.name} - Staff Reviews | CadreHealth`}
                  text={overallRating
                    ? `${facility.name} rated ${overallRating.toFixed(1)}/5 by ${facility.totalReviews} healthcare workers on CadreHealth. See honest reviews on pay, equipment, and management.`
                    : `Check out ${facility.name} on CadreHealth. Be the first to review this hospital and help your colleagues.`
                  }
                  url={`/oncadre/hospitals/${slug}`}
                  variant="button"
                />
              </div>
            </div>

            {/* Overall rating card */}
            {overallRating !== null && (
              <div
                className="shrink-0 rounded-2xl px-7 py-6 text-center"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="text-4xl font-bold text-white">{overallRating.toFixed(1)}</div>
                <div className="mt-1.5 flex justify-center">{renderStarsWhite(overallRating)}</div>
                <div className="mt-2 text-sm text-white/60">
                  {facility.totalReviews} {facility.totalReviews === 1 ? "review" : "reviews"}
                </div>
                {recommendPct !== null && (
                  <div className="mt-1 text-sm font-semibold" style={{ color: "#D4AF37" }}>
                    {Math.round(recommendPct)}% recommend
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Curved edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 32" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 32h1440V16C1200 0 240 0 0 16v16z" fill="#F8F9FB" />
          </svg>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        {/* ─── About Section ─────────────────────────────────────────── */}
        {facility.description && (
          <div
            className="rounded-2xl border border-white/60 p-6 shadow-sm sm:p-8"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px) saturate(200%)" }}
          >
            <h2 className="text-lg font-semibold text-gray-900">About {facility.name}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
              {facility.description.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {facility.yearEstablished && (
                <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-gray-600" style={{ background: "rgba(15,39,68,0.03)", border: "1px solid rgba(15,39,68,0.06)" }}>
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Est. {facility.yearEstablished}
                </span>
              )}
              {facility.bedCount && (
                <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-gray-600" style={{ background: "rgba(15,39,68,0.03)", border: "1px solid rgba(15,39,68,0.06)" }}>
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>
                  {facility.bedCount} beds
                </span>
              )}
              {facility.address && (
                <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-gray-600" style={{ background: "rgba(15,39,68,0.03)", border: "1px solid rgba(15,39,68,0.06)" }}>
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {facility.address}
                </span>
              )}
              {facility.phone && (
                <a href={`tel:${facility.phone}`} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-[#0B3C5D] transition hover:shadow-sm" style={{ background: "rgba(15,39,68,0.03)", border: "1px solid rgba(15,39,68,0.06)" }}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {facility.phone}
                </a>
              )}
              {facility.email && (
                <a href={`mailto:${facility.email}`} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-[#0B3C5D] transition hover:shadow-sm" style={{ background: "rgba(15,39,68,0.03)", border: "1px solid rgba(15,39,68,0.06)" }}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {facility.email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* ─── Open Jobs ──────────────────────────────────────────────── */}
        {openJobs.length > 0 && (
          <div
            className="mt-6 rounded-2xl border border-white/60 p-6 shadow-sm sm:p-8"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px) saturate(200%)" }}
          >
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
                    className="group flex items-center justify-between rounded-xl p-4 transition-all hover:shadow-sm"
                    style={{ background: "rgba(15,39,68,0.02)", border: "1px solid rgba(15,39,68,0.06)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#0B3C5D]">{job.title}</p>
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
                    <svg className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-[#0B3C5D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Dimension Ratings ───────────────────────────────────────── */}
        {dimensions.length > 0 && (
          <div
            className="mt-6 rounded-2xl border border-white/60 p-6 shadow-sm"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px) saturate(200%)" }}
          >
            <h2 className="text-lg font-semibold text-gray-900">Ratings by Category</h2>
            <div className="mt-4 space-y-3">
              {dimensions.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm text-gray-600 sm:w-40">
                    {d.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-3 overflow-hidden rounded-full" style={{ background: "rgba(15,39,68,0.04)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${((d.value ?? 0) / 5) * 100}%`,
                          background: `linear-gradient(90deg, ${d.color}, ${d.color}cc)`,
                          boxShadow: `0 0 8px ${d.color}30`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-bold text-gray-800">
                    {d.value!.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Rating Breakdown ────────────────────────────────────────── */}
        {facility.totalReviews > 0 && (
          <div
            className="mt-6 rounded-2xl border border-white/60 p-6 shadow-sm"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px) saturate(200%)" }}
          >
            <h2 className="text-lg font-semibold text-gray-900">Rating Breakdown</h2>
            <div className="mt-4 space-y-2">
              {ratingBreakdown.map((b) => (
                <div key={b.star} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-gray-600">
                    {b.star} star{b.star !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(15,39,68,0.04)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${b.pct}%`, background: "linear-gradient(90deg, #D4AF37, #C4A030)" }}
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
          <div
            className="mt-6 rounded-2xl border border-white/60 p-6 shadow-sm"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px) saturate(200%)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Salary Data</h2>
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(212,175,55,0.1)", color: "#96792A", border: "1px solid rgba(212,175,55,0.15)" }}>
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

        {/* ─── Share Card ─────────────────────────────────────────────── */}
        <div className="mt-6">
          <ShareButton
            title={`${facility.name} - Staff Reviews | CadreHealth`}
            text={overallRating
              ? `${facility.name} rated ${overallRating.toFixed(1)}/5 by ${facility.totalReviews} healthcare workers. See honest reviews on CadreHealth.`
              : `Working at ${facility.name}? Share your experience on CadreHealth and help colleagues make better career decisions.`
            }
            url={`/oncadre/hospitals/${slug}`}
            variant="card"
          />
        </div>

        {/* ─── Reviews Section ─────────────────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
          </div>

          {/* Give-to-get gate */}
          {!hasContributed && facility.reviews.length > 0 && (
            <div
              className="mt-4 rounded-2xl p-6 text-center"
              style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)" }}
            >
              <svg
                className="mx-auto h-10 w-10"
                style={{ color: "#D4AF37" }}
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
              <h3 className="mt-3 text-base font-semibold" style={{ color: "#0F2744" }}>
                Review a hospital to unlock all reviews
              </h3>
              <p className="mt-1.5 text-sm text-gray-600">
                Detailed review text is unlocked once you contribute a review of any hospital.
                Ratings and scores are always visible.
              </p>
              {!session && (
                <Link
                  href="/oncadre/register"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #C4A030)", color: "#0F2744" }}
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
                  className="rounded-2xl border border-white/60 p-5 shadow-sm"
                  style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px) saturate(200%)" }}
                >
                  {/* Review header */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      {renderStarsSmall(review.overallRating)}
                      <span className="ml-1 text-sm font-bold text-gray-800">
                        {review.overallRating}/5
                      </span>
                    </div>
                    {review.cadreAtFacility && (
                      <span className="rounded-full px-2.5 py-0.5 text-xs text-gray-600" style={{ background: "rgba(15,39,68,0.04)", border: "1px solid rgba(15,39,68,0.06)" }}>
                        {review.cadreAtFacility.replace(/_/g, " ")}
                      </span>
                    )}
                    {review.employmentType && (
                      <span className="rounded-full px-2.5 py-0.5 text-xs text-gray-600" style={{ background: "rgba(15,39,68,0.04)", border: "1px solid rgba(15,39,68,0.06)" }}>
                        {EMPLOYMENT_TYPE_LABELS[review.employmentType] ?? review.employmentType}
                      </span>
                    )}
                    {review.isCurrentEmployee && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
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

                  {/* Recommend */}
                  {review.wouldRecommend !== null && (
                    <p className="mt-2 text-sm">
                      {review.wouldRecommend ? (
                        <span className="font-medium text-emerald-600">Would recommend</span>
                      ) : (
                        <span className="font-medium text-red-500">Would not recommend</span>
                      )}
                    </p>
                  )}

                  {/* Pros / Cons / Advice */}
                  <div className="mt-3 space-y-3">
                    {review.pros !== null ? (
                      hasContributed ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Pros</h4>
                          <p className="mt-1 text-sm leading-relaxed text-gray-700">{review.pros}</p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Pros</h4>
                          <p className="mt-1 text-sm leading-relaxed text-gray-400 blur-sm select-none">
                            This review text is locked. Submit a review of any hospital to unlock detailed written reviews from other professionals.
                          </p>
                        </div>
                      )
                    ) : null}

                    {review.cons !== null ? (
                      hasContributed ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500">Cons</h4>
                          <p className="mt-1 text-sm leading-relaxed text-gray-700">{review.cons}</p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-500">Cons</h4>
                          <p className="mt-1 text-sm leading-relaxed text-gray-400 blur-sm select-none">
                            This review text is locked. Submit a review of any hospital to unlock detailed written reviews from other professionals.
                          </p>
                        </div>
                      )
                    ) : null}

                    {review.advice !== null ? (
                      hasContributed ? (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B3C5D]">Advice to Management</h4>
                          <p className="mt-1 text-sm leading-relaxed text-gray-700">{review.advice}</p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0B3C5D]">Advice to Management</h4>
                          <p className="mt-1 text-sm leading-relaxed text-gray-400 blur-sm select-none">
                            This review text is locked. Submit a review of any hospital to unlock detailed written reviews from other professionals.
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
            <div
              className="mt-4 rounded-2xl border-2 border-dashed py-14 text-center"
              style={{ borderColor: "rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.03)" }}
            >
              <svg className="mx-auto h-10 w-10" style={{ color: "#D4AF37" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <p className="mt-3 text-base font-semibold text-gray-800">
                No reviews yet. Be the first.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Your experience at this hospital could help hundreds of colleagues.
              </p>
              {session ? (
                <Link
                  href={`/oncadre/hospitals/${slug}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #C4A030)", color: "#0F2744" }}
                >
                  Write the first review
                </Link>
              ) : (
                <Link
                  href="/oncadre/register"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #C4A030)", color: "#0F2744" }}
                >
                  Register to review
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ─── Bottom CTA ─────────────────────────────────────────────── */}
        {!session && (
          <div
            className="relative mt-12 overflow-hidden rounded-2xl p-8 text-center sm:p-12"
            style={{ background: "linear-gradient(135deg, #0F2744 0%, #0B3C5D 60%, #1a5a8a 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.08) 0%, transparent 60%)" }}
            />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Join CadreHealth
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/65">
                Create your free profile to write reviews, see salary data,
                check your career readiness score, and connect with opportunities.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/oncadre/register"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #C4A030)", color: "#0F2744" }}
                >
                  Create free profile
                </Link>
                <Link
                  href="/oncadre/login"
                  className="rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
                >
                  Sign in
                </Link>
              </div>
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

/* ─── Star helpers ────────────────────────────────────────────────────────── */

function renderStarsWhite(rating: number) {
  const full = Math.floor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`h-5 w-5 ${i < full ? "text-[#D4AF37]" : "text-white/20"}`}
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
