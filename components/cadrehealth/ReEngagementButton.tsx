"use client";

/**
 * Re-engagement control for the CadreHealth admin page.
 *
 * The cohort is ~9.6k people, sent 300 at a time, so this is not a single
 * "send" button: it is a drain you work through over several clicks and come
 * back to next month. The panel therefore shows how many are due, how many
 * runs that implies, and what is being excluded, rather than one bare count.
 *
 * Reads the GET contract from /api/admin/cadrehealth/send-reengagement-emails:
 *   { dueNow, everStuck, suppressed, overContacted, batchSize, runsToDrain,
 *     cooldownDays }
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check, X, AlertTriangle, Eye } from "lucide-react";

interface Stats {
  dueNow: number;
  everStuck: number;
  suppressed: number;
  overContacted: number;
  batchSize: number;
  runsToDrain: number;
  cooldownDays: number;
}

interface SendResult {
  ok: boolean;
  sent: number;
  failed: number;
  skippedSuppressed: number;
  total: number;
  remaining: number;
  runsLeft: number;
  errorSample: { email: string; error: string }[];
}

interface DryRunResult {
  ok: boolean;
  dryRun: true;
  wouldSend: number;
  remainingAfterThisBatch: number;
  sample: { name: string; email: string }[];
}

type Stage = "idle" | "confirming" | "previewing" | "sending" | "done" | "error";

const ENDPOINT = "/api/admin/cadrehealth/send-reengagement-emails";

export function ReEngagementButton() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<SendResult | null>(null);
  const [preview, setPreview] = useState<DryRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    fetch(ENDPOINT)
      .then((r) => r.json())
      .then((data) => setStats(data?.dueNow === undefined ? null : data))
      .catch(() => setStats(null));
  }, []);

  useEffect(loadStats, [loadStats]);

  async function runPreview() {
    setStage("previewing");
    setError(null);
    try {
      const res = await fetch(`${ENDPOINT}?dryRun=1`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setStage("error");
        return;
      }
      setPreview(data);
      setStage("confirming");
    } catch {
      setError("Network error");
      setStage("error");
    }
  }

  async function send() {
    setStage("sending");
    setError(null);
    setPreview(null);
    try {
      const res = await fetch(ENDPOINT, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setStage("error");
        return;
      }
      setResult(data);
      setStage("done");
      loadStats();
      router.refresh();
    } catch {
      setError("Network error");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setResult(null);
    setPreview(null);
    setError(null);
  }

  // Nothing has ever been emailed, so there is nothing to re-engage.
  if (stats && stats.dueNow === 0 && stats.everStuck === 0) return null;
  if (!stats && stage === "idle") return null;

  // Everyone due has been contacted; the rest are inside the cooldown window.
  if (stats && stats.dueNow === 0 && stage === "idle") {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white/60"
        title={`All ${stats.everStuck} unclaimed users were contacted within the last ${stats.cooldownDays} days`}
      >
        <Check className="h-3.5 w-3.5" />
        Re-engagement up to date
        <span className="text-white/40">
          {stats.everStuck} in {stats.cooldownDays}-day cooldown
        </span>
      </span>
    );
  }

  if (stage === "idle" && stats) {
    return (
      <button
        type="button"
        onClick={() => setStage("confirming")}
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        style={{ backdropFilter: "blur(8px)" }}
        title="Email professionals who got the original outreach but never claimed their profile"
      >
        <Send className="h-3.5 w-3.5" />
        Re-engage emailed users
        <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-300 px-1.5 text-[10px] font-bold text-orange-900">
          {stats.dueNow.toLocaleString()}
        </span>
      </button>
    );
  }

  if ((stage === "confirming" || stage === "previewing") && stats) {
    const busy = stage === "previewing";
    return (
      <div
        className="flex w-full max-w-md flex-col gap-3 rounded-xl bg-white/95 px-4 py-3 text-sm shadow-sm"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold" style={{ color: "#0F2744" }}>
              Send to {Math.min(stats.batchSize, stats.dueNow).toLocaleString()} of{" "}
              {stats.dueNow.toLocaleString()} due
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {stats.batchSize} per run, {stats.runsToDrain} run
              {stats.runsToDrain === 1 ? "" : "s"} to clear the queue. Anyone contacted in
              the last {stats.cooldownDays} days is held back until they are due again.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
          <div>
            <dt className="text-gray-500">Due now</dt>
            <dd className="font-semibold" style={{ color: "#0F2744" }}>
              {stats.dueNow.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Suppressed</dt>
            <dd className="font-semibold text-gray-700">
              {stats.suppressed.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Over contacted</dt>
            <dd className="font-semibold text-gray-700">
              {stats.overContacted.toLocaleString()}
            </dd>
          </div>
        </dl>

        {preview && (
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs ring-1 ring-blue-100">
            <p className="font-semibold text-blue-900">
              Preview: {preview.wouldSend} would be emailed,{" "}
              {preview.remainingAfterThisBatch.toLocaleString()} left after
            </p>
            {preview.sample.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-blue-800">
                {preview.sample.map((s) => (
                  <li key={s.email}>
                    {s.name} · {s.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={runPreview}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
            Preview
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: "#0B3C5D" }}
          >
            Send batch
          </button>
        </div>
      </div>
    );
  }

  if (stage === "sending") {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-gray-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Sending batch of {stats ? Math.min(stats.batchSize, stats.dueNow) : ""}...
      </span>
    );
  }

  if (stage === "done" && result) {
    return (
      <div className="flex w-full max-w-md flex-col gap-2 rounded-xl bg-white/95 px-4 py-3 text-sm shadow-sm">
        <div className="flex items-center gap-2">
          {result.failed === 0 ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          )}
          <span className="font-semibold" style={{ color: "#0F2744" }}>
            Sent {result.sent} of {result.total}
            {result.failed > 0 ? ` · ${result.failed} failed` : ""}
            {result.skippedSuppressed > 0 ? ` · ${result.skippedSuppressed} suppressed` : ""}
          </span>
          <button
            type="button"
            onClick={reset}
            className="ml-auto rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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

        {result.remaining > 0 ? (
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
            <span className="text-xs text-gray-600">
              {result.remaining.toLocaleString()} still due · {result.runsLeft} run
              {result.runsLeft === 1 ? "" : "s"} left
            </span>
            <button
              type="button"
              onClick={send}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: "#0B3C5D" }}
            >
              Send next batch
            </button>
          </div>
        ) : (
          <p className="border-t border-gray-100 pt-2 text-xs text-emerald-700">
            Queue cleared. The next cohort becomes due as people pass the{" "}
            {stats?.cooldownDays ?? 30}-day cooldown.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 ring-1 ring-red-200">
      <AlertTriangle className="h-3.5 w-3.5" />
      {error}
      <button
        type="button"
        onClick={reset}
        className="ml-1 rounded px-2 py-0.5 text-xs font-semibold hover:bg-red-100"
      >
        Dismiss
      </button>
    </div>
  );
}
