"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface Facility {
  id: string;
  name: string;
  slug: string;
  type: string;
  state: string;
  city: string;
  overallRating: string | null;
  totalReviews: number;
  wouldRecommendPct: string | null;
  compensationRating: string | null;
  payTimelinessRating: string | null;
  equipmentRating: string | null;
  managementRating: string | null;
}

interface FacilityResponse {
  facilities: Facility[];
  total: number;
  page: number;
  totalPages: number;
}

const FACILITY_TYPES = [
  { value: "PUBLIC_TERTIARY", label: "Public Tertiary" },
  { value: "PUBLIC_SECONDARY", label: "Public Secondary" },
  { value: "PUBLIC_PRIMARY", label: "Public Primary" },
  { value: "PRIVATE_TERTIARY", label: "Private Tertiary" },
  { value: "PRIVATE_SECONDARY", label: "Private Secondary" },
  { value: "PRIVATE_CLINIC", label: "Private Clinic" },
  { value: "FAITH_BASED", label: "Faith-Based" },
  { value: "NGO", label: "NGO" },
  { value: "MILITARY", label: "Military" },
  { value: "INTERNATIONAL", label: "International" },
];

const SORT_OPTIONS = [
  { value: "overallRating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviewed" },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatType(type: string): string {
  const found = FACILITY_TYPES.find((t) => t.value === type);
  return found?.label ?? type.replace(/_/g, " ");
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const stars: React.ReactNode[] = [];

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <svg key={i} className="h-4 w-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <svg key={i} className="h-4 w-4 text-[#D4AF37]" viewBox="0 0 20 20">
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill={`url(#half-${i})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} className="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

/* ─── Component ────────────────────────────────────────────────────────────── */

export default function HospitalsPage() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("overallRating");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FacilityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (state) params.set("state", state);
      if (type) params.set("type", type);
      params.set("sort", sort);
      params.set("page", String(page));

      const res = await fetch(`/api/cadre/hospitals?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silently fail, keep existing data
    } finally {
      setLoading(false);
    }
  }, [search, state, type, sort, page]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Anonymous reviews from verified healthcare professionals
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search hospitals by name..."
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={state}
          onChange={(e) => handleFilterChange(setState, e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        >
          <option value="">All States</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => handleFilterChange(setType, e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        >
          <option value="">All Facility Types</option>
          {FACILITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => handleFilterChange(setSort, e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {data && !loading && (
        <p className="text-sm text-gray-500">
          {data.total} {data.total === 1 ? "hospital" : "hospitals"} found
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-6">
              <div className="h-5 w-3/4 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
              <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {/* Facility cards */}
      {!loading && data && data.facilities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.facilities.map((facility) => {
            const rating = facility.overallRating ? parseFloat(facility.overallRating) : null;
            const recommend = facility.wouldRecommendPct
              ? parseFloat(facility.wouldRecommendPct)
              : null;

            // Top 3 dimension ratings
            const dimensions = [
              { label: "Compensation", value: facility.compensationRating },
              { label: "Pay Timeliness", value: facility.payTimelinessRating },
              { label: "Equipment", value: facility.equipmentRating },
              { label: "Management", value: facility.managementRating },
            ]
              .filter((d) => d.value !== null)
              .sort((a, b) => parseFloat(b.value!) - parseFloat(a.value!))
              .slice(0, 3);

            return (
              <Link
                key={facility.id}
                href={`/oncadre/hospitals/${facility.slug}`}
                className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md"
              >
                {/* Name + type badge */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0B3C5D]">
                    {facility.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-[#0B3C5D]/10 px-2.5 py-0.5 text-xs font-medium text-[#0B3C5D]">
                    {formatType(facility.type)}
                  </span>
                </div>

                {/* Location */}
                <p className="mt-1 text-sm text-gray-500">
                  {facility.city}, {facility.state}
                </p>

                {/* Rating row */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {rating !== null ? (
                    <>
                      <span className="text-lg font-bold text-[#0B3C5D]">
                        {rating.toFixed(1)}
                      </span>
                      {renderStars(rating)}
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No ratings yet</span>
                  )}
                  <span className="text-sm text-gray-400">
                    {facility.totalReviews}{" "}
                    {facility.totalReviews === 1 ? "review" : "reviews"}
                  </span>
                </div>

                {/* Recommend */}
                {recommend !== null && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-emerald-600">
                      {Math.round(recommend)}%
                    </span>{" "}
                    would recommend
                  </p>
                )}

                {/* Top dimensions */}
                {dimensions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dimensions.map((d) => (
                      <span
                        key={d.label}
                        className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600"
                      >
                        {d.label}{" "}
                        <span className="font-semibold text-gray-800">
                          {parseFloat(d.value!).toFixed(1)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.facilities.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
            />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            No hospitals found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your filters, or help the community grow.
          </p>
          <p className="mt-4 text-sm font-medium text-[#0B3C5D]">
            Know a hospital? Help us add it.
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
