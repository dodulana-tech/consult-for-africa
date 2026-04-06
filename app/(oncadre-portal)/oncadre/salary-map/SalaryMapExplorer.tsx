"use client";

import { useState, useEffect, useCallback } from "react";
import { CADRE_OPTIONS, NIGERIAN_STATES, getCadreLabel } from "@/lib/cadreHealth/cadres";
import ShareButtons from "@/components/cadrehealth/ShareButtons";

const FACILITY_TYPE_OPTIONS = [
  { value: "", label: "All facility types" },
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

interface SalarySummary {
  cadre: string;
  state: string;
  count: number;
  medianSalary: number;
  minSalary: number;
  maxSalary: number;
  paidOnTimePct: number | null;
}

interface SalaryResponse {
  locked: boolean;
  summary?: SalarySummary[];
  totalReports?: number;
}

function formatCurrency(amount: number): string {
  return "\u20A6" + amount.toLocaleString();
}

export default function SalaryMapExplorer({
  defaultCadre,
}: {
  defaultCadre: string;
}) {
  const [cadre, setCadre] = useState(defaultCadre);
  const [state, setState] = useState("");
  const [facilityType, setFacilityType] = useState("");
  const [data, setData] = useState<SalaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cadre) params.set("cadre", cadre);
      if (state) params.set("state", state);
      if (facilityType) params.set("facilityType", facilityType);

      const res = await fetch(`/api/cadre/salary?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [cadre, state, facilityType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Cadre
            </label>
            <select
              value={cadre}
              onChange={(e) => setCadre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              <option value="">All cadres</option>
              {CADRE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              <option value="">All states</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Facility type
            </label>
            <select
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              {FACILITY_TYPE_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0B3C5D]" />
        </div>
      ) : !data || !data.summary || data.summary.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">
            No salary data matches your filters yet. As more professionals
            contribute, the map will fill in.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stat */}
          <p className="text-sm text-gray-500">
            Showing {data.summary.length} group{data.summary.length !== 1 ? "s" : ""}{" "}
            from {data.totalReports} report{data.totalReports !== 1 ? "s" : ""}
          </p>

          {/* Desktop table - hidden on mobile */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Cadre
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    State
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">
                    Median
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">
                    Min
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">
                    Max
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">
                    Sample
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">
                    Paid on time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.summary.map((row, i) => (
                  <tr
                    key={`${row.cadre}-${row.state}-${i}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {getCadreLabel(row.cadre)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{row.state}</td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0B3C5D]">
                      {formatCurrency(row.medianSalary)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {formatCurrency(row.minSalary)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {formatCurrency(row.maxSalary)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {row.count}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.paidOnTimePct !== null ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            row.paidOnTimePct >= 70
                              ? "bg-emerald-100 text-emerald-700"
                              : row.paidOnTimePct >= 40
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.paidOnTimePct}%
                        </span>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Share salary data */}
          <div className="rounded-xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
            <ShareButtons
              title="Share"
              text="Check out anonymous salary data for Nigerian healthcare professionals on CadreHealth"
              url={typeof window !== "undefined" ? window.location.href : "https://consultforafrica.com/oncadre/salary-map"}
            />
          </div>

          {/* Mobile cards - hidden on desktop */}
          <div className="space-y-4 sm:hidden">
            {data.summary.map((row, i) => (
              <div
                key={`m-${row.cadre}-${row.state}-${i}`}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getCadreLabel(row.cadre)}
                    </h3>
                    <p className="text-sm text-gray-500">{row.state}</p>
                  </div>
                  {row.paidOnTimePct !== null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        row.paidOnTimePct >= 70
                          ? "bg-emerald-100 text-emerald-700"
                          : row.paidOnTimePct >= 40
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {row.paidOnTimePct}% on time
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#0B3C5D]">
                    {formatCurrency(row.medianSalary)}
                  </span>
                  <span className="text-xs text-gray-400">median</span>
                </div>

                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>
                    Min: {formatCurrency(row.minSalary)}
                  </span>
                  <span>
                    Max: {formatCurrency(row.maxSalary)}
                  </span>
                  <span>
                    {row.count} report{row.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
