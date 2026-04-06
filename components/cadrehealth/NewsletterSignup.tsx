"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/cadre/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe");
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <div
        className="mx-auto max-w-xl rounded-xl p-6 text-center"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
      >
        <svg className="mx-auto h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="mt-2 text-sm font-semibold text-emerald-700">You are subscribed.</p>
        <p className="mt-1 text-xs text-emerald-600">Look out for the first CadreHealth Report in your inbox.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="text-sm font-semibold text-white">
        Get the CadreHealth Report
      </p>
      <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        Career insights, salary data, and opportunities. Delivered monthly.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2 sm:mx-auto sm:max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="min-w-0 flex-1 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
          style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.2)" }}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold text-[#06090f] transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#D4AF37" }}
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </form>

      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}

      <p className="mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
