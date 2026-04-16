import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";
import HospitalDirectoryFilters from "./HospitalDirectoryFilters";
import ShareButton from "@/components/cadrehealth/ShareButton";

export const dynamic = "force-dynamic";

/* ─── SEO Metadata ─────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Nigerian Hospital Reviews | Staff Ratings & Salary Data | CadreHealth",
  description:
    "Read honest reviews of Nigerian hospitals from verified healthcare staff. Salary data, equipment ratings, management quality, pay timeliness for 73+ facilities.",
  keywords: [
    "Nigerian hospital reviews",
    "hospital staff reviews Nigeria",
    "hospital ratings Nigeria",
    "healthcare salary Nigeria",
    "hospital pay timeliness",
    "hospital equipment ratings",
    "hospital management quality Nigeria",
    "best hospitals to work in Nigeria",
    "healthcare worker reviews Nigeria",
    "CadreHealth",
  ].join(", "),
  openGraph: {
    title: "Nigerian Hospital Reviews | Staff Ratings & Salary Data | CadreHealth",
    description:
      "Read honest reviews of Nigerian hospitals from verified healthcare staff. Salary data, equipment ratings, management quality, pay timeliness for 73+ facilities.",
    type: "website",
    url: "https://consultforafrica.com/oncadre/hospitals",
    siteName: "CadreHealth by Consult For Africa",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nigerian Hospital Reviews | CadreHealth",
    description:
      "Honest reviews from verified healthcare staff. Salary data, equipment ratings, management quality for 73+ Nigerian facilities.",
  },
  alternates: {
    canonical: "https://consultforafrica.com/oncadre/hospitals",
  },
};

/* ─── Constants ────────────────────────────────────────────────────────────── */

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

