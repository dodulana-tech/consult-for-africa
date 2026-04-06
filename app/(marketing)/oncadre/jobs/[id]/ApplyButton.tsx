"use client";

import { useState } from "react";

export default function ApplyButton({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleApply = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/cadre/jobs/${jobId}/apply`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(16,185,129,0.1)" }}
        >
          <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-3 font-semibold text-gray-900">Application Submitted</p>
        <p className="mt-1 text-sm text-gray-500">
          We will be in touch if there is a match.
        </p>
      </div>
    );
  }

  return (
    <div>
      {errorMsg && (
        <div
          className="mb-3 rounded-lg px-3 py-2 text-xs text-red-700"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          {errorMsg}
        </div>
      )}
      <button
        onClick={handleApply}
        disabled={status === "loading"}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 hover:scale-[1.01] disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
          boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
        }}
      >
        {status === "loading" ? "Submitting..." : "Apply for this Role"}
      </button>
    </div>
  );
}
