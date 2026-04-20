"use client";

import { useState } from "react";
import { Calendar, ClipboardCheck, XCircle, Send, Loader2, Mail, AlertTriangle } from "lucide-react";

const STAGES = [
  { value: "SCREENING", label: "Screening", color: "bg-blue-50 text-blue-700 border-blue-200", hint: null },
  { value: "SHORTLISTED", label: "Shortlisted", color: "bg-cyan-50 text-cyan-700 border-cyan-200", hint: "Sends CV/credentials request email" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", color: "bg-amber-50 text-amber-700 border-amber-200", hint: "Sends interview date email" },
  { value: "INTERVIEW_DONE", label: "Interview Done", color: "bg-purple-50 text-purple-700 border-purple-200", hint: "Sends thank-you email" },
  { value: "OFFER", label: "Offer", color: "bg-emerald-50 text-emerald-700 border-emerald-200", hint: "Sends offer notification email" },
  { value: "PLACED", label: "Placed", color: "bg-green-50 text-green-700 border-green-200", hint: "Sends welcome/onboarding email" },
  { value: "REJECTED", label: "Not Selected", color: "bg-red-50 text-red-600 border-red-200", hint: "Sends rejection email" },
] as const;

interface RecruitmentActionsProps {
  professionalId: string;
  currentStage: string | null;
  interviewDate: string | null;
  notes: string | null;
}

interface AutomationResult {
  emailSent: boolean;
  notificationSent: boolean;
  emailError?: string;
}

export function RecruitmentActions({
  professionalId,
  currentStage,
  interviewDate,
  notes: initialNotes,
}: RecruitmentActionsProps) {
  const [stage, setStage] = useState(currentStage || "");
  const [interview, setInterview] = useState(interviewDate?.slice(0, 16) || "");
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [automation, setAutomation] = useState<AutomationResult | null>(null);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setSaved(false);
    setAutomation(null);
    setError("");

    try {
      const res = await fetch(`/api/cadre/admin/recruitment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId,
          recruitmentStage: stage || null,
          interviewDate: interview || null,
          recruitmentNotes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Save failed (${res.status})`);
        return;
      }

      const data = await res.json();
      setSaved(true);
      if (data.automation) {
        setAutomation(data.automation);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedStage = STAGES.find((s) => s.value === stage);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
        Recruitment Pipeline
      </h2>

      {/* Stage buttons */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Stage</p>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStage(s.value); setSaved(false); setAutomation(null); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                stage === s.value ? s.color : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
          {stage && (
            <button
              onClick={() => { setStage(""); setSaved(false); setAutomation(null); }}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-400 transition hover:bg-gray-50"
              title="Clear stage"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {selectedStage?.hint && (
          <p className="mt-1.5 text-[11px] text-gray-400">
            Saving will trigger: {selectedStage.hint}
          </p>
        )}
      </div>

      {/* Interview date */}
      <div className="mb-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          Interview Date & Time
        </label>
        <input
          type="datetime-local"
          value={interview}
          onChange={(e) => { setInterview(e.target.value); setSaved(false); setAutomation(null); }}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Recruitment Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setSaved(false); setAutomation(null); }}
          rows={3}
          placeholder="Interview feedback, salary expectations, next steps..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        />
      </div>

      {/* Save + feedback */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "#0B3C5D" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {saving ? "Saving..." : "Save"}
        </button>

        {saved && !automation?.emailSent && !automation?.emailError && (
          <span className="text-xs font-medium text-emerald-600">Saved</span>
        )}

        {automation?.emailSent && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <Mail className="h-3.5 w-3.5" />
            Email sent to candidate
          </span>
        )}

        {automation && !automation.emailSent && automation.emailError && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            {automation.emailError}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
