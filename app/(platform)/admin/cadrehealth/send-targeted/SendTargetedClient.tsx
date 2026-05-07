"use client";

import { useMemo, useState } from "react";
import { Loader2, Send, AlertTriangle, Check, X } from "lucide-react";

const DEFAULT_SUBJECT = "Apologies — your CadreHealth profile is ready";

const DEFAULT_BODY = `Earlier this week we wrote inviting you to claim your CadreHealth profile. Some of you experienced an error during sign-up. The issue was on our side and is now resolved.

Your record is held for you. Twenty minutes is all it takes to sign in or claim your profile.

If you set a password during your first attempt, sign in with that password. If you do not remember it, request a reset on the login page. If you have not yet claimed your profile, please try again at https://www.consultforafrica.com/oncadre/login.

Apologies for the friction.

With respect,
Dr Debo Odulana
Founding Partner, Consult For Africa`;

interface SendResult {
  ok: boolean;
  total: number;
  sent: number;
  failed: number;
  notFound: number;
  skippedSuppressed: number;
  errorSample: { email: string; error: string }[];
}

export function SendTargetedClient({ prefillEmails }: { prefillEmails: string }) {
  const [emails, setEmails] = useState(prefillEmails);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedEmails = useMemo(() => {
    return Array.from(
      new Set(
        emails
          .split(/[,\n\s]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes("@")),
      ),
    );
  }, [emails]);

  const canSend = parsedEmails.length > 0 && subject.trim() && body.trim() && !sending;

  async function send() {
    setSending(true);
    setConfirmOpen(false);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/cadrehealth/send-to-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: parsedEmails, subject: subject.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Send failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div
          className={`rounded-2xl border p-6 ${
            result.failed === 0 ? "bg-emerald-50/50" : "bg-amber-50/50"
          }`}
          style={{ borderColor: result.failed === 0 ? "#A7F3D0" : "#FDE68A" }}
        >
          <div className="flex items-start gap-3">
            <Check className={`h-5 w-5 ${result.failed === 0 ? "text-emerald-600" : "text-amber-600"}`} />
            <div>
              <h2 className="font-bold" style={{ color: "#0F2744" }}>Send complete</h2>
              <p className="mt-1 text-sm text-gray-700">
                {result.sent} sent, {result.failed} failed, {result.notFound} not found in CadreProfessional, {result.skippedSuppressed} suppressed.
              </p>
            </div>
          </div>
          {result.errorSample.length > 0 && (
            <div className="mt-3 rounded-lg bg-white p-3 text-xs text-gray-700">
              <p className="font-semibold">Sample failures:</p>
              <ul className="mt-1 space-y-0.5">
                {result.errorSample.map((e, i) => (
                  <li key={i}>{e.email}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setEmails("");
          }}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: "#0B3C5D" }}
        >
          Send another batch
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
          Recipient emails ({parsedEmails.length} parsed)
        </label>
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={6}
          placeholder="paste one email per line, or comma-separated"
          className="w-full rounded-xl border bg-white px-4 py-3 text-sm font-mono text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          style={{ borderColor: "#E5E7EB" }}
        />
        <p className="mt-1 text-[11px] text-gray-500">
          Separator can be commas, newlines or whitespace. Duplicates are deduped automatically.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          style={{ borderColor: "#E5E7EB" }}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
          Body (use {"{{firstName}}"} or {"{{lastName}}"} for personalisation)
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
          style={{ borderColor: "#E5E7EB" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {parsedEmails.length === 0 ? "Paste at least one email to enable send." : `Ready to send to ${parsedEmails.length} address${parsedEmails.length === 1 ? "" : "es"}.`}
        </p>
        <button
          type="button"
          disabled={!canSend}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: "#0B3C5D" }}
        >
          <Send className="h-3.5 w-3.5" />
          Send to {parsedEmails.length}
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-bold" style={{ color: "#0F2744" }}>Confirm send</h3>
                <p className="mt-1 text-sm text-gray-600">
                  This will send to {parsedEmails.length} address{parsedEmails.length === 1 ? "" : "es"}. Bounced and opted-out addresses will be skipped automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#0B3C5D" }}
              >
                {sending && <Loader2 className="h-3 w-3 animate-spin" />}
                {sending ? "Sending..." : "Send now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
