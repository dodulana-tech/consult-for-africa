"use client";

import { useState, FormEvent } from "react";

export default function WhitepaperGate({ fileUrl }: { fileUrl: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function isWorkEmail(e: string) {
    const personal = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
      "aol.com", "icloud.com", "mail.com", "protonmail.com",
      "ymail.com", "live.com", "msn.com", "zoho.com",
    ];
    const domain = e.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    return !personal.includes(domain);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isWorkEmail(email)) {
      setError("Please use your work email, not a personal one.");
      return;
    }

    // Send to FormSubmit (or your own API)
    try {
      await fetch("https://formsubmit.co/ajax/hello@consultforafrica.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Whitepaper Download Request",
          email,
          source: "whitepaper_gate",
          downloadedFile: fileUrl,
        }),
      });
    } catch {
      // Don't block download if email submission fails
    }

    setSubmitted(true);

    // Trigger the download
    const link = document.createElement("a");
    link.href = fileUrl;
    link.target = "_blank";
    link.click();
  }

  if (submitted) {
    return (
      <div className="mt-5">
        <p className="text-sm text-green-700 font-medium">
          Download started. Check your browser downloads.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          We{"'"}ll send you related insights to {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="Work email"
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--brand-primary)] focus:outline-none"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        className="px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-lg text-sm font-semibold hover:shadow-md transition text-center whitespace-nowrap"
      >
        Download PDF
      </button>
    </form>
  );
}
