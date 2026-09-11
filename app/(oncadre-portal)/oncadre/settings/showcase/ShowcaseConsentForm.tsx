"use client";

import { useState } from "react";

interface Props {
  initialOptIn: boolean;
  /** What would actually appear in the email, built from their own profile. */
  previewLine: string;
  featuredBefore: boolean;
}

export default function ShowcaseConsentForm({ initialOptIn, previewLine, featuredBefore }: Props) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = async (next: boolean) => {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/cadre/showcase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showcaseOptIn: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save that");
      setOptIn(data.showcaseOptIn);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "#E8EBF0" }}>
      <div
        className="rounded-xl px-4 py-3"
        style={{ background: "#F8FAFC", border: "1px solid #E8EBF0" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0B3C5D" }}>
          Member of the week
        </p>
        <p className="mt-1 text-sm text-gray-700">{previewLine}</p>
        <p className="mt-2 text-xs text-gray-500">
          This is what the network would see. It comes from your profile, so anything you change there
          changes here.
        </p>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: optIn ? "#047857" : "#CBD5E1" }}
          aria-hidden
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {optIn ? "You are in the running to be featured" : "You are not in the running"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {optIn
              ? "We will let you know the week it runs. You can withdraw at any time and nothing further goes out."
              : "Nothing about you goes into the weekly email until you say yes here."}
          </p>
          {featuredBefore && (
            <p className="mt-1 text-xs text-gray-500">You have been featured before. Thank you.</p>
          )}
        </div>
      </div>

      {error && (
        <div
          className="mt-4 rounded-xl px-4 py-3 text-sm text-red-700"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          {error}
        </div>
      )}

      {saved && !error && (
        <div
          className="mt-4 rounded-xl px-4 py-3 text-sm text-emerald-800"
          style={{ background: "rgba(4,120,87,0.06)", border: "1px solid rgba(4,120,87,0.15)" }}
        >
          Saved.
        </div>
      )}

      <div className="mt-6">
        {optIn ? (
          <button
            type="button"
            onClick={() => set(false)}
            disabled={saving}
            className="w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 sm:w-auto sm:px-6"
            style={{ border: "1px solid #CBD5E1", color: "#334155", minHeight: "44px" }}
          >
            {saving ? "Saving..." : "Withdraw my consent"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => set(true)}
            disabled={saving}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 sm:w-auto sm:px-6"
            style={{
              background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
              boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
              minHeight: "44px",
            }}
          >
            {saving ? "Saving..." : "Yes, you may feature me"}
          </button>
        )}
      </div>
    </div>
  );
}
