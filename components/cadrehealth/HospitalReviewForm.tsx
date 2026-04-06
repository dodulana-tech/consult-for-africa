"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { CADRE_OPTIONS } from "@/lib/cadreHealth/cadres";
import {
  REVIEW_DIMENSIONS,
  CATEGORY_DIMENSIONS,
  BINARY_QUESTION_MAP,
  type ReviewSubQuestion,
  type ReviewDimension,
} from "@/lib/cadreHealth/reviewDimensions";

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

const SCALE_OPTIONS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
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
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {required && <span className="text-xs text-red-500">*</span>}
      </div>
      {description && (
        <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{description}</p>
      )}
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(value === star ? 0 : star)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              className={`h-8 w-8 transition-colors ${
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
          <span className="ml-2 self-center text-sm font-semibold text-gray-600">
            {value}/5
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-Question Components ──────────────────────────────────────────────── */

function ScaleQuestion({
  question,
  value,
  onChange,
}: {
  question: ReviewSubQuestion;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">{question.text}</p>
      {question.helpText && (
        <p className="text-xs text-gray-400">{question.helpText}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {SCALE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
              value === opt.value
                ? "border-[#0B3C5D] bg-[#0B3C5D] text-white"
                : "border-[#E8EBF0] bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function YesNoQuestion({
  question,
  value,
  onChange,
}: {
  question: ReviewSubQuestion;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">{question.text}</p>
      {question.helpText && (
        <p className="text-xs text-gray-400">{question.helpText}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-lg border-2 px-5 py-2 text-sm font-medium transition ${
            value === true
              ? "border-[#0B3C5D] bg-[#0B3C5D]/5 text-[#0B3C5D]"
              : "border-[#E8EBF0] bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-lg border-2 px-5 py-2 text-sm font-medium transition ${
            value === false
              ? "border-[#0B3C5D] bg-[#0B3C5D]/5 text-[#0B3C5D]"
              : "border-[#E8EBF0] bg-white text-gray-600 hover:border-gray-300"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function ChoiceQuestion({
  question,
  value,
  onChange,
}: {
  question: ReviewSubQuestion;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  const options = question.options ?? [];
  const CHOICE_LABELS: Record<string, string> = {
    "ALWAYS": "Always",
    "SOMETIMES": "Sometimes",
    "NEVER": "Never",
    "YES": "Yes",
    "NO": "No",
    "DEPENDS": "It depends",
    "WITH_RESERVATIONS": "With reservations",
    "IMPROVING": "Improving",
    "SAME": "About the same",
    "DECLINING": "Declining",
    "<12hrs": "Under 12 hours",
    "12-24hrs": "12 to 24 hours",
    "24-36hrs": "24 to 36 hours",
    "36hrs+": "Over 36 hours",
    "0": "No delay",
    "1-2": "1 to 2 months",
    "3-5": "3 to 5 months",
    "6+": "Over 6 months",
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">{question.text}</p>
      {question.helpText && (
        <p className="text-xs text-gray-400">{question.helpText}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-lg border px-4 py-2 text-xs font-medium transition ${
              value === opt
                ? "border-[#0B3C5D] bg-[#0B3C5D] text-white"
                : "border-[#E8EBF0] bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {CHOICE_LABELS[opt] ?? opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: ReviewSubQuestion;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">{question.text}</p>
      {question.helpText && (
        <p className="text-xs text-gray-400">{question.helpText}</p>
      )}
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
      />
    </div>
  );
}

/* ─── Dimension Section ────────────────────────────────────────────────────── */

function DimensionSection({
  dimension,
  rating,
  onRatingChange,
  detailedResponses,
  onDetailedResponseChange,
  isExpanded,
  onToggleExpand,
  isSensitive,
}: {
  dimension: ReviewDimension;
  rating: number;
  onRatingChange: (v: number) => void;
  detailedResponses: Record<string, unknown>;
  onDetailedResponseChange: (questionId: string, value: unknown) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSensitive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E8EBF0] bg-white overflow-hidden transition-shadow hover:shadow-sm">
      {/* Header with star rating */}
      <div className="p-5">
        <StarInput
          label={dimension.label}
          description={dimension.description}
          value={rating}
          onChange={onRatingChange}
          required={dimension.key === "overall"}
        />

        {/* Expand/collapse sub-questions */}
        {dimension.subQuestions.length > 0 && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#0B3C5D] transition hover:text-[#0B3C5D]/80"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {isExpanded ? "Hide detailed questions" : "Add detailed responses"}
          </button>
        )}
      </div>

      {/* Expanded sub-questions */}
      {isExpanded && dimension.subQuestions.length > 0 && (
        <div className="border-t border-[#E8EBF0] bg-[#F8F9FB] p-5 space-y-5">
          {isSensitive && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-700 leading-relaxed">
                Your responses are completely anonymous and help identify systemic issues.
                We never share individual responses with facility management.
              </p>
            </div>
          )}

          {dimension.subQuestions.map((q) => {
            const val = detailedResponses[q.id];

            switch (q.type) {
              case "SCALE":
                return (
                  <ScaleQuestion
                    key={q.id}
                    question={q}
                    value={val as number | undefined}
                    onChange={(v) => onDetailedResponseChange(q.id, v)}
                  />
                );
              case "YES_NO":
                return (
                  <YesNoQuestion
                    key={q.id}
                    question={q}
                    value={val as boolean | undefined}
                    onChange={(v) => onDetailedResponseChange(q.id, v)}
                  />
                );
              case "CHOICE":
                return (
                  <ChoiceQuestion
                    key={q.id}
                    question={q}
                    value={val as string | undefined}
                    onChange={(v) => onDetailedResponseChange(q.id, v)}
                  />
                );
              case "TEXT":
                return (
                  <TextQuestion
                    key={q.id}
                    question={q}
                    value={val as string | undefined}
                    onChange={(v) => onDetailedResponseChange(q.id, v)}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Progress Indicator ───────────────────────────────────────────────────── */

function ProgressBar({ rated, total }: { rated: number; total: number }) {
  const pct = Math.round((rated / total) * 100);

  return (
    <div className="sticky top-0 z-10 border-b border-[#E8EBF0] bg-white/95 backdrop-blur-sm px-1 py-3">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
        <span>
          {rated} of {total} dimensions rated
        </span>
        <span className="font-medium text-[#0B3C5D]">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Main Form Component ──────────────────────────────────────────────────── */

export default function HospitalReviewForm({
  facilitySlug,
  facilityName,
  onSuccess,
}: HospitalReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dimension ratings (key = ratingField name, value = 1-5)
  const [dimensionRatings, setDimensionRatings] = useState<Record<string, number>>({});

  // Detailed sub-question responses (key = question ID)
  const [detailedResponses, setDetailedResponses] = useState<Record<string, unknown>>({});

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

  const setDimensionRating = useCallback((field: string, value: number) => {
    setDimensionRatings((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setDetailedResponse = useCallback((questionId: string, value: unknown) => {
    setDetailedResponses((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Count rated dimensions
  const ratedCount = useMemo(
    () => REVIEW_DIMENSIONS.filter((d) => (dimensionRatings[d.ratingField] ?? 0) > 0).length,
    [dimensionRatings]
  );

  // Check if any detailed responses exist
  const hasDetailedResponses = useMemo(
    () => Object.keys(detailedResponses).length > 0,
    [detailedResponses]
  );

  const overallRating = dimensionRatings["overallRating"] ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      setError("Please provide an overall rating in the Overall & Recommendation section.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Build the body with all dimension ratings
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
        isDetailedReview: hasDetailedResponses,
      };

      // Add dimension ratings
      for (const dim of REVIEW_DIMENSIONS) {
        const val = dimensionRatings[dim.ratingField];
        if (val && val > 0 && dim.ratingField !== "overallRating") {
          body[dim.ratingField] = val;
        }
      }

      // Extract binary question values from detailed responses
      for (const [questionId, dbField] of Object.entries(BINARY_QUESTION_MAP)) {
        const val = detailedResponses[questionId];
        if (val !== undefined) {
          body[dbField] = val;
        }
      }

      // Add all detailed responses as JSON
      if (hasDetailedResponses) {
        body.detailedResponses = detailedResponses;
      }

      const res = await fetch(`/api/cadre/hospitals/${facilitySlug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError("VERIFICATION_REQUIRED");
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

  // Sensitive dimensions that need the anonymity notice
  const sensitiveDimensions = new Set(["fairness", "safety"]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review {facilityName}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your review is anonymous. Only verified professionals can submit reviews.
          Rate each dimension with stars, then optionally expand for detailed questions.
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

      {/* Progress indicator */}
      <ProgressBar rated={ratedCount} total={REVIEW_DIMENSIONS.length} />

      {/* ─── Dimension Ratings ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {REVIEW_DIMENSIONS.map((dim) => (
          <DimensionSection
            key={dim.key}
            dimension={dim}
            rating={dimensionRatings[dim.ratingField] ?? 0}
            onRatingChange={(v) => setDimensionRating(dim.ratingField, v)}
            detailedResponses={detailedResponses}
            onDetailedResponseChange={setDetailedResponse}
            isExpanded={expandedSections.has(dim.key)}
            onToggleExpand={() => toggleSection(dim.key)}
            isSensitive={sensitiveDimensions.has(dim.key)}
          />
        ))}
      </div>

      {/* ─── Written Review ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8EBF0] bg-white p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Your Experience</h3>
        <p className="text-xs text-gray-400">
          Free-text responses help colleagues understand the nuances of working here
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            What do you like about working here?
          </label>
          <textarea
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            rows={3}
            placeholder="Share the positives of your experience"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            What could be improved?
          </label>
          <textarea
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            rows={3}
            placeholder="What needs to change?"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Advice to someone considering this facility
          </label>
          <textarea
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            rows={3}
            placeholder="What would you tell a colleague thinking of joining?"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          />
        </div>
      </div>

      {/* ─── Would Recommend ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#E8EBF0] bg-white p-5">
        <label className="mb-3 block text-sm font-semibold text-gray-800">
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
      <div className="rounded-xl border border-[#E8EBF0] bg-white p-5">
        <h3 className="text-base font-semibold text-gray-900">About Your Role</h3>
        <p className="mt-1 text-xs text-gray-400">
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
