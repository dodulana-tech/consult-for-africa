"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ---- Types ---- */

interface FacilityOption {
  slug: string;
  name: string;
  type: string;
  state: string;
  city: string;
  totalReviews: number;
  overallRating: number | null;
  compensationRating: number | null;
  payTimelinessRating: number | null;
  workloadRating: number | null;
  equipmentRating: number | null;
  managementRating: number | null;
  safetyRating: number | null;
  trainingRating: number | null;
  accommodationRating: number | null;
  interCadreRating: number | null;
  fairnessRating: number | null;
  worklifeRating: number | null;
  clinicalGovernanceRating: number | null;
  integrityRating: number | null;
  wouldRecommendPct: number | null;
}

const DIMENSION_CONFIG = [
  { key: "overallRating", label: "Overall", color: "#0B3C5D" },
  { key: "compensationRating", label: "Compensation", color: "#10B981" },
  { key: "payTimelinessRating", label: "Pay Timeliness", color: "#3B82F6" },
  { key: "workloadRating", label: "Workload", color: "#8B5CF6" },
  { key: "equipmentRating", label: "Equipment", color: "#F59E0B" },
  { key: "managementRating", label: "Management", color: "#EF4444" },
  { key: "safetyRating", label: "Safety", color: "#06B6D4" },
  { key: "trainingRating", label: "Training", color: "#D946EF" },
  { key: "accommodationRating", label: "Accommodation", color: "#F97316" },
  { key: "interCadreRating", label: "Inter-Cadre", color: "#14B8A6" },
  { key: "fairnessRating", label: "Fairness", color: "#6366F1" },
  { key: "worklifeRating", label: "Work-Life Balance", color: "#EC4899" },
] as const;

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

/* ---- Component ---- */

