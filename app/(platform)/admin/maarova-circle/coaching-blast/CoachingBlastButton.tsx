"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CoachingBlastButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBlast = async () => {
    if (pendingCount === 0) return;
    if (!confirm(`Send the coaching opening email to ${pendingCount} Founding Circle members?`)) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/maarova-circle/coaching-blast", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult({ sent: data.sent, total: data.total });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleBlast}
        disabled={sending || pendingCount === 0}
        className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #0F2744, #1a3a55)" }}
      >
        {sending ? "Sending..." : pendingCount === 0 ? "No pending recipients" : `Send to ${pendingCount} members`}
      </button>
      {result && (
        <p className="mt-3 text-sm text-green-700">Sent to {result.sent} of {result.total} recipients.</p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
