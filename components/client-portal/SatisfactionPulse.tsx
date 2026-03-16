"use client";

import { useEffect, useState } from "react";

interface PulseData {
  score: number;
  feedback: string | null;
  period: string;
}

export default function SatisfactionPulse({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [existingPulse, setExistingPulse] = useState<PulseData | null>(null);
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkPulse() {
      try {
        const res = await fetch(
          `/api/client-portal/projects/${projectId}/satisfaction`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.submitted) {
            setSubmitted(true);
            setExistingPulse(data.pulse);
          }
        }
      } catch {
        // Silently fail - component is optional
      } finally {
        setLoading(false);
      }
    }
    checkPulse();
  }, [projectId]);

  async function handleSubmit() {
    if (score === 0) {
      setError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(
        `/api/client-portal/projects/${projectId}/satisfaction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score,
            feedback: feedback.trim() || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
      setExistingPulse({ score, feedback: feedback.trim() || null, period: "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ border: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="h-4 bg-gray-100 rounded w-32 mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  // Already submitted this month
  if (submitted && existingPulse) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ border: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#15803D"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-semibold" style={{ color: "#15803D" }}>
            Thank you for your feedback
          </span>
        </div>
        <div className="flex gap-1.5 mb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background:
                  i <= existingPulse.score ? "#D4AF37" : "#F3F4F6",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={i <= existingPulse.score ? "#fff" : "#D1D5DB"}
                stroke="none"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">
          You rated {existingPulse.score}/5 this month
        </p>
      </div>
    );
  }

  // Rating form
  return (
    <div
      className="rounded-2xl p-5"
      style={{ border: "1px solid #e5eaf0", background: "#fff" }}
    >
      <h4
        className="text-xs font-semibold mb-1"
        style={{ color: "#0F2744" }}
      >
        Monthly Satisfaction Pulse
      </h4>
      <p className="text-[11px] text-gray-400 mb-3">
        How satisfied are you with this engagement?
      </p>

      {/* Star Rating */}
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3, 4, 5].map((i) => {
          const active = i <= (hovered || score);
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setScore(i);
                if (error) setError("");
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: active ? "#D4AF37" : "#F3F4F6",
                cursor: "pointer",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={active ? "#fff" : "#D1D5DB"}
                stroke="none"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
        {score > 0 && (
          <span className="text-[11px] text-gray-400 self-center ml-1">
            {score}/5
          </span>
        )}
      </div>

      {/* Feedback */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Any additional feedback? (optional)"
        rows={2}
        className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none mb-3"
        style={{
          border: "1px solid #e5eaf0",
          color: "#0F2744",
          background: "#F8FAFB",
        }}
      />

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-600 font-medium mb-2">{error}</p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || score === 0}
        className="w-full text-xs font-semibold py-2 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "#0F2744", color: "#fff" }}
      >
        {submitting ? "Submitting..." : "Submit Rating"}
      </button>
    </div>
  );
}
