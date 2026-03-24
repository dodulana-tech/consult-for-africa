"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EligibilityData {
  eligible: boolean;
  foundationComplete: number;
  specialistComplete: number;
  requiredFoundation: number;
  requiredSpecialist: number;
  completedTracks: { name: string; level: string; certifiedAt: string }[];
  reason?: string;
}

export default function ReapplyPage() {
  const router = useRouter();
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/talent/reapply")
      .then((res) => res.json())
      .then(setEligibility)
      .catch(() => setError("Failed to check eligibility"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/talent/reapply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter: coverLetter || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Submission failed");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#D1FAE5" }}>
          <CheckCircle size={28} style={{ color: "#059669" }} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Reapplication Submitted</h1>
        <p className="text-sm text-gray-600 mb-6">
          Thank you for reapplying. Our team will review your application and the progress
          you have made through the Academy. We will be in touch soon.
        </p>
        <Link
          href="/academy"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#0F2744", color: "#fff" }}
        >
          Back to Academy
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/academy"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={14} /> Back to Academy
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-2">Reapply to Consult For Africa</h1>
      <p className="text-sm text-gray-600 mb-6">
        Your Academy progress demonstrates your commitment to developing healthcare consulting
        capabilities. Complete the requirements below to unlock reapplication.
      </p>

      {/* Progress */}
      {eligibility && (
        <div className="rounded-xl p-5 bg-white mb-6" style={{ border: "1px solid #e5eaf0" }}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Eligibility Requirements
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {eligibility.foundationComplete >= eligibility.requiredFoundation ? (
                <CheckCircle size={16} style={{ color: "#059669" }} />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span className="text-sm text-gray-700">
                Complete at least {eligibility.requiredFoundation} Foundation track
                <span className="text-gray-400 ml-1">
                  ({eligibility.foundationComplete}/{eligibility.requiredFoundation})
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {eligibility.specialistComplete >= eligibility.requiredSpecialist ? (
                <CheckCircle size={16} style={{ color: "#059669" }} />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span className="text-sm text-gray-700">
                Complete at least {eligibility.requiredSpecialist} Specialist track
                <span className="text-gray-400 ml-1">
                  ({eligibility.specialistComplete}/{eligibility.requiredSpecialist})
                </span>
              </span>
            </div>
          </div>

          {eligibility.completedTracks?.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
              <p className="text-xs text-gray-400 mb-2">Completed certifications</p>
              <div className="flex flex-wrap gap-1.5">
                {eligibility.completedTracks.map((t) => (
                  <span
                    key={t.name}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      background: t.level === "FOUNDATION" ? "#EFF6FF" : "#F0FDF4",
                      color: t.level === "FOUNDATION" ? "#1D4ED8" : "#065F46",
                    }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reapply form */}
      {eligibility?.eligible ? (
        <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Reapplication
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tell us what has changed since your last application. What have you learned through
            the Academy, and how has your experience grown?
          </p>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={6}
            placeholder="Share your growth story..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744] resize-none mb-4"
            style={{ borderColor: "#e5eaf0" }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !coverLetter.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "#0F2744" }}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
            {submitting ? "Submitting..." : "Submit Reapplication"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl p-5 text-center" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
          <AlertTriangle size={20} className="mx-auto mb-2" style={{ color: "#D97706" }} />
          <p className="text-sm font-medium text-amber-800 mb-1">Not yet eligible</p>
          <p className="text-xs text-amber-700">
            Complete the Academy requirements above to unlock reapplication.
            {eligibility?.reason && ` ${eligibility.reason}`}
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-3 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}
    </div>
  );
}
