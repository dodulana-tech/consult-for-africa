"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const MENTOR_AREAS = [
  "UK Migration",
  "US Residency Match",
  "Fellowship Preparation",
  "Career Transition",
  "Specialty Selection",
  "Locum Strategy",
  "Exam Preparation",
  "Research & Publications",
  "Leadership Development",
  "Private Practice Setup",
  "NGO & Development Work",
  "Diaspora Return Planning",
];

const PARTNER_ORGS = [
  { value: "MANSAG", label: "MANSAG" },
  { value: "ANPA", label: "ANPA" },
  { value: "DFC", label: "Doctors Foundation for Care" },
  { value: "NDF_SA", label: "NDF-SA" },
];

interface CadreOption {
  value: string;
  label: string;
}

export default function MentorFilters({
  cadreOptions,
}: {
  cadreOptions: CadreOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCadre = searchParams.get("cadre") || "";
  const currentArea = searchParams.get("area") || "";
  const currentPartnerOrg = searchParams.get("partnerOrg") || "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/oncadre/mentorship/mentors?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push("/oncadre/mentorship/mentors");
  }, [router]);

  const hasFilters = currentCadre || currentArea || currentPartnerOrg;

  return (
    <div
      className="rounded-2xl border bg-white p-4 sm:p-6"
      style={{ borderColor: "#E8EBF0" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* Cadre filter */}
        <div className="flex-1">
          <label
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500"
            htmlFor="filter-cadre"
          >
            Cadre
          </label>
          <select
            id="filter-cadre"
            value={currentCadre}
            onChange={(e) => updateFilter("cadre", e.target.value)}
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          >
            <option value="">All Cadres</option>
            {cadreOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Area filter */}
        <div className="flex-1">
          <label
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500"
            htmlFor="filter-area"
          >
            Mentor Area
          </label>
          <select
            id="filter-area"
            value={currentArea}
            onChange={(e) => updateFilter("area", e.target.value)}
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          >
            <option value="">All Areas</option>
            {MENTOR_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Partner Org filter */}
        <div className="flex-1">
          <label
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500"
            htmlFor="filter-org"
          >
            Partner Organization
          </label>
          <select
            id="filter-org"
            value={currentPartnerOrg}
            onChange={(e) => updateFilter("partnerOrg", e.target.value)}
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          >
            <option value="">All Organizations</option>
            {PARTNER_ORGS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            style={{ borderColor: "#E8EBF0" }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
