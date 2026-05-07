"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Users, User, Loader2, AlertCircle, CheckCircle, Eye, AlertTriangle, Search, X } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import TemplatePicker from "@/components/platform/communications/TemplatePicker";

const AUDIENCES = [
  { code: "CONSULTANTS_ALL", label: "All consultants in the network", group: "Consultants" },
  { code: "CONSULTANTS_AVAILABLE", label: "Consultants currently available", group: "Consultants" },
  { code: "CONSULTANTS_ACTIVE_ONBOARDING", label: "Consultants in active onboarding", group: "Consultants" },
  { code: "CADRE_VERIFIED", label: "CadreHealth: verified professionals", group: "CadreHealth" },
  { code: "CADRE_ALL", label: "CadreHealth: all professionals", group: "CadreHealth" },
  { code: "CADRE_PENDING_REVIEW", label: "CadreHealth: pending review", group: "CadreHealth" },
  { code: "CADRE_DIASPORA_NETWORK", label: "CadreHealth: diaspora network", group: "CadreHealth" },
  { code: "CADRE_ALUMNI_NETWORK", label: "CadreHealth: alumni / senior fellows", group: "CadreHealth" },
  { code: "CADRE_OUTREACH_EMAIL_SENT_NO_CLAIM", label: "CadreHealth: emailed but never claimed (re-engage)", group: "CadreHealth" },
  { code: "CLIENT_CONTACTS_ACTIVE", label: "Client contacts at active clients", group: "Clients" },
  { code: "TALENT_APPLICANTS_RECENT", label: "Talent applicants from last 30 days", group: "Talent" },
  { code: "PARTNERS_ACTIVE", label: "Active partner firm contacts", group: "Partners" },
];

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

interface DryRunRecipient {
  email: string;
  fullName: string;
}

interface DryRunResult {
  recipientCount: number;
  recipients: DryRunRecipient[];
}

interface SendResult {
  ok: boolean;
  bulkId?: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  failures: { email: string; ok: boolean; error?: string }[];
}

interface ConsultantOption {
  id: string;
  name: string;
  email: string;
}

type Mode = "single" | "audience";

