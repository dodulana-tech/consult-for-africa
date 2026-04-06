"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OutreachBatchButton({ pendingCount }: { pendingCount: number }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const router = useRouter();

  async function handleSendBatch() {
    if (pendingCount === 0) return;

    const confirmed = window.confirm(
      `This will send WhatsApp messages to up to 50 professionals who are ready for outreach. Continue?`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/cadre/whatsapp/outreach-batch", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ sent: data.sent, failed: data.failed });
        router.refresh();
      } else {
        setResult({ sent: 0, failed: -1 });
      }
    } catch {
      setResult({ sent: 0, failed: -1 });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-gray-600">
          {result.failed === -1
            ? "Error sending batch"
            : `Sent: ${result.sent}, Failed: ${result.failed}`}
        </span>
      )}
      <button
        onClick={handleSendBatch}
        disabled={sending || pendingCount === 0}
        className="rounded-lg bg-[#0B3C5D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A3350] disabled:opacity-50"
      >
        {sending
          ? "Sending..."
          : `Start Outreach Batch (${pendingCount} ready)`}
      </button>
    </div>
  );
}
