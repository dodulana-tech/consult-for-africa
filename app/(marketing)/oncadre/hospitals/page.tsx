import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";
import HospitalDirectoryFilters from "./HospitalDirectoryFilters";

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
  { key: "compensationRating", label: "Pay" },
  { key: "equipmentRating", label: "Equipment" },
  { key: "managementRating", label: "Management" },
] as const;

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function ratingColor(value: number): string {
  if (value >= 3.5) return "#10B981"; // green
  if (value >= 2.5) return "#F59E0B"; // amber
  return "#EF4444"; // red
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
    <main
      className="min-h-screen bg-[#F8F9FB] pb-20"
      style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 1rem)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/oncadre" className="hover:text-[#0B3C5D] transition">
            CadreHealth
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Hospitals</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Nigerian Hospital Reviews
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Honest reviews from verified healthcare professionals. Salary data,
            equipment quality, management ratings, and pay timeliness across
            Nigeria.
          </p>
        </div>

        {/* Filters */}
        <HospitalDirectoryFilters
          states={[...NIGERIAN_STATES]}
          facilityTypes={FACILITY_TYPE_OPTIONS}
          currentState={filters.state}
          currentType={filters.type}
        />

        {/* Results count */}
        <p className="mb-4 text-sm text-gray-500">
          {facilities.length} {facilities.length === 1 ? "facility" : "facilities"} found
        </p>

        {/* Grid */}
        {facilities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => {
              const rating = facility.overallRating
                ? Number(facility.overallRating)
                : null;

              return (
                <Link
                  key={facility.id}
                  href={`/oncadre/hospitals/${facility.slug}`}
                  className="group rounded-xl border border-[#E8EBF0] bg-white p-5 transition hover:border-[#0B3C5D]/20"
                  style={{
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Name + Type */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition line-clamp-2">
                      {facility.name}
                    </h2>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#0B3C5D]/8 px-2.5 py-0.5 text-xs font-medium text-[#0B3C5D]">
                      {FACILITY_TYPE_LABELS[facility.type] ?? facility.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {facility.city}, {facility.state}
                    </span>
                  </div>

                  {/* Rating */}
                  {rating !== null ? (
                    <div className="mt-3 flex items-center gap-2">
                      {renderStars(rating)}
                      <span className="text-sm font-semibold text-gray-800">
                        {rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({facility.totalReviews}{" "}
                        {facility.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-gray-400">No reviews yet</p>
                  )}

                  {/* Mini dimension ratings */}
                  {rating !== null && (
                    <div className="mt-3 flex items-center gap-3">
                      {TOP_DIMENSIONS.map((dim) => {
                        const val = facility[dim.key as keyof typeof facility];
                        if (!val) return null;
                        const numVal = Number(val);
                        return (
                          <div key={dim.key} className="flex items-center gap-1">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: ratingColor(numVal) }}
                            />
                            <span className="text-xs text-gray-500">
                              {dim.label}
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: ratingColor(numVal) }}
                            >
                              {numVal.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-gray-500">
              No facilities match your filters. Try adjusting your search.
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 rounded-xl bg-[#0B3C5D] p-8 text-center text-white sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">
            Are you a healthcare professional?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            Join CadreHealth to contribute reviews, share salary data, and help
            your colleagues make better career decisions. Your contributions are
            anonymous.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/oncadre/register"
              className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
            >
              Join CadreHealth
            </Link>
            <Link
              href="/oncadre/readiness"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Check your readiness score
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
