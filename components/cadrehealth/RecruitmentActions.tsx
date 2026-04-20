"use client";

import { useState } from "react";
import { Calendar, ClipboardCheck, UserCheck, XCircle, Send, Loader2 } from "lucide-react";

const STAGES = [
  { value: "SCREENING", label: "Screening", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "INTERVIEW_DONE", label: "Interview Done", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "OFFER", label: "Offer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "PLACED", label: "Placed", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-50 text-red-600 border-red-200" },
] as const;

interface RecruitmentActionsProps {
  professionalId: string;
  currentStage: string | null;
  interviewDate: string | null;
  notes: string | null;
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

  async function save() {
    setSaving(true);
    setSaved(false);
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
      if (res.ok) setSaved(true);
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  }

  const currentStageInfo = STAGES.find((s) => s.value === stage);

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
              onClick={() => { setStage(s.value); setSaved(false); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                stage === s.value ? s.color : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
          {stage && (
            <button
              onClick={() => { setStage(""); setSaved(false); }}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-400 transition hover:bg-gray-50"
              title="Clear stage"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
          onChange={(e) => { setInterview(e.target.value); setSaved(false); }}
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
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
          rows={3}
          placeholder="Interview feedback, salary expectations, next steps..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "#0B3C5D" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && (
          <span className="text-xs font-medium text-emerald-600">Saved</span>
        )}
      </div>
    </div>
  );
}