export default function ComposeClient() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("audience");

  // Audience mode state
  const [audience, setAudience] = useState("CONSULTANTS_ALL");
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [recipientFilter, setRecipientFilter] = useState("");
  const [previewing, setPreviewing] = useState(false);

  // Single mode state
  const [consultants, setConsultants] = useState<ConsultantOption[]>([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [consultantSearch, setConsultantSearch] = useState("");
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantOption | null>(null);

  // Shared composition state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Lazy-load consultants when entering single mode
  useEffect(() => {
    if (mode !== "single" || consultants.length > 0 || consultantsLoading) return;
    setConsultantsLoading(true);
    fetch("/api/consultants")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setConsultants(data.consultants ?? []))
      .catch(() => setError("Failed to load consultants"))
      .finally(() => setConsultantsLoading(false));
  }, [mode, consultants.length, consultantsLoading]);

  async function handlePreview() {
    setPreviewing(true);
    setError("");
    setDryRun(null);
    setExcluded(new Set());
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

  async function handleSendAudience() {
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
          excludeEmails: Array.from(excluded),
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

  async function handleSendSingle() {
    if (!selectedConsultant) return;
    setSending(true);
    setError("");
    setConfirmOpen(false);
    try {
      const [firstName, ...rest] = selectedConsultant.name.split(" ");
      const res = await fetch("/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          recipient: {
            subjectType: "CONSULTANT",
            consultantId: selectedConsultant.id,
            email: selectedConsultant.email,
            fullName: selectedConsultant.name,
            firstName,
            lastName: rest.join(" "),
          },
          subject,
          body,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to send."));
        return;
      }
      const data = await res.json();
      // Single-send returns { ok, communicationId, ... } -- normalize to SendResult shape
      setSendResult({
        ok: data.ok,
        recipientCount: 1,
        successCount: data.ok ? 1 : 0,
        failureCount: data.ok ? 0 : 1,
        failures: data.ok ? [] : [{ email: selectedConsultant.email, ok: false, error: data.error }],
      });
    } catch {
      setError("Network error during send.");
    } finally {
      setSending(false);
    }
  }

  const audienceLabel = AUDIENCES.find((a) => a.code === audience)?.label ?? audience;

  const filteredRecipients = useMemo(() => {
    if (!dryRun) return [];
    const q = recipientFilter.trim().toLowerCase();
    if (!q) return dryRun.recipients;
    return dryRun.recipients.filter(
      (r) => r.email.toLowerCase().includes(q) || (r.fullName ?? "").toLowerCase().includes(q),
    );
  }, [dryRun, recipientFilter]);

  const filteredConsultants = useMemo(() => {
    const q = consultantSearch.trim().toLowerCase();
    if (!q) return consultants.slice(0, 50);
    return consultants
      .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .slice(0, 50);
  }, [consultants, consultantSearch]);

  const finalCount = dryRun ? dryRun.recipientCount - excluded.size : 0;

  // Variables for live preview
  const sampleVars: Record<string, string> = mode === "single" && selectedConsultant
    ? {
        firstName: selectedConsultant.name.split(" ")[0] ?? "",
        lastName: selectedConsultant.name.split(" ").slice(1).join(" "),
        fullName: selectedConsultant.name,
        email: selectedConsultant.email,
        company: "",
      }
    : {
        firstName: "Adaeze",
        lastName: "Okafor",
        fullName: "Adaeze Okafor",
        email: "adaeze@example.com",
        company: "Sample Hospital",
      };
  const renderedSubject = subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => sampleVars[k] ?? `{{${k}}}`);
  const renderedBody = body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => sampleVars[k] ?? `{{${k}}}`);

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
                setExcluded(new Set());
                setSelectedConsultant(null);
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

  const canSend = mode === "single"
    ? !!selectedConsultant && !!subject.trim() && !!body.trim() && !sending
    : !!dryRun && finalCount > 0 && !!subject.trim() && !!body.trim() && !sending;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: "1px solid #e5eaf0" }}>
        {/* Mode toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Send to</label>
          <div className="inline-flex rounded-lg p-0.5" style={{ background: "#F3F4F6" }} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "single"}
              onClick={() => { setMode("single"); setError(""); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={mode === "single"
                ? { background: "#FFFFFF", color: "#0F2744", boxShadow: "0 1px 2px rgba(15,39,68,0.06)" }
                : { color: "#6B7280" }}
            >
              <User size={11} /> One person
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "audience"}
              onClick={() => { setMode("audience"); setError(""); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={mode === "audience"
                ? { background: "#FFFFFF", color: "#0F2744", boxShadow: "0 1px 2px rgba(15,39,68,0.06)" }
                : { color: "#6B7280" }}
            >
              <Users size={11} /> Audience
            </button>
          </div>
        </div>

        {mode === "single" ? (
          /* ──────────────── ONE PERSON ──────────────── */
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Recipient</label>
            {selectedConsultant ? (
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{selectedConsultant.name}</p>
                  <p className="text-xs text-gray-500">{selectedConsultant.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedConsultant(null)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                >
                  <X size={11} /> Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={consultantSearch}
                    onChange={(e) => setConsultantSearch(e.target.value)}
                    placeholder="Search consultants by name or email"
                    className={inputClass + " pl-8"}
                    style={inputStyle}
                  />
                </div>
                <div className="mt-2 max-h-60 overflow-y-auto rounded-lg" style={{ border: "1px solid #E5E7EB" }}>
                  {consultantsLoading ? (
                    <div className="p-4 text-xs text-gray-500 flex items-center gap-2">
                      <Loader2 size={11} className="animate-spin" /> Loading consultants...
                    </div>
                  ) : filteredConsultants.length === 0 ? (
                    <div className="p-4 text-xs text-gray-500">No consultants match.</div>
                  ) : (
                    filteredConsultants.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedConsultant(c)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        style={{ borderColor: "#F3F4F6" }}
                      >
                        <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{c.name}</p>
                        <p className="text-[11px] text-gray-500">{c.email}</p>
                      </button>
                    ))
                  )}
                </div>
                {!consultantsLoading && consultants.length > filteredConsultants.length && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    Showing {filteredConsultants.length} of {consultants.length} — refine the search to see more.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          /* ──────────────── AUDIENCE ──────────────── */
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Users size={11} /> Audience
            </label>
            <select
              value={audience}
              onChange={(e) => { setAudience(e.target.value); setDryRun(null); setExcluded(new Set()); }}
              className={inputClass}
              style={inputStyle}
            >
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
              {dryRun ? "Refresh recipients" : "Load recipients"}
            </button>

            {dryRun && (
              <div className="mt-3 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "#E2E8F0" }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#0F2744" }}>
                      {finalCount} of {dryRun.recipientCount} selected
                      {excluded.size > 0 && (
                        <span className="text-gray-500 font-normal"> · {excluded.size} excluded</span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Uncheck a row to drop that recipient from this send.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExcluded(new Set())}
                      disabled={excluded.size === 0}
                      className="text-[10px] font-semibold disabled:opacity-30"
                      style={{ color: "#0F2744" }}
                    >
                      Select all
                    </button>
                    <span className="text-gray-300 text-[10px]">|</span>
                    <button
                      type="button"
                      onClick={() => setExcluded(new Set(dryRun.recipients.map((r) => r.email)))}
                      disabled={excluded.size === dryRun.recipientCount}
                      className="text-[10px] font-semibold disabled:opacity-30"
                      style={{ color: "#0F2744" }}
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {dryRun.recipientCount > 0 && (
                  <>
                    <div className="p-2 border-b" style={{ borderColor: "#E2E8F0" }}>
                      <div className="relative">
                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={recipientFilter}
                          onChange={(e) => setRecipientFilter(e.target.value)}
                          placeholder="Filter recipients..."
                          className="w-full text-xs rounded-md border px-2 py-1.5 pl-7 focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                          style={{ borderColor: "#E5E7EB", background: "#FFFFFF" }}
                        />
                      </div>
                    </div>

                    <ul className="max-h-72 overflow-y-auto">
                      {filteredRecipients.map((r) => {
                        const isExcluded = excluded.has(r.email);
                        return (
                          <li key={r.email} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white border-b last:border-b-0" style={{ borderColor: "#EEF2F7" }}>
                            <input
                              type="checkbox"
                              checked={!isExcluded}
                              onChange={() => {
                                setExcluded((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(r.email)) next.delete(r.email);
                                  else next.add(r.email);
                                  return next;
                                });
                              }}
                              className="h-3.5 w-3.5 accent-[#0F2744]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: isExcluded ? "#9CA3AF" : "#0F2744", textDecoration: isExcluded ? "line-through" : "none" }}>
                                {r.fullName || r.email}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">{r.email}</p>
                            </div>
                          </li>
                        );
                      })}
                      {filteredRecipients.length === 0 && (
                        <li className="px-3 py-3 text-[11px] text-gray-500">No recipients match this filter.</li>
                      )}
                    </ul>
                  </>
                )}

                {dryRun.recipientCount > 100 && (
                  <p className="text-[11px] text-amber-700 m-3 flex items-start gap-1">
                    <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                    Sending to {dryRun.recipientCount} recipients via Zoho will be slow. For large blasts, consider migrating to Postmark Broadcast.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

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
            disabled={!canSend}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            <Send size={12} />
            {mode === "single"
              ? selectedConsultant ? `Send to ${selectedConsultant.name.split(" ")[0]}` : "Send"
              : `Send to ${finalCount}`}
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FEF3C7" }}>
                <AlertTriangle size={20} style={{ color: "#D97706" }} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold" style={{ color: "#0F2744" }}>Confirm Send</h3>
                {mode === "single" && selectedConsultant ? (
                  <p className="text-sm text-gray-600 mt-1">
                    This will send to <strong>{selectedConsultant.name}</strong> ({selectedConsultant.email}).
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mt-1">
                    This will send to <strong>{finalCount} recipient{finalCount !== 1 ? "s" : ""}</strong> in the &quot;{audienceLabel}&quot; audience
                    {excluded.size > 0 && <> ({excluded.size} excluded)</>}.
                  </p>
                )}
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
                onClick={mode === "single" ? handleSendSingle : handleSendAudience}
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
