"use client";

import { useState } from "react";
import Link from "next/link";
import { CADRE_OPTIONS } from "@/lib/cadreHealth/cadres";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface HospitalReviewFormProps {
  facilitySlug: string;
  facilityName: string;
  onSuccess: () => void;
}

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "LOCUM", label: "Locum" },
  { value: "NYSC", label: "NYSC" },
  { value: "HOUSE_OFFICER", label: "House Officer" },
  { value: "RESIDENCY", label: "Residency" },
];

const DIMENSION_RATINGS = [
  { key: "compensationRating", label: "Compensation", description: "Pay relative to workload and market" },
  { key: "payTimelinessRating", label: "Pay Timeliness", description: "Are you paid on time?" },
  { key: "workloadRating", label: "Workload", description: "Call duties, patient load, work-life balance" },
  { key: "equipmentRating", label: "Equipment", description: "Availability and condition of equipment" },
  { key: "managementRating", label: "Management", description: "Leadership quality and communication" },
  { key: "safetyRating", label: "Safety", description: "Staff safety, sharps, PPE, security" },
  { key: "trainingRating", label: "Training", description: "Learning opportunities and mentorship" },
  { key: "accommodationRating", label: "Accommodation", description: "Staff quarters, on-call rooms" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => currentYear - i);

/* ─── Star Rating Input ────────────────────────────────────────────────────── */

function StarInput({
  label,
  description,
  value,
  onChange,
  required,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {required && <span className="text-xs text-red-500">*</span>}
      </div>
      {description && (
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      )}
      <div className="mt-1.5 flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(value === star ? 0 : star)}
            className="rounded-md p-1 transition-transform hover:scale-110 active:scale-95"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              className={`h-8 w-8 sm:h-7 sm:w-7 transition-colors ${
                star <= (hovered || value)
                  ? "text-[#D4AF37]"
                  : "text-gray-300"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 self-center text-sm font-medium text-gray-600">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Form Component ───────────────────────────────────────────────────────── */

export default function HospitalReviewForm({
  facilitySlug,
  facilityName,
  onSuccess,
}: HospitalReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ratings
  const [overallRating, setOverallRating] = useState(0);
  const [dimensionRatings, setDimensionRatings] = useState<Record<string, number>>({});

  // Text content
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [advice, setAdvice] = useState("");

  // Context
  const [roleAtFacility, setRoleAtFacility] = useState("");
  const [cadreAtFacility, setCadreAtFacility] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [workedFromYear, setWorkedFromYear] = useState("");
  const [workedToYear, setWorkedToYear] = useState("");
  const [isCurrentEmployee, setIsCurrentEmployee] = useState(false);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const setDimensionRating = (key: string, value: number) => {
    setDimensionRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      setError("Please provide an overall rating.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        overallRating,
        pros: pros.trim() || null,
        cons: cons.trim() || null,
        advice: advice.trim() || null,
        wouldRecommend,
        roleAtFacility: roleAtFacility.trim() || null,
        cadreAtFacility: cadreAtFacility || null,
        employmentType: employmentType || null,
        workedFromYear: workedFromYear ? parseInt(workedFromYear) : null,
        workedToYear: workedToYear ? parseInt(workedToYear) : null,
        isCurrentEmployee,
      };

      // Add dimension ratings that are non-zero
      for (const dim of DIMENSION_RATINGS) {
        const val = dimensionRatings[dim.key];
        if (val && val > 0) {
          body[dim.key] = val;
        }
      }

      const res = await fetch(`/api/cadre/hospitals/${facilitySlug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError(
            "VERIFICATION_REQUIRED"
          );
          return;
        }
        throw new Error(data.error || "Failed to submit review");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review {facilityName}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your review is anonymous. Only verified professionals can submit reviews.
        </p>
      </div>

      {/* Error */}
      {error && error !== "VERIFICATION_REQUIRED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {error === "VERIFICATION_REQUIRED" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
          <h3 className="text-sm font-semibold text-amber-900">
            Verification Required
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            You must be CadreHealth Verified to submit reviews. Add your practicing license to get verified.
          </p>
          <Link
            href="/oncadre/profile#credentials"
            className="mt-3 inline-flex items-center rounded-lg bg-[#0B3C5D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0A3350]"
          >
            Add license details
          </Link>
        </div>
      )}

      {/* ─── Overall Rating ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <StarInput
          label="Overall Rating"
          description="How would you rate this facility overall?"
          value={overallRating}
          onChange={setOverallRating}
          required
        />
      </div>

      {/* ─── Dimension Ratings ─────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">Category Ratings</h3>
        <p className="mt-1 text-xs text-gray-500">Optional, but helps other professionals</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {DIMENSION_RATINGS.map((dim) => (
            <StarInput
              key={dim.key}
              label={dim.label}
              description={dim.description}
              value={dimensionRatings[dim.key] || 0}
              onChange={(v) => setDimensionRating(dim.key, v)}
            />
          ))}
        </div>
      </div>

      {/* ─── Written Review ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Your Experience</h3>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Pros
          </label>
          <textarea
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            rows={3}
            placeholder="What did you like about working here?"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Cons
          </label>
          <textarea
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            rows={3}
            placeholder="What could be improved?"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Advice to Management
          </label>
          <textarea
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            rows={3}
            placeholder="What would you tell the hospital management?"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>
      </div>

      {/* ─── Would Recommend ───────────────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Would you recommend this facility to a colleague?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setWouldRecommend(wouldRecommend === true ? null : true)}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition sm:flex-none sm:px-8 ${
              wouldRecommend === true
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(wouldRecommend === false ? null : false)}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition sm:flex-none sm:px-8 ${
              wouldRecommend === false
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* ─── Context Fields ────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">About Your Role</h3>
        <p className="mt-1 text-xs text-gray-500">
          Helps others find relevant reviews. All information stays anonymous.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Your role at this facility
            </label>
            <input
              type="text"
              value={roleAtFacility}
              onChange={(e) => setRoleAtFacility(e.target.value)}
              placeholder="e.g. Registrar, Senior Nursing Officer, Intern"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Cadre
              </label>
              <select
                value={cadreAtFacility}
                onChange={(e) => setCadreAtFacility(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                <option value="">Select cadre</option>
                {CADRE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Employment type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                <option value="">Select type</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Worked from (year)
              </label>
              <select
                value={workedFromYear}
                onChange={(e) => setWorkedFromYear(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              >
                <option value="">Select year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Worked to (year)
              </label>
              <select
                value={workedToYear}
                onChange={(e) => setWorkedToYear(e.target.value)}
                disabled={isCurrentEmployee}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D] disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {isCurrentEmployee ? "Present" : "Select year"}
                </option>
                {!isCurrentEmployee &&
                  YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Current employee toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isCurrentEmployee}
              onClick={() => {
                setIsCurrentEmployee(!isCurrentEmployee);
                if (!isCurrentEmployee) setWorkedToYear("");
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                isCurrentEmployee ? "bg-[#0B3C5D]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${
                  isCurrentEmployee ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">I currently work here</span>
          </label>
        </div>
      </div>

      {/* ─── Submit ────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading || overallRating === 0}
        className="w-full rounded-lg bg-[#D4AF37] py-3.5 text-base font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting review..." : "Submit Review"}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your review will be posted anonymously. We never share your identity.
      </p>
    </form>
  );
}
