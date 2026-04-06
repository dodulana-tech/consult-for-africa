import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import HospitalSearch from "./HospitalSearch";

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

function facilityTypeLabel(type: string): string {
  return FACILITY_TYPE_LABELS[type] ?? type;
}

function ratingColor(rating: number): string {
  if (rating >= 4) return "text-emerald-600";
  if (rating >= 3) return "text-amber-600";
  return "text-red-600";
}

function ratingBgColor(rating: number): string {
  if (rating >= 4) return "bg-emerald-500";
  if (rating >= 3) return "bg-amber-500";
  return "bg-red-500";
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${cls} ${star <= Math.round(rating) ? "text-[#D4AF37]" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Dimension bars on cards ─────────────────────────────────────────────── */

const TOP_DIMENSIONS = [
  { key: "compensationRating", label: "Compensation" },
  { key: "equipmentRating", label: "Equipment" },
  { key: "managementRating", label: "Management" },
] as const;

interface FacilityWithRatings {
  slug: string;
  name: string;
  type: string;
  state: string;
  city: string;
  overallRating: Prisma.Decimal | null;
  totalReviews: number;
  wouldRecommendPct: Prisma.Decimal | null;
  compensationRating: Prisma.Decimal | null;
  equipmentRating: Prisma.Decimal | null;
  managementRating: Prisma.Decimal | null;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function HospitalExplorerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCadreSession();
  if (!session) redirect("/oncadre/login");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const stateFilter = typeof params.state === "string" ? params.state : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const sortBy = typeof params.sort === "string" ? params.sort : "rating";

  // Build where clause
  const where: Prisma.CadreFacilityWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
    ];
  }

  if (stateFilter) {
    where.state = stateFilter;
  }

  if (typeFilter) {
    where.type = typeFilter as Prisma.EnumCadreFacilityTypeFilter;
  }

  // Build orderBy
  let orderBy: Prisma.CadreFacilityOrderByWithRelationInput;
  switch (sortBy) {
    case "reviews":
      orderBy = { totalReviews: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    case "rating":
    default:
      orderBy = { overallRating: { sort: "desc", nulls: "last" } };
      break;
  }

  const [facilities, totalCount, userReviewCount] = await Promise.all([
    prisma.cadreFacility.findMany({
      where,
      orderBy,
      select: {
        slug: true,
        name: true,
        type: true,
        state: true,
        city: true,
        overallRating: true,
        totalReviews: true,
        wouldRecommendPct: true,
        compensationRating: true,
        equipmentRating: true,
        managementRating: true,
      },
    }) as Promise<FacilityWithRatings[]>,

    prisma.cadreFacility.count(),

    prisma.cadreFacilityReview.count({
      where: { professionalId: session.sub },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Explore Hospitals</h1>
        <p className="mt-1 text-gray-500">
          Honest reviews and salary data from verified healthcare professionals
        </p>
      </div>

      {/* User contribution badge */}
      <div className="flex items-center gap-3 rounded-xl border border-[#E8EBF0] bg-white px-5 py-3 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3C5D]/10">
          <svg className="h-5 w-5 text-[#0B3C5D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            You have reviewed {userReviewCount} of {totalCount} facilities
          </p>
          <p className="text-xs text-gray-500">
            Every review helps colleagues make better career decisions
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <Suspense>
        <HospitalSearch />
      </Suspense>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {facilities.length === totalCount
          ? `${totalCount} hospitals`
          : `${facilities.length} of ${totalCount} hospitals`}
      </p>

      {/* Hospital grid */}
      {facilities.length === 0 ? (
        <div className="rounded-xl border border-[#E8EBF0] bg-white px-6 py-16 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No hospitals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => {
            const rating = facility.overallRating ? Number(facility.overallRating) : null;
            const recommendPct = facility.wouldRecommendPct ? Number(facility.wouldRecommendPct) : null;

            return (
              <Link
                key={facility.slug}
                href={`/oncadre/explore/${facility.slug}`}
                className="group rounded-xl border border-[#E8EBF0] bg-white p-5 shadow-sm transition hover:border-[#0B3C5D]/20 hover:shadow-md"
              >
                {/* Name and type badge */}
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0B3C5D] transition-colors line-clamp-2">
                    {facility.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#0B3C5D]/10 px-2.5 py-0.5 text-xs font-medium text-[#0B3C5D]">
                      {facilityTypeLabel(facility.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {facility.city}, {facility.state}
                    </span>
                  </div>
                </div>

                {/* Rating row */}
                <div className="mb-4 flex items-center gap-3">
                  {rating !== null ? (
                    <>
                      <span className={`text-2xl font-bold ${ratingColor(rating)}`}>
                        {rating.toFixed(1)}
                      </span>
                      <div>
                        <Stars rating={rating} />
                        <p className="mt-0.5 text-xs text-gray-500">
                          {facility.totalReviews} review{facility.totalReviews !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No reviews yet</p>
                  )}
                </div>

                {/* Would recommend */}
                {recommendPct !== null && facility.totalReviews >= 2 && (
                  <div className="mb-4 flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600">
                      {Math.round(recommendPct)}% would recommend
                    </span>
                  </div>
                )}

                {/* Top dimension mini-bars */}
                {rating !== null && (
                  <div className="space-y-2">
                    {TOP_DIMENSIONS.map((dim) => {
                      const val = facility[dim.key] ? Number(facility[dim.key]) : null;
                      if (val === null) return null;
                      return (
                        <div key={dim.key} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 text-xs text-gray-500">{dim.label}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${ratingBgColor(val)}`}
                              style={{ width: `${(val / 5) * 100}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-xs font-medium text-gray-600">
                            {val.toFixed(1)}
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
      )}
    </div>
  );
}
