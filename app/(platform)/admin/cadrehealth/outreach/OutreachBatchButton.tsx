"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ReadyProfessional {
  id: string;
  firstName: string;
  lastName: string;
  cadre: string;
  state: string | null;
  tier: string | null;
  phone: string | null;
}

interface BatchResult {
  sent: number;
  failed: number;
  total: number;
}

export function OutreachBatchButton({ pendingCount }: { pendingCount: number }) {
  const [open, setOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(25);
  const [preview, setPreview] = useState<ReadyProfessional[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Load preview when panel opens or batch size changes
  useEffect(() => {
    if (!open) return;
    setLoadingPreview(true);
    fetch(`/api/cadre/outreach/preview?limit=${batchSize}`)
      .then((r) => r.json())
      .then((data) => setPreview(data.professionals ?? []))
      .catch(() => setPreview([]))
      .finally(() => setLoadingPreview(false));
  }, [open, batchSize]);

  async function handleSendBatch() {
    setSending(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/cadre/whatsapp/outreach-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        router.refresh();
      } else {
        setError(data.error || "Failed to send batch");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={pendingCount === 0}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-md disabled:opacity-50"
        style={{ background: pendingCount > 0 ? "linear-gradient(135deg, #0B3C5D, #1a5a8a)" : "#9CA3AF" }}
      >
        {pendingCount === 0
          ? "No professionals ready"
          : `Start Outreach Batch (${pendingCount.toLocaleString()} ready)`}
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        style={{ backdropFilter: "blur(4px)" }}
        onClick={() => !sending && setOpen(false)}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#0F2744" }}>
              Outreach Batch
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {pendingCount.toLocaleString()} professionals ready for outreach
            </p>
          </div>
          <button
            onClick={() => !sending && setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Batch size selector */}
        <div className="border-b border-gray-100 px-6 py-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Batch size
          </label>
          <div className="flex gap-2">
            {[10, 25, 50, 100, 200].map((size) => (
              <button
                key={size}
                onClick={() => setBatchSize(size)}
                disabled={size > pendingCount}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  batchSize === size
                    ? "bg-[#0B3C5D] text-white shadow-sm"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Will contact the {Math.min(batchSize, pendingCount)} oldest READY professionals, prioritizing Tier A
          </p>
        </div>

        {/* Preview list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Preview ({Math.min(batchSize, preview.length)} professionals)
            </h3>
            {loadingPreview && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#0B3C5D]" />
            )}
          </div>

          {preview.length === 0 && !loadingPreview ? (
            <div className="rounded-xl py-8 text-center" style={{ background: "rgba(15,39,68,0.02)" }}>
              <p className="text-sm text-gray-400">No professionals ready for outreach</p>
            </div>
          ) : (
            <div className="space-y-2">
              {preview.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: "rgba(15,39,68,0.02)", border: "1px solid rgba(15,39,68,0.04)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.cadre.replace(/_/g, " ")} {p.state ? `- ${p.state}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.tier && (
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          background: p.tier === "A" ? "rgba(5,150,105,0.08)" : p.tier === "B" ? "rgba(37,99,235,0.08)" : "rgba(156,163,175,0.15)",
                          color: p.tier === "A" ? "#059669" : p.tier === "B" ? "#2563EB" : "#6B7280",
                        }}
                      >
                        Tier {p.tier}
                      </span>
                    )}
                    {p.phone ? (
                      <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with results + action */}
        <div className="border-t border-gray-100 px-6 py-4">
          {error && (
            <div className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
              <p className="text-sm font-semibold text-emerald-800">Batch complete</p>
              <div className="mt-1 flex gap-4 text-xs text-emerald-700">
                <span>Sent: {result.sent}</span>
                <span>Failed: {result.failed}</span>
                <span>Total: {result.total}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setOpen(false)}
              disabled={sending}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button
                onClick={handleSendBatch}
                disabled={sending || preview.length === 0}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-md disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #0B3C5D, #1a5a8a)" }}
              >
                {sending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send to {Math.min(batchSize, preview.length)} professionals
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
