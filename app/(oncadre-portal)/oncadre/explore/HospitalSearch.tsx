"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";

/* ─── Facility type labels ────────────────────────────────────────────────── */

const FACILITY_TYPE_OPTIONS = [
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
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviewed" },
  { value: "name", label: "Name (A-Z)" },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function HospitalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const currentState = searchParams.get("state") ?? "";
  const currentType = searchParams.get("type") ?? "";
  const currentSort = searchParams.get("sort") ?? "rating";

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 on filter change
      params.delete("page");
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }));
    }, 300);
  };

  // Sync query from URL on back/forward nav
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const hasFilters = !!(
    searchParams.get("q") ||
    searchParams.get("state") ||
    searchParams.get("type")
  );

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search hospitals by name, city, or state..."
          className="w-full rounded-xl border border-[#E8EBF0] bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* State filter */}
        <select
          value={currentState}
          onChange={(e) => router.push(buildUrl({ state: e.target.value }))}
          className="rounded-lg border border-[#E8EBF0] bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        >
          <option value="">All States</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={currentType}
          onChange={(e) => router.push(buildUrl({ type: e.target.value }))}
          className="rounded-lg border border-[#E8EBF0] bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        >
          <option value="">All Types</option>
          {FACILITY_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
          className="rounded-lg border border-[#E8EBF0] bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="rounded-lg border border-[#E8EBF0] bg-white px-3 py-2.5 text-sm font-medium text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