const FACILITY_TYPE_OPTIONS = Object.entries(FACILITY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TOP_DIMENSIONS = [
  { key: "compensationRating", label: "Pay", icon: "N" },
  { key: "equipmentRating", label: "Equipment", icon: "E" },
  { key: "managementRating", label: "Management", icon: "M" },
] as const;

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function ratingColor(value: number): string {
  if (value >= 3.5) return "#10B981";
  if (value >= 2.5) return "#F59E0B";
  return "#EF4444";
}

function ratingBg(value: number): string {
  if (value >= 3.5) return "rgba(16,185,129,0.08)";
  if (value >= 2.5) return "rgba(245,158,11,0.08)";
  return "rgba(239,68,68,0.08)";
}

function renderStars(rating: number) {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <svg
        key={i}
        className={`h-4 w-4 ${i < Math.round(rating) ? "text-[#D4AF37]" : "text-gray-200"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

interface PageProps {
  searchParams: Promise<{ state?: string; type?: string }>;
}

export default async function HospitalDirectoryPage({ searchParams }: PageProps) {
  const filters = await searchParams;

  const where: Record<string, unknown> = {};
  if (filters.state) where.state = filters.state;
  if (filters.type) where.type = filters.type;

  const facilities = await prisma.cadreFacility.findMany({
    where,
    orderBy: { totalReviews: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      state: true,
      city: true,
      overallRating: true,
      totalReviews: true,
      compensationRating: true,
      equipmentRating: true,
      managementRating: true,
    },
  });

  // Aggregate stats for social proof
  const totalReviewsAcross = facilities.reduce((sum, f) => sum + f.totalReviews, 0);
  const reviewedFacilities = facilities.filter((f) => f.totalReviews > 0).length;

  // JSON-LD: ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nigerian Hospital Reviews",
    description:
      "Comprehensive directory of Nigerian hospital reviews from verified healthcare professionals.",
    numberOfItems: facilities.length,
    itemListElement: facilities.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: f.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: f.city,
          addressRegion: f.state,
          addressCountry: "NG",
        },
        url: `https://consultforafrica.com/oncadre/hospitals/${f.slug}`,
        ...(f.overallRating && f.totalReviews > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(f.overallRating).toFixed(1),
                reviewCount: f.totalReviews,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#F8F9FB]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #061424 0%, #0B3C5D 50%, #0F2744 100%)",
          paddingTop: "calc(var(--navbar-height, 4rem) + 2rem)",
        }}
      >
        {/* Decorative gradient blobs */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 600px 400px at 15% 80%, rgba(212,175,55,0.07) 0%, transparent 70%), radial-gradient(ellipse 500px 300px at 85% 20%, rgba(26,157,217,0.09) 0%, transparent 70%), radial-gradient(ellipse 300px 300px at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)",
          }}
        />
        {/* Subtle dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-white/40">
            <Link href="/oncadre" className="transition hover:text-white/70">
              CadreHealth
            </Link>
            <span>/</span>
            <span className="text-white/70">Hospitals</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Your hospital.{" "}
              <span style={{ color: "#D4AF37" }}>Your truth.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg sm:leading-relaxed">
              Anonymous, verified reviews from the people who actually work
              there. Pay, equipment, management, safety. No filters, no PR.
              Just real talk from real healthcare workers across Nigeria.
            </p>

            {/* CTA row */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/oncadre/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #C4A030)",
                  color: "#0F2744",
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Review your hospital
              </Link>
              <Link
                href="#directory"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
              >
                Browse hospitals
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Social proof stats */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div
              className="rounded-xl px-5 py-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-2xl font-bold text-white sm:text-3xl">
                {facilities.length.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-white/40">
                Hospitals listed
              </p>
            </div>
            <div
              className="rounded-xl px-5 py-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-2xl font-bold sm:text-3xl" style={{ color: "#D4AF37" }}>
                {totalReviewsAcross.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-white/40">
                Staff reviews
              </p>
            </div>
            <div
              className="rounded-xl px-5 py-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-2xl font-bold text-white sm:text-3xl">
                {reviewedFacilities}
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-white/40">
                Reviewed facilities
              </p>
            </div>
            <div
              className="rounded-xl px-5 py-4"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-2xl font-bold text-white sm:text-3xl">
                36 + FCT
              </p>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-white/40">
                States covered
              </p>
            </div>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 48h1440V24C1200 0 240 0 0 24v24z" fill="#F8F9FB" />
          </svg>
        </div>
      </div>

      {/* ─── Directory Section ───────────────────────────────────────── */}
      <div id="directory" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* Inline CTA banner */}
        <div
          className="mb-8 flex flex-col items-center gap-4 rounded-2xl p-5 sm:flex-row sm:justify-between"
          style={{
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(16px) saturate(200%)",
            border: "1px solid rgba(212,175,55,0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(212,175,55,0.1)" }}
            >
              <svg className="h-5 w-5" style={{ color: "#D4AF37" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Don&apos;t see your hospital?
              </p>
              <p className="text-xs text-gray-500">
                Be the first to review it and help your colleagues make better decisions.
              </p>
            </div>
          </div>
          <Link
            href="/oncadre/register"
            className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-md"
            style={{ background: "#0B3C5D" }}
          >
            Add a review
          </Link>
        </div>

        {/* Filters */}
        <HospitalDirectoryFilters
          states={[...NIGERIAN_STATES]}
          facilityTypes={FACILITY_TYPE_OPTIONS}
          currentState={filters.state}
          currentType={filters.type}
        />

        {/* Results count */}
        <p className="mb-5 text-sm text-gray-500">
          {facilities.length} {facilities.length === 1 ? "facility" : "facilities"} found
          {(filters.state || filters.type) && (
            <span className="text-gray-400">
              {" "}{filters.state ? `in ${filters.state}` : ""}
              {filters.state && filters.type ? ", " : ""}
              {filters.type ? FACILITY_TYPE_LABELS[filters.type] || filters.type : ""}
            </span>
          )}
        </p>

        {/* Grid */}
        {facilities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => {
              const rating = facility.overallRating
                ? Number(facility.overallRating)
                : null;
              const hasReviews = facility.totalReviews > 0;

              return (
                <Link
                  key={facility.id}
                  href={`/oncadre/hospitals/${facility.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/60 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(16px) saturate(200%)",
                  }}
                >
                  {/* Subtle accent gradient on hover */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                    style={{
                      background: "linear-gradient(135deg, rgba(11,60,93,0.02) 0%, rgba(212,175,55,0.03) 100%)",
                    }}
                  />

                  <div className="relative">
                    {/* Name + Rating badge */}
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold leading-snug text-gray-900 transition group-hover:text-[#0B3C5D]">
                        {facility.name}
                      </h2>
                      {rating !== null && (
                        <div
                          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1"
                          style={{ background: "#0B3C5D" }}
                        >
                          <svg className="h-3 w-3 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Type + location */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: "rgba(11,60,93,0.06)",
                          color: "#0B3C5D",
                          border: "1px solid rgba(11,60,93,0.08)",
                        }}
                      >
                        {FACILITY_TYPE_LABELS[facility.type] ?? facility.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {facility.city}, {facility.state}
                      </span>
                    </div>

                    {/* Review stars or empty state */}
                    {hasReviews ? (
                      <>
                        <div className="mt-3 flex items-center gap-2">
                          {renderStars(rating!)}
                          <span className="text-xs text-gray-400">
                            ({facility.totalReviews}{" "}
                            {facility.totalReviews === 1 ? "review" : "reviews"})
                          </span>
                        </div>

                        {/* Dimension mini-badges */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {TOP_DIMENSIONS.map((dim) => {
                            const val = facility[dim.key as keyof typeof facility];
                            if (!val) return null;
                            const numVal = Number(val);
                            return (
                              <div
                                key={dim.key}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1"
                                style={{
                                  background: ratingBg(numVal),
                                  border: `1px solid ${ratingColor(numVal)}15`,
                                }}
                              >
                                <span className="text-xs font-medium text-gray-600">
                                  {dim.label}
                                </span>
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: ratingColor(numVal) }}
                                >
                                  {numVal.toFixed(1)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div
                        className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.1)" }}
                      >
                        <svg className="h-4 w-4 shrink-0" style={{ color: "#D4AF37" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-xs font-medium" style={{ color: "#96792A" }}>
                          Be the first to review
                        </span>
                      </div>
                    )}

                    {/* Footer: share + view details */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-medium text-[#0B3C5D] opacity-0 transition group-hover:opacity-100">
                        View details
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <ShareButton
                        title={`${facility.name} - Staff Reviews`}
                        text={`Check out staff reviews for ${facility.name} on CadreHealth. Real ratings on pay, equipment, and management from verified healthcare workers.`}
                        url={`/oncadre/hospitals/${facility.slug}`}
                        variant="icon"
                        stopPropagation
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center"
            style={{ background: "rgba(255,255,255,0.6)" }}
          >
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="mt-4 text-base font-semibold text-gray-700">
              No facilities match your filters
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your state or facility type selection.
            </p>
            <Link
              href="/oncadre/hospitals"
              className="mt-4 inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-medium text-[#0B3C5D] transition hover:bg-[#0B3C5D]/5"
            >
              Clear all filters
            </Link>
          </div>
        )}

        {/* ─── Bottom CTA ────────────────────────────────────────────── */}
        <div
          className="relative mt-16 overflow-hidden rounded-2xl p-8 text-center sm:p-12"
          style={{
            background: "linear-gradient(135deg, #0F2744 0%, #0B3C5D 60%, #1a5a8a 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(26,157,217,0.06) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)" }}
            >
              <svg className="h-7 w-7" style={{ color: "#D4AF37" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Your experience matters
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/65">
              Every review helps a colleague choose where to build their career.
              Your contributions are completely anonymous and verified.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/oncadre/register"
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #D4AF37, #C4A030)",
                  color: "#0F2744",
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Join and review your hospital
              </Link>
              <Link
                href="/oncadre/readiness"
                className="inline-flex items-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
              >
                Check your readiness score
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
