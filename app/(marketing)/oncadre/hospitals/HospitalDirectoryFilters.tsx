"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface Props {
  states: string[];
  facilityTypes: { value: string; label: string }[];
  currentState?: string;
  currentType?: string;
  currentQuery?: string;
}

export default function HospitalDirectoryFilters({
  states,
  facilityTypes,
  currentState,
  currentType,
  currentQuery,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentQuery ?? "");
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/oncadre/hospitals?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearch(value: string) {
    setQuery(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.push(`/oncadre/hospitals?${params.toString()}`);
    });
  }

  const hasFilters = currentState || currentType || currentQuery;

  return (
    <div className="mb-6 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search hospitals by name..."
          className="w-full rounded-xl border border-gray-200/80 bg-white/80 py-3 pl-11 pr-4 text-sm font-medium text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
          style={{ backdropFilter: "blur(8px)" }}
        />
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#0B3C5D]" />
          </div>
        )}
      </div>

      {/* Dropdown filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={currentState ?? ""}
            onChange={(e) => updateFilter("state", e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200/80 bg-white/80 py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm transition focus:border-[#0B3C5D] focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 sm:w-auto"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="relative">
          <select
            value={currentType ?? ""}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="w-full appearance-none rounded-xl border border-gray-200/80 bg-white/80 py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 shadow-sm transition focus:border-[#0B3C5D] focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 sm:w-auto"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <option value="">All facility types</option>
            {facilityTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              router.push("/oncadre/hospitals");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-500 shadow-sm transition hover:bg-white hover:text-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
