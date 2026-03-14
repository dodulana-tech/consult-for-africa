"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Star, AlertTriangle, CheckCircle } from "lucide-react";

const STATUS_OPTIONS = [
  "SUBMITTED", "AI_SCREENED", "UNDER_REVIEW", "SHORTLISTED",
  "INTERVIEW_SCHEDULED", "OFFER_EXTENDED", "HIRED", "REJECTED", "WITHDRAWN",
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  SUBMITTED:            { bg: "#F3F4F6", color: "#6B7280" },
  AI_SCREENED:          { bg: "#EFF6FF", color: "#1D4ED8" },
  UNDER_REVIEW:         { bg: "#FEF3C7", color: "#92400E" },
  SHORTLISTED:          { bg: "#D1FAE5", color: "#065F46" },
  INTERVIEW_SCHEDULED:  { bg: "#DBEAFE", color: "#1E40AF" },
  OFFER_EXTENDED:       { bg: "#FDE68A", color: "#78350F" },
  HIRED:                { bg: "#BBF7D0", color: "#14532D" },
  REJECTED:             { bg: "#FEE2E2", color: "#991B1B" },
  WITHDRAWN:            { bg: "#F3F4F6", color: "#9CA3AF" },
};

const BREAKDOWN_LABELS: Record<string, string> = {
  experience_depth: "Experience Depth",
  specialty_fit: "Specialty Fit",
  leadership_impact: "Leadership Impact",
  africa_context: "Africa Context",
  communication: "Communication",
};

interface Props {
  application: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    linkedinUrl: string | null;
    location: string;
    specialty: string;
    yearsExperience: number;
    currentRole: string | null;
    currentOrg: string | null;
    workAuthorization: string;
    engagementTypes: string[];
    availableFrom: string | null;
    cvText: string | null;
    coverLetter: string | null;
    aiScore: number | null;
    aiScoreBreakdown: Record<string, number> | null;
    aiSummary: string | null;
    aiStrengths: string[];
    aiConcerns: string[];
    aiRecommendation: string | null;
    status: string;
    reviewNotes: string | null;
    reviewedBy: { name: string } | null;
    reviewedAt: string | null;
    createdAt: string;
  };
}

export default function TalentApplicationDetail({ application: app }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.reviewNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/talent/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const statusStyle = STATUS_COLORS[status] ?? STATUS_COLORS.SUBMITTED;
  const recColor = app.aiRecommendation === "STRONG_YES" ? "#059669"
    : app.aiRecommendation === "YES" ? "#1D4ED8"
    : app.aiRecommendation === "MAYBE" ? "#D97706"
    : "#DC2626";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4">
        {/* AI Score card */}
        <div className="rounded-xl p-5 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">AI Score</p>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto"
            style={{
              background: app.aiScore !== null
                ? app.aiScore >= 75 ? "#059669" : app.aiScore >= 55 ? "#D97706" : "#EF4444"
                : "#9CA3AF",
            }}
          >
            {app.aiScore ?? "--"}
          </div>
          <p className="text-xs text-gray-400 mt-2">out of 100</p>
        </div>

        {/* Recommendation card */}
        <div className="rounded-xl p-5 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">AI Recommendation</p>
          <p className="text-lg font-bold" style={{ color: recColor }}>
            {app.aiRecommendation?.replace(/_/g, " ") ?? "Pending"}
          </p>
          {app.aiRecommendation && (
            <div className="mt-2">
              {app.aiRecommendation === "STRONG_YES" && <CheckCircle size={20} className="mx-auto" style={{ color: "#059669" }} />}
              {app.aiRecommendation === "YES" && <CheckCircle size={20} className="mx-auto" style={{ color: "#1D4ED8" }} />}
              {app.aiRecommendation === "MAYBE" && <AlertTriangle size={20} className="mx-auto" style={{ color: "#D97706" }} />}
              {app.aiRecommendation === "NO" && <AlertTriangle size={20} className="mx-auto" style={{ color: "#DC2626" }} />}
            </div>
          )}
        </div>

        {/* Applied date card */}
        <div className="rounded-xl p-5 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Applied</p>
          <p className="text-lg font-bold text-gray-800">
            {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-medium" style={statusStyle}>
            {app.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Profile + AI */}
        <div className="col-span-2 space-y-4">
          {/* Profile */}
          <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Profile</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              {[
                { label: "Email", value: app.email },
                { label: "Phone", value: app.phone ?? "Not provided" },
                { label: "Location", value: app.location },
                { label: "LinkedIn", value: app.linkedinUrl ? "View Profile" : "Not provided", href: app.linkedinUrl ?? undefined },
                { label: "Specialty", value: app.specialty },
                { label: "Experience", value: `${app.yearsExperience} years` },
                { label: "Current Role", value: app.currentRole ?? "Not specified" },
                { label: "Organisation", value: app.currentOrg ?? "Not specified" },
                { label: "Work Auth", value: app.workAuthorization.replace(/_/g, " ") },
                { label: "Available From", value: app.availableFrom ? new Date(app.availableFrom).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "Immediately" },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                  {f.href ? (
                    <a href={f.href} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                      {f.value}
                    </a>
                  ) : (
                    <p className="font-medium text-gray-800">{f.value}</p>
                  )}
                </div>
              ))}
            </div>
            {app.engagementTypes.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f3f4f6" }}>
                <p className="text-xs text-gray-400 mb-2">Preferred Engagements</p>
                <div className="flex flex-wrap gap-1.5">
                  {app.engagementTypes.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                      {t.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {app.aiSummary && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">AI Assessment Summary</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{app.aiSummary}</p>
            </div>
          )}

          {/* Score breakdown */}
          {app.aiScoreBreakdown && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Score Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(app.aiScoreBreakdown).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{BREAKDOWN_LABELS[key] ?? key}</span>
                      <span className="font-semibold text-gray-800">{val}/20</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(val / 20) * 100}%`,
                          background: val >= 16 ? "#059669" : val >= 12 ? "#D97706" : "#EF4444",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths + Concerns */}
          {(app.aiStrengths.length > 0 || app.aiConcerns.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {app.aiStrengths.length > 0 && (
                <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Star size={12} style={{ color: "#D4AF37" }} />
                    AI Strengths
                  </h3>
                  <ul className="space-y-2">
                    {app.aiStrengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <CheckCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#059669" }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {app.aiConcerns.length > 0 && (
                <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={12} style={{ color: "#D97706" }} />
                    AI Concerns
                  </h3>
                  <ul className="space-y-2">
                    {app.aiConcerns.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CV Text */}
          {app.cvText && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">CV / Resume</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                {app.cvText}
              </pre>
            </div>
          )}

          {/* Cover Letter */}
          {app.coverLetter && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cover Letter</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
            </div>
          )}
        </div>

        {/* Right: Review panel */}
        <div className="space-y-4">
          <div className="rounded-xl p-5 bg-white sticky top-0" style={{ border: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Review Actions</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Application Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744] appearance-none pr-8"
                    style={{ borderColor: "#e5eaf0" }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Internal notes about this candidate..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744] resize-none"
                  style={{ borderColor: "#e5eaf0" }}
                />
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#0F2744" }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                {saving ? "Saving..." : saved ? "Saved" : "Save Review"}
              </button>
            </div>

            {app.reviewedBy && (
              <p className="text-[10px] text-gray-400 mt-3 text-center">
                Last reviewed by {app.reviewedBy.name}
                {app.reviewedAt ? ` on ${new Date(app.reviewedAt).toLocaleDateString("en-GB")}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
