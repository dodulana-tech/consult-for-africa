"use client";

import { useState } from "react";
import { Mail, Loader2, Check, X } from "lucide-react";

type Stage = "idle" | "open" | "sending" | "sent" | "error";

export function PreviewSelfButton({ defaultEmail }: { defaultEmail?: string }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setStage("sending");
    setError(null);
    try {
      const res = await fetch("/api/cadre/outreach/preview-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStage("sent");
      } else {
        setError(data.error ?? "Send failed");
        setStage("error");
      }
    } catch {
      setError("Network error");
      setStage("error");
    }
  }

  if (stage === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStage("open")}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <Mail className="h-3.5 w-3.5" />
        Preview to me
      </button>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-xl bg-white/95 px-4 py-3 sm:flex-row sm:items-center"
      style={{ minWidth: 320, backdropFilter: "blur(8px)" }}
    >
      {stage === "sent" ? (
        <>
          <div className="flex flex-1 items-center gap-2 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" />
            Sent to {email}
          </div>
          <button
            type="button"
            onClick={() => {
              setStage("idle");
              setError(null);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Done
          </button>
        </>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={stage === "sending"}
            className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0B3C5D] disabled:opacity-50"
            style={{ borderColor: "#E5E7EB" }}
          />
          <button
            type="button"
            onClick={send}
            disabled={stage === "sending" || !email.includes("@")}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
            style={{ background: "#0B3C5D" }}
          >
            {stage === "sending" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
            {stage === "sending" ? "Sending..." : "Send preview"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("idle");
              setError(null);
            }}
            disabled={stage === "sending"}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {error && (
        <p className="basis-full text-xs text-red-600 sm:mt-1">{error}</p>
      )}
    </div>
  );
}
