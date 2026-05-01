"use client";

import { useState } from "react";

const TOPIC_SUGGESTIONS = [
  "UK migration pathway",
  "US residency match strategy",
  "Fellowship application",
  "Career transition advice",
  "Leadership development",
  "Salary negotiation",
];

export default function BookingForm({ mentorId }: { mentorId: string }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBook = async () => {
    if (!topic.trim()) {
      setError("Please describe what you want to discuss");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cadre/coaching/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorProfileId: mentorId, topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book");
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: "#E8EBF0" }}>
      <label className="block">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">What would you like to discuss?</span>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Be specific. E.g. I am preparing for PLAB 2 and want guidance on station-by-station approach"
          rows={4}
          maxLength={300}
          className="mt-2 w-full rounded-xl border p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-opacity-50"
          style={{ borderColor: "#E8EBF0" }}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TOPIC_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTopic(s)}
            className="rounded-lg px-2.5 py-1 text-[10px] font-medium border transition hover:bg-gray-50"
            style={{ borderColor: "#E8EBF0", color: "#0B3C5D" }}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}

      <button
        onClick={handleBook}
        disabled={loading || !topic.trim()}
        className="mt-6 w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
      >
        {loading ? "Redirecting to payment..." : "Pay N5,000 and book session"}
      </button>
      <p className="mt-3 text-[10px] text-center text-gray-400">
        Secure payment via Paystack. Your mentor will be notified once payment is confirmed.
      </p>
    </div>
  );
}
