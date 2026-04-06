"use client";

import { useState, useEffect } from "react";

const PROGRESS_MESSAGES = [
  "Reviewing your credentials and qualifications...",
  "Benchmarking against peers in your cadre...",
  "Analyzing compensation data for your region...",
  "Evaluating international readiness pathways...",
  "Identifying skills gaps and growth opportunities...",
  "Generating personalized recommendations...",
];

export default function GenerateReport({ hasExisting }: { hasExisting: boolean }) {
  const [generating, setGenerating] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setProgressIdx((prev) => Math.min(prev + 1, PROGRESS_MESSAGES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgressIdx(0);
    setError(null);

    try {
      const res = await fetch("/api/cadre/career-assessment", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }

      // Refresh page to show the report
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-white px-6 py-16" style={{ borderColor: "#E8EBF0" }}>
        <div className="relative mb-8">
          <div className="h-20 w-20 rounded-full" style={{ border: "3px solid #E8EBF0" }} />
          <div
            className="absolute inset-0 h-20 w-20 animate-spin rounded-full"
            style={{
              border: "3px solid transparent",
              borderTopColor: "#D4AF37",
              borderRightColor: "#D4AF37",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-8 w-8" style={{ color: "#0B3C5D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900">Generating your Career Intelligence Report</h3>
        <p className="mt-2 text-sm text-gray-500">This usually takes 15-30 seconds</p>

        <div className="mt-8 w-full max-w-md space-y-3">
          {PROGRESS_MESSAGES.map((msg, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < progressIdx ? (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "#dcfce7" }}>
                  <svg className="h-3.5 w-3.5" style={{ color: "#16a34a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : i === progressIdx ? (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                  <div className="h-3 w-3 animate-pulse rounded-full" style={{ background: "#D4AF37" }} />
                </div>
              ) : (
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                  <div className="h-2 w-2 rounded-full" style={{ background: "#E8EBF0" }} />
                </div>
              )}
              <span className={`text-sm ${i <= progressIdx ? "font-medium text-gray-700" : "text-gray-400"}`}>
                {msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasExisting) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-white px-6 py-16" style={{ borderColor: "#E8EBF0" }}>
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, #0B3C5D10, #D4AF3715)" }}
        >
          <svg className="h-10 w-10" style={{ color: "#0B3C5D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Career Intelligence Report</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-gray-500">
          Get a comprehensive analysis of your career positioning, compensation benchmarks,
          skills gaps, and personalized growth pathways based on your professional profile.
        </p>

        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            title="Market Position"
            desc="See how you rank among peers in your cadre and location"
          />
          <FeatureCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
              </svg>
            }
            title="Salary Benchmarks"
            desc="Understand your compensation relative to the market"
          />
          <FeatureCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="Growth Roadmap"
            desc="Get a prioritized action plan for career advancement"
          />
        </div>

        <button
          onClick={handleGenerate}
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
          style={{
            background: "linear-gradient(135deg, #0B3C5D, #0d4a73)",
            boxShadow: "0 4px 14px rgba(11, 60, 93, 0.3)",
          }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate My Report
        </button>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </div>
    );
  }

  // Has existing report, show refresh button
  return (
    <div className="flex items-center justify-between">
      <div />
      <button
        onClick={handleGenerate}
        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Generate New Report
      </button>
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border p-4 text-center" style={{ borderColor: "#E8EBF0" }}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#D4AF3715", color: "#D4AF37" }}>
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </div>
  );
}
