"use client";

import { useState } from "react";

const CADRE_OPTIONS = [
  { value: "MEDICINE", label: "Medicine (Doctor)" },
  { value: "NURSING", label: "Nursing" },
  { value: "MIDWIFERY", label: "Midwifery" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "DENTISTRY", label: "Dentistry" },
  { value: "MEDICAL_LABORATORY_SCIENCE", label: "Medical Laboratory Science" },
  { value: "RADIOGRAPHY_IMAGING", label: "Radiography / Imaging" },
  { value: "REHABILITATION_THERAPY", label: "Rehabilitation Therapy" },
  { value: "OPTOMETRY", label: "Optometry" },
  { value: "COMMUNITY_HEALTH", label: "Community Health" },
  { value: "ENVIRONMENTAL_HEALTH", label: "Environmental Health" },
  { value: "NUTRITION_DIETETICS", label: "Nutrition / Dietetics" },
  { value: "PSYCHOLOGY_SOCIAL_WORK", label: "Psychology / Social Work" },
  { value: "PUBLIC_HEALTH", label: "Public Health" },
  { value: "HEALTH_RECORDS", label: "Health Records" },
  { value: "HOSPITAL_MANAGEMENT", label: "Hospital Management & Leadership" },
];

const CADRE_LABELS: Record<string, string> = Object.fromEntries(
  CADRE_OPTIONS.map((c) => [c.value, c.label])
);

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  cadre: string;
  subSpecialty: string | null;
  yearsOfExperience: number | null;
  state: string | null;
  city: string | null;
  accountStatus: string;
  availability: string | null;
  readinessScoreDomestic: number | null;
  profileCompleteness: number;
}

export default function EmployerSearchPage() {
  const [filters, setFilters] = useState({
    cadre: "",
    subSpecialty: "",
    state: "",
    minYears: "",
    maxYears: "",
    verifiedOnly: false,
  });
  const [results, setResults] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const updateFilter = (field: string, value: string | boolean) =>
    setFilters((prev) => ({ ...prev, [field]: value }));

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (filters.cadre) params.set("cadre", filters.cadre);
      if (filters.subSpecialty) params.set("subSpecialty", filters.subSpecialty);
      if (filters.state) params.set("state", filters.state);
      if (filters.minYears) params.set("minYears", filters.minYears);
      if (filters.maxYears) params.set("maxYears", filters.maxYears);
      if (filters.verifiedOnly) params.set("verifiedOnly", "true");

      const res = await fetch(`/api/cadre/employer/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.professionals || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (professionalId: string) => {
    setViewingId(professionalId);
    // Record profile view
    try {
      await fetch("/api/cadre/profile-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId }),
      });
    } catch {
      // silent fail
    }
  };

  const inputClass =
    "w-full rounded-xl bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20";
  const inputStyle = { border: "1px solid #E8EBF0" };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-bold text-gray-900"
          style={{ fontSize: "clamp(1.4rem, 3vw, 1.75rem)" }}
        >
          Search Professionals
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Find healthcare professionals by cadre, specialty, location, and more.
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="rounded-2xl bg-white p-6"
        style={{
          border: "1px solid #E8EBF0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cadre</label>
            <select
              value={filters.cadre}
              onChange={(e) => updateFilter("cadre", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">All Cadres</option>
              {CADRE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Sub-specialty</label>
            <input
              type="text"
              value={filters.subSpecialty}
              onChange={(e) => updateFilter("subSpecialty", e.target.value)}
              placeholder="e.g. Cardiology"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">State</label>
            <select
              value={filters.state}
              onChange={(e) => updateFilter("state", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">All States</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Min Years Experience</label>
            <input
              type="number"
              value={filters.minYears}
              onChange={(e) => updateFilter("minYears", e.target.value)}
              placeholder="0"
              min="0"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Max Years Experience</label>
            <input
              type="number"
              value={filters.maxYears}
              onChange={(e) => updateFilter("maxYears", e.target.value)}
              placeholder="50"
              min="0"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-2.5">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => updateFilter("verifiedOnly", e.target.checked)}
                className="rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
              />
              Verified only
            </label>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#0B3C5D" }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {results.length} professional{results.length !== 1 ? "s" : ""} found
          </p>

          {results.length === 0 ? (
            <div
              className="rounded-2xl bg-white p-10 text-center"
              style={{ border: "1px solid #E8EBF0" }}
            >
              <p className="text-gray-600 font-medium">No professionals match your criteria</p>
              <p className="mt-1 text-sm text-gray-400">Try broadening your filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((prof) => (
                <div
                  key={prof.id}
                  className="rounded-2xl bg-white p-5 transition-all duration-200 hover:scale-[1.005]"
                  style={{
                    border: "1px solid #E8EBF0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {prof.firstName} {prof.lastName}
                      </h3>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {CADRE_LABELS[prof.cadre] || prof.cadre}
                        {prof.subSpecialty ? ` / ${prof.subSpecialty}` : ""}
                      </p>
                    </div>
                    {prof.accountStatus === "VERIFIED" && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          color: "#059669",
                        }}
                      >
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    {prof.yearsOfExperience != null && (
                      <span
                        className="rounded-md px-2 py-0.5"
                        style={{ background: "#F8F9FB" }}
                      >
                        {prof.yearsOfExperience} yrs exp.
                      </span>
                    )}
                    {prof.state && (
                      <span
                        className="rounded-md px-2 py-0.5"
                        style={{ background: "#F8F9FB" }}
                      >
                        {prof.city ? `${prof.city}, ` : ""}{prof.state}
                      </span>
                    )}
                    {prof.availability && (
                      <span
                        className="rounded-md px-2 py-0.5"
                        style={{
                          background: prof.availability === "ACTIVELY_LOOKING"
                            ? "rgba(16,185,129,0.08)"
                            : "rgba(59,130,246,0.08)",
                          color: prof.availability === "ACTIVELY_LOOKING"
                            ? "#059669"
                            : "#2563EB",
                        }}
                      >
                        {prof.availability === "ACTIVELY_LOOKING" ? "Actively Looking" : "Open to Offers"}
                      </span>
                    )}
                  </div>

                  {prof.readinessScoreDomestic != null && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Readiness:</span>
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${prof.readinessScoreDomestic}%`,
                            background: prof.readinessScoreDomestic >= 70
                              ? "#10B981"
                              : prof.readinessScoreDomestic >= 50
                                ? "#F59E0B"
                                : "#EF4444",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {prof.readinessScoreDomestic}%
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleViewProfile(prof.id)}
                    className="mt-4 w-full rounded-lg py-2 text-xs font-semibold transition hover:opacity-90"
                    style={{
                      background: viewingId === prof.id ? "rgba(16,185,129,0.08)" : "rgba(11,60,93,0.06)",
                      color: viewingId === prof.id ? "#059669" : "#0B3C5D",
                    }}
                  >
                    {viewingId === prof.id ? "Interest Recorded" : "View Profile Summary"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
