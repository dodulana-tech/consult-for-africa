"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  states: string[];
  facilityTypes: { value: string; label: string }[];
  currentState?: string;
  currentType?: string;
}

export default function HospitalDirectoryFilters({
  states,
  facilityTypes,
  currentState,
  currentType,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
        value={currentState ?? ""}
        onChange={(e) => updateFilter("state", e.target.value)}
        className="rounded-lg border border-[#E8EBF0] bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
      >
        <option value="">All states</option>
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={currentType ?? ""}
        onChange={(e) => updateFilter("type", e.target.value)}
        className="rounded-lg border border-[#E8EBF0] bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
      >
        <option value="">All facility types</option>
        {facilityTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {(currentState || currentType) && (
        <button
          onClick={() => router.push("/oncadre/hospitals")}
          className="rounded-lg border border-[#E8EBF0] bg-white px-4 py-2.5 text-sm text-gray-500 transition hover:text-gray-700"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
