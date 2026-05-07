"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy, Loader2, Check, X, AlertTriangle } from "lucide-react";

interface SendResult {
  ok: boolean;
  sent: number;
  failed: number;
  total: number;
  errorSample: { email: string; error: string }[];
}

type Stage = "idle" | "confirming" | "sending" | "done" | "error";

export function RecoveryEmailButton() {
  const router = useRouter();
  const [stuckCount, setStuckCount] = useState<number | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/cadrehealth/send-recovery-emails")
      .then((r) => r.json())
      .then((data) => setStuckCount(data.stuckCount ?? 0))
      .catch(() => setStuckCount(null));
  }, []);

  async function send() {
    setStage("sending");
    setError(null);
    try {
      const res = await fetch("/api/admin/cadrehealth/send-recovery-emails", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setStage("error");
        return;
      }
      setResult(data);
      setStage("done");
      router.refresh();
    } catch {
      setError("Network error");
      setStage("error");
    }
  }

  // Hide button if there's no one to recover
  if (stuckCount === 0) return null;

  if (stage === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStage("confirming")}
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        style={{ backdropFilter: "blur(8px)" }}
        title="Send the recovery email to professionals who set a password but never successfully logged in"
      >
        <LifeBuoy className="h-3.5 w-3.5" />
        Recover stuck users
        {stuckCount !== null && stuckCount > 0 && (
          <span
            className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-300 px-1.5 text-[10px] font-bold text-amber-900"
          >
            {stuckCount}
          </span>
        )}
      </button>
    );
  }

  if (stage === "confirming" && stuckCount !== null) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm shadow-sm"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className="font-medium" style={{ color: "#0F2744" }}>
          Send recovery email to {stuckCount} user{stuckCount === 1 ? "" : "s"}?
        </span>
        <button
          type="button"
          onClick={() => setStage("idle")}
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={send}
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
          style={{ background: "#0B3C5D" }}
        >
          Send
        </button>
      </div>
    );
  }

  if (stage === "sending") {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-gray-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Sending {stuckCount} recovery email{stuckCount === 1 ? "" : "s"}...
      </span>
    );
  }

  if (stage === "done" && result) {
    return (
      <div className="flex flex-col gap-1 rounded-xl bg-white/95 px-4 py-2.5 text-sm shadow-sm">
        <div className="flex items-center gap-2">
          {result.failed === 0 ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          )}
          <span className="font-semibold" style={{ color: "#0F2744" }}>
            Sent {result.sent} of {result.total}{result.failed > 0 ? ` · ${result.failed} failed` : ""}
          </span>
          <button
            type="button"
            onClick={() => {
              setStage("idle");
              setResult(null);
            }}
            className="ml-1 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        {result.errorSample.length > 0 && (
          <p className="text-[11px] text-red-600">
            {result.errorSample[0].email}: {result.errorSample[0].error}
          </p>
        )}
      </div>
    );
  }

  // error
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
      <AlertTriangle className="h-3.5 w-3.5" />
      {error}
      <button
        type="button"
        onClick={() => {
          setStage("idle");
          setError(null);
        }}
        className="ml-1 rounded px-2 py-0.5 text-xs font-semibold hover:bg-red-100"
      >
        Dismiss
      </button>
    </div>
  );
}
