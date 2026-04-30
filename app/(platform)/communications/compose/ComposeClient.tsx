"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Users, User, Loader2, AlertCircle, CheckCircle, Eye, AlertTriangle } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import TemplatePicker from "@/components/platform/communications/TemplatePicker";

const AUDIENCES = [
  { code: "CONSULTANTS_ALL", label: "All consultants in the network", group: "Consultants" },
  { code: "CONSULTANTS_AVAILABLE", label: "Consultants currently available", group: "Consultants" },
  { code: "CONSULTANTS_ACTIVE_ONBOARDING", label: "Consultants in active onboarding", group: "Consultants" },
  { code: "CADRE_VERIFIED", label: "CadreHealth: verified professionals", group: "CadreHealth" },
  { code: "CADRE_ALL", label: "CadreHealth: all professionals", group: "CadreHealth" },
  { code: "CADRE_PENDING_REVIEW", label: "CadreHealth: pending review", group: "CadreHealth" },
  { code: "CLIENT_CONTACTS_ACTIVE", label: "Client contacts at active clients", group: "Clients" },
  { code: "TALENT_APPLICANTS_RECENT", label: "Talent applicants from last 30 days", group: "Talent" },
  { code: "PARTNERS_ACTIVE", label: "Active partner firm contacts", group: "Partners" },
];

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

interface DryRunResult {
  recipientCount: number;
  recipients: { email: string; fullName: string }[];
}

interface SendResult {
  ok: boolean;
  bulkId?: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  failures: { email: string; ok: boolean; error?: string }[];
}

