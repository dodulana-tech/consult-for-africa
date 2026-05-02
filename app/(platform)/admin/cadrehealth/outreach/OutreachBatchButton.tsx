"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";

type Channel = "EMAIL" | "WHATSAPP";

interface ReadyProfessional {
  id: string;
  firstName: string;
  lastName: string;
  cadre: string;
  state: string | null;
  tier: string | null;
  hasEmail: boolean;
  hasPhone: boolean;
}

interface BatchResult {
  sent: number;
  failed: number;
  total: number;
  channel: Channel;
  errorSample?: { professionalId: string; error: string }[];
}

const WHATSAPP_DISABLED = true;

export function OutreachBatchButton({ pendingCount }: { pendingCount: number }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [batchSize, setBatchSize] = useState(25);
  const [preview, setPreview] = useState<ReadyProfessional[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Load preview when panel opens, batch size, or channel changes
  useEffect(() => {
    if (!open) return;
    setLoadingPreview(true);
    fetch(`/api/cadre/outreach/preview?limit=${batchSize}&channel=${channel}`)
      .then((r) => r.json())
      .then((data) => {
        setPreview(data.professionals ?? []);
        setPreviewTotal(data.total ?? 0);
      })
      .catch(() => {
        setPreview([]);
        setPreviewTotal(0);
      })
      .finally(() => setLoadingPreview(false));
  }, [open, batchSize, channel]);

  async function handleSendBatch() {
    setSending(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/cadre/whatsapp/outreach-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize, channel }),
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

        {/* Channel selector */}
        <div className="border-b border-gray-100 px-6 py-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Channel</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setChannel("EMAIL")}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                channel === "EMAIL"
                  ? "border-[#0B3C5D] bg-[#0B3C5D]/5 ring-2 ring-[#0B3C5D]/10"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: channel === "EMAIL" ? "#0B3C5D" : "#9CA3AF" }} />
                <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>Email</span>
              </div>
              <span className="text-[11px] text-gray-500">Send via SMTP now</span>
            </button>
            <button
              onClick={() => !WHATSAPP_DISABLED && setChannel("WHATSAPP")}
              disabled={WHATSAPP_DISABLED}
              title={WHATSAPP_DISABLED ? "WhatsApp Business API not yet provisioned" : undefined}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                channel === "WHATSAPP"
                  ? "border-[#0B3C5D] bg-[#0B3C5D]/5 ring-2 ring-[#0B3C5D]/10"
                  : "border-gray-200 hover:bg-gray-50"
              } ${WHATSAPP_DISABLED ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" style={{ color: channel === "WHATSAPP" ? "#0B3C5D" : "#9CA3AF" }} />
                <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>WhatsApp</span>
                {WHATSAPP_DISABLED && (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                    Soon
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-500">Awaiting Business API</span>
            </button>
          </div>
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
            Will contact the {Math.min(batchSize, previewTotal)} oldest READY professionals with a valid {channel === "EMAIL" ? "email address" : "phone number"}, prioritizing Tier A.
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
              <p className="text-sm text-gray-400">
                No professionals ready for {channel === "EMAIL" ? "email" : "WhatsApp"} outreach.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {preview.map((p) => {
                const channelOk = channel === "EMAIL" ? p.hasEmail : p.hasPhone;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "rgba(15,39,68,0.02)", border: "1px solid rgba(15,39,68,0.04)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.cadre.replace(/_/g, " ")} {p.state ? `· ${p.state}` : ""}
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
                      <span title="Email available" className={p.hasEmail ? "text-emerald-500" : "text-gray-300"}>
                        <Mail className="h-3.5 w-3.5" />
                      </span>
                      <span title="Phone available" className={p.hasPhone ? "text-emerald-500" : "text-gray-300"}>
                        <MessageCircle className="h-3.5 w-3.5" />
                      </span>
                      {!channelOk && (
                        <span className="text-[10px] font-semibold text-amber-600">missing</span>
                      )}
                    </div>
                  </div>
                );
              })}
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
            <div
              className={`mb-3 rounded-xl px-4 py-3 ring-1 ${
                result.failed === 0
                  ? "bg-emerald-50 ring-emerald-200"
                  : result.sent === 0
                    ? "bg-red-50 ring-red-200"
                    : "bg-amber-50 ring-amber-200"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  result.failed === 0
                    ? "text-emerald-800"
                    : result.sent === 0
                      ? "text-red-800"
                      : "text-amber-800"
                }`}
              >
                Batch complete ({result.channel === "EMAIL" ? "Email" : "WhatsApp"})
              </p>
              <div
                className={`mt-1 flex gap-4 text-xs ${
                  result.failed === 0
                    ? "text-emerald-700"
                    : result.sent === 0
                      ? "text-red-700"
                      : "text-amber-700"
                }`}
              >
                <span>Sent: {result.sent}</span>
                <span>Failed: {result.failed}</span>
                <span>Total: {result.total}</span>
              </div>
              {result.errorSample && result.errorSample.length > 0 && (
                <div className="mt-2 rounded-lg bg-white/60 p-2">
                  <p className="text-[11px] font-semibold text-gray-700">
                    Sample failure{result.errorSample.length === 1 ? "" : "s"}:
                  </p>
                  <ul className="mt-1 space-y-1 text-[11px] text-gray-600">
                    {result.errorSample.map((e, i) => (
                      <li key={i} className="break-words">
                        {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                    Send {channel === "EMAIL" ? "Email" : "WhatsApp"} to {Math.min(batchSize, preview.length)}
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