export default function HospitalComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [resultsA, setResultsA] = useState<FacilityOption[]>([]);
  const [resultsB, setResultsB] = useState<FacilityOption[]>([]);
  const [hospitalA, setHospitalA] = useState<FacilityOption | null>(null);
  const [hospitalB, setHospitalB] = useState<FacilityOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);

  // Search handler
  const searchHospitals = useCallback(
    async (query: string, setter: (r: FacilityOption[]) => void) => {
      if (query.length < 2) {
        setter([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/cadre/hospitals/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setter(data.facilities ?? []);
        }
      } catch {
        setter([]);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => searchHospitals(searchA, setResultsA), 300);
    return () => clearTimeout(t);
  }, [searchA, searchHospitals]);

  useEffect(() => {
    const t = setTimeout(() => searchHospitals(searchB, setResultsB), 300);
    return () => clearTimeout(t);
  }, [searchB, searchHospitals]);

  // Load from URL params
  useEffect(() => {
    const slugA = searchParams.get("a");
    const slugB = searchParams.get("b");
    if (slugA || slugB) {
      setLoading(true);
      const loadFacility = async (slug: string) => {
        try {
          const res = await fetch(`/api/cadre/hospitals/${slug}`);
          if (res.ok) return (await res.json()).facility as FacilityOption;
        } catch {
          /* ignore */
        }
        return null;
      };

      Promise.all([
        slugA ? loadFacility(slugA) : Promise.resolve(null),
        slugB ? loadFacility(slugB) : Promise.resolve(null),
      ]).then(([a, b]) => {
        if (a) setHospitalA(a);
        if (b) setHospitalB(b);
        setLoading(false);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when hospitals change
  const updateUrl = useCallback(
    (a: FacilityOption | null, b: FacilityOption | null) => {
      const params = new URLSearchParams();
      if (a) params.set("a", a.slug);
      if (b) params.set("b", b.slug);
      const qs = params.toString();
      router.replace(qs ? `/oncadre/hospitals/compare?${qs}` : "/oncadre/hospitals/compare", {
        scroll: false,
      });
    },
    [router]
  );

  const selectA = (h: FacilityOption) => {
    setHospitalA(h);
    setSearchA("");
    setShowDropdownA(false);
    updateUrl(h, hospitalB);
  };

  const selectB = (h: FacilityOption) => {
    setHospitalB(h);
    setSearchB("");
    setShowDropdownB(false);
    updateUrl(hospitalA, h);
  };

  const getRating = (
    h: FacilityOption | null,
    key: string
  ): number | null => {
    if (!h) return null;
    return (h as unknown as Record<string, number | null>)[key] ?? null;
  };

  return (
    <main
      className="min-h-screen bg-[#F8F9FB] pb-20"
      style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 1rem)" }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/oncadre" className="hover:text-[#0B3C5D] transition">
            CadreHealth
          </Link>
          <span>/</span>
          <Link
            href="/oncadre/hospitals"
            className="hover:text-[#0B3C5D] transition"
          >
            Hospitals
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Compare</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Compare Nigerian Hospitals
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Side-by-side comparison of hospital staff reviews across all review
            dimensions. Select two hospitals to compare.
          </p>
        </div>

        {/* Hospital selectors */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {/* Hospital A */}
          <div className="relative">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Hospital A
            </label>
            {hospitalA ? (
              <div
                className="flex items-center justify-between rounded-xl bg-white p-4"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {hospitalA.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {FACILITY_TYPE_LABELS[hospitalA.type] ?? hospitalA.type} /{" "}
                    {hospitalA.city}, {hospitalA.state}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHospitalA(null);
                    updateUrl(null, hospitalB);
                  }}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchA}
                  onChange={(e) => {
                    setSearchA(e.target.value);
                    setShowDropdownA(true);
                  }}
                  onFocus={() => setShowDropdownA(true)}
                  placeholder="Search for a hospital..."
                  className="w-full rounded-xl border border-[#E8EBF0] bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                />
                {showDropdownA && resultsA.length > 0 && (
                  <div
                    className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white shadow-lg"
                    style={{ border: "1px solid #E8EBF0" }}
                  >
                    {resultsA.map((h) => (
                      <button
                        key={h.slug}
                        onClick={() => selectA(h)}
                        className="block w-full px-4 py-3 text-left transition hover:bg-[#F8F9FB]"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {h.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {h.city}, {h.state}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hospital B */}
          <div className="relative">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Hospital B
            </label>
            {hospitalB ? (
              <div
                className="flex items-center justify-between rounded-xl bg-white p-4"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {hospitalB.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {FACILITY_TYPE_LABELS[hospitalB.type] ?? hospitalB.type} /{" "}
                    {hospitalB.city}, {hospitalB.state}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHospitalB(null);
                    updateUrl(hospitalA, null);
                  }}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchB}
                  onChange={(e) => {
                    setSearchB(e.target.value);
                    setShowDropdownB(true);
                  }}
                  onFocus={() => setShowDropdownB(true)}
                  placeholder="Search for a hospital..."
                  className="w-full rounded-xl border border-[#E8EBF0] bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                />
                {showDropdownB && resultsB.length > 0 && (
                  <div
                    className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white shadow-lg"
                    style={{ border: "1px solid #E8EBF0" }}
                  >
                    {resultsB.map((h) => (
                      <button
                        key={h.slug}
                        onClick={() => selectB(h)}
                        className="block w-full px-4 py-3 text-left transition hover:bg-[#F8F9FB]"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {h.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {h.city}, {h.state}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0B3C5D] border-t-transparent" />
            <p className="mt-3 text-sm text-gray-500">Loading hospitals...</p>
          </div>
        )}

        {/* Comparison content */}
        {hospitalA && hospitalB && !loading && (
          <div className="space-y-8">
            {/* Overall rating comparison */}
            <div
              className="overflow-hidden rounded-xl bg-white"
              style={{
                border: "1px solid #E8EBF0",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div className="border-b border-[#E8EBF0] bg-[#F8F9FB] px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Overall Comparison
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-4 p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {hospitalA.name}
                  </p>
                  <p
                    className="mt-2 text-4xl font-bold"
                    style={{ color: "#0B3C5D" }}
                  >
                    {hospitalA.overallRating
                      ? Number(hospitalA.overallRating).toFixed(1)
                      : "--"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {hospitalA.totalReviews} reviews
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-300">vs</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {hospitalB.name}
                  </p>
                  <p
                    className="mt-2 text-4xl font-bold"
                    style={{ color: "#D4AF37" }}
                  >
                    {hospitalB.overallRating
                      ? Number(hospitalB.overallRating).toFixed(1)
                      : "--"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {hospitalB.totalReviews} reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension-by-dimension bar charts */}
            <div
              className="overflow-hidden rounded-xl bg-white"
              style={{
                border: "1px solid #E8EBF0",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div className="border-b border-[#E8EBF0] bg-[#F8F9FB] px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Dimension Ratings
                </h2>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: "#0B3C5D" }}
                    />
                    {hospitalA.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: "#D4AF37" }}
                    />
                    {hospitalB.name}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[#E8EBF0]">
                {DIMENSION_CONFIG.map((dim) => {
                  const valA = getRating(hospitalA, dim.key);
                  const valB = getRating(hospitalB, dim.key);
                  const numA = valA ? Number(valA) : 0;
                  const numB = valB ? Number(valB) : 0;
                  const pctA = (numA / 5) * 100;
                  const pctB = (numB / 5) * 100;

                  return (
                    <div key={dim.key} className="px-6 py-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        {dim.label}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 text-right text-xs font-semibold text-[#0B3C5D]">
                            {valA ? numA.toFixed(1) : "--"}
                          </span>
                          <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pctA}%`,
                                background: "#0B3C5D",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-8 text-right text-xs font-semibold text-[#D4AF37]">
                            {valB ? numB.toFixed(1) : "--"}
                          </span>
                          <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pctB}%`,
                                background: "#D4AF37",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Would recommend */}
            <div
              className="overflow-hidden rounded-xl bg-white"
              style={{
                border: "1px solid #E8EBF0",
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div className="border-b border-[#E8EBF0] bg-[#F8F9FB] px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Key Metrics
                </h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#E8EBF0] p-6">
                <div className="pr-6 text-center">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {hospitalA.name}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#0B3C5D]">
                    {hospitalA.wouldRecommendPct
                      ? `${Number(hospitalA.wouldRecommendPct).toFixed(0)}%`
                      : "--"}
                  </p>
                  <p className="text-xs text-gray-500">Would recommend</p>
                </div>
                <div className="pl-6 text-center">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {hospitalB.name}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#D4AF37]">
                    {hospitalB.wouldRecommendPct
                      ? `${Number(hospitalB.wouldRecommendPct).toFixed(0)}%`
                      : "--"}
                  </p>
                  <p className="text-xs text-gray-500">Would recommend</p>
                </div>
              </div>
            </div>

            {/* Links to individual pages */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/oncadre/hospitals/${hospitalA.slug}`}
                className="rounded-lg bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
              >
                View {hospitalA.name}
              </Link>
              <Link
                href={`/oncadre/hospitals/${hospitalB.slug}`}
                className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
              >
                View {hospitalB.name}
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hospitalA && !hospitalB && !loading && (
          <div
            className="rounded-xl bg-white p-10 text-center sm:p-14"
            style={{
              border: "1px solid #E8EBF0",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0B3C5D]/8">
              <svg
                className="h-8 w-8 text-[#0B3C5D]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Compare Two Hospitals
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
              Search and select two hospitals above to see a detailed
              side-by-side comparison of staff reviews, ratings, and key
              metrics.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