export default function ComposeClient() {
  const router = useRouter();
  const [audience, setAudience] = useState("CONSULTANTS_ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handlePreview() {
    setPreviewing(true);
    setError("");
    setDryRun(null);
    setSendResult(null);
    try {
      const res = await fetch("/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "audience",
          audience,
          subject: subject || "Preview",
          body: body || "Preview",
          dryRun: true,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to preview audience."));
        return;
      }
      const data = await res.json();
      setDryRun({ recipientCount: data.recipientCount, recipients: data.recipients });
    } catch {
      setError("Network error.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setError("");
    setConfirmOpen(false);
    try {
      const res = await fetch("/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "audience",
          audience,
          subject,
          body,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to send."));
        return;
      }
      const data = await res.json();
      setSendResult(data);
    } catch {
      setError("Network error during send.");
    } finally {
      setSending(false);
    }
  }

  const audienceLabel = AUDIENCES.find((a) => a.code === audience)?.label ?? audience;

  // Variables for live preview
  const sampleVars = {
    firstName: "Adaeze",
    lastName: "Okafor",
    fullName: "Adaeze Okafor",
    email: "adaeze@example.com",
    company: "Sample Hospital",
  };
  const renderedSubject = subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (sampleVars as Record<string, string>)[k] ?? `{{${k}}}`);
  const renderedBody = body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (sampleVars as Record<string, string>)[k] ?? `{{${k}}}`);

  if (sendResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #e5eaf0" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#D1FAE5" }}>
              <CheckCircle size={20} style={{ color: "#059669" }} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: "#0F2744" }}>
                {sendResult.failureCount === 0 ? "Email Sent" : "Send Complete with Errors"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Sent to {sendResult.successCount} of {sendResult.recipientCount} recipients
                {sendResult.failureCount > 0 && ` · ${sendResult.failureCount} failed`}
              </p>
            </div>
          </div>

          {sendResult.failures.length > 0 && (
            <div className="mt-4 rounded-lg p-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <p className="text-xs font-semibold text-red-700 mb-2">Failures:</p>
              <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {sendResult.failures.map((f, i) => (
                  <li key={i}>{f.email}{f.error ? ` — ${f.error}` : ""}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.push("/communications")}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#0F2744" }}
            >
              View Communications
            </button>
            <button
              onClick={() => {
                setSendResult(null);
                setSubject("");
                setBody("");
                setDryRun(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
            >
              Send Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: "1px solid #e5eaf0" }}>
        {/* Audience selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
            <Users size={11} /> Audience
          </label>
          <select value={audience} onChange={(e) => { setAudience(e.target.value); setDryRun(null); }} className={inputClass} style={inputStyle}>
            {["Consultants", "CadreHealth", "Clients", "Talent", "Partners"].map((group) => (
              <optgroup key={group} label={group}>
                {AUDIENCES.filter((a) => a.group === group).map((a) => (
                  <option key={a.code} value={a.code}>{a.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: "#EFF6FF", color: "#1E40AF" }}
          >
            {previewing ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
            Preview Recipients
          </button>
          {dryRun && (
            <div className="mt-3 rounded-lg p-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#0F2744" }}>
                {dryRun.recipientCount} recipient{dryRun.recipientCount !== 1 ? "s" : ""} match this audience
              </p>
              {dryRun.recipientCount > 0 && (
                <p className="text-[11px] text-gray-500">
                  Sample: {dryRun.recipients.slice(0, 5).map((r) => r.fullName || r.email).join(", ")}
                  {dryRun.recipientCount > 5 && `, and ${dryRun.recipientCount - 5} more...`}
                </p>
              )}
              {dryRun.recipientCount > 100 && (
                <p className="text-[11px] text-amber-700 mt-2 flex items-start gap-1">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  Sending to {dryRun.recipientCount} recipients via Zoho will be slow. For large blasts, consider migrating to Postmark Broadcast.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-600">Subject</label>
            <TemplatePicker
              type="EMAIL"
              onPick={(tpl) => {
                if (tpl.subject) setSubject(tpl.subject);
                setBody(tpl.body);
              }}
            />
          </div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A new opportunity that fits your background"
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Body <span className="text-gray-400 font-normal">(use {"{{firstName}}"} for personalization)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            placeholder={"Hi {{firstName}},\n\nWe have a new healthcare consulting mandate that aligns with your specialty in clinical governance...\n\nBest,\nThe CFA Team"}
            className={inputClass}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "ui-monospace, monospace", fontSize: "13px" }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["firstName", "lastName", "fullName", "company"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBody((b) => b + ` {{${v}}}`)}
                className="text-[10px] px-2 py-0.5 rounded-full hover:bg-gray-100"
                style={{ background: "#F3F4F6", color: "#374151" }}
              >
                + {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        {(subject || body) && (
          <div className="rounded-lg p-3" style={{ background: "#FAFBFC", border: "1px solid #E8EBF0" }}>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-semibold">Preview (with sample data)</p>
            {renderedSubject && (
              <p className="text-sm font-semibold mb-2" style={{ color: "#0F2744" }}>{renderedSubject}</p>
            )}
            {renderedBody && (
              <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{renderedBody}</p>
            )}
          </div>
        )}

        {/* Send buttons */}
        <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
          <p className="text-[11px] text-gray-400">
            Will be sent from {process.env.NEXT_PUBLIC_SMTP_FROM ?? "hello@consultforafrica.com"}
          </p>
          <button
            type="button"
            disabled={!subject.trim() || !body.trim() || !dryRun || dryRun.recipientCount === 0 || sending}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            <Send size={12} />
            Send to {dryRun?.recipientCount ?? "?"}
          </button>
        </div>
      </div>

      {confirmOpen && dryRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FEF3C7" }}>
                <AlertTriangle size={20} style={{ color: "#D97706" }} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold" style={{ color: "#0F2744" }}>Confirm Send</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will send to <strong>{dryRun.recipientCount} recipient{dryRun.recipientCount !== 1 ? "s" : ""}</strong> in the &quot;{audienceLabel}&quot; audience.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Each recipient will receive a personalized email and the send will be logged against their profile. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                style={{ color: "#0F2744" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                {sending && <Loader2 size={12} className="animate-spin" />}
                {sending ? "Sending..." : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
