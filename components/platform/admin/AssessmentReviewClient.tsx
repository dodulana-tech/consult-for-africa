"use client";

import { useState } from "react";
import type { IntegrityReport } from "@/lib/consultantAssessment/integrity";

interface ResponseData {
  id: string;
  part: string;
  questionId: string;
  questionText: string;
  answer: string;
  timeSpentSec: number | null;
  pasteEvents: number;
  tabSwitches: number;
  wordCount: number | null;
  answeredAt: string;
}

interface AssessmentData {
  id: string;
  userId: string;
  specialty: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  tabSwitchCount: number;
  pasteEventCount: number;
  aiContentScore: number | null;
  aiIntegrityScore: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiBreakdown: Record<string, any> | null;
  videoUrl: string | null;
  videoDurationSec: number | null;
  adminScore: number | null;
  adminTier: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  user: {
    name: string;
    email: string;
    profile: {
      location: string;
      yearsExperience: number;
      title: string;
      tier: string;
    } | null;
  };
  track: string;
  responses: ResponseData[];
  integrityReport: IntegrityReport;
}

function scoreColor(score: number | null): string {
  if (score === null) return "#94A3B8";
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function scoreBg(score: number | null): string {
  if (score === null) return "#f1f5f9";
  if (score >= 70) return "#f0fdf4";
  if (score >= 40) return "#fffbeb";
  return "#fef2f2";
}

function riskBadge(risk: "low" | "medium" | "high") {
  const map = {
    low: { color: "#16a34a", bg: "#f0fdf4", label: "Low" },
    medium: { color: "#d97706", bg: "#fffbeb", label: "Medium" },
    high: { color: "#dc2626", bg: "#fef2f2", label: "High" },
  };
  const s = map[risk];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function AssessmentReviewClient({
  assessment,
}: {
  assessment: AssessmentData;
}) {
  const [adminScore, setAdminScore] = useState<number>(assessment.adminScore ?? 5);
  const [adminTier, setAdminTier] = useState<string>(assessment.adminTier ?? "STANDARD");
  const [adminNotes, setAdminNotes] = useState<string>(assessment.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { integrityReport, aiBreakdown } = assessment;
  const breakdownResponses = (aiBreakdown?.breakdown ?? []) as Array<{
    questionId: string;
    contentScore: number;
    authenticityScore: number;
    notes: string;
  }>;
  const redFlags = (aiBreakdown?.redFlags ?? []) as string[];
  const narrative = (aiBreakdown?.narrative ?? null) as string | null;

  const scenarioResponses = assessment.responses.filter((r) => r.part === "scenario");
  const experienceResponses = assessment.responses.filter((r) => r.part === "experience");
  const quickfireResponses = assessment.responses.filter((r) => r.part === "quickfire");

  const [reviewAction, setReviewAction] = useState<string | null>(assessment.adminTier === "REJECT" ? "reject" : assessment.adminScore ? "approve" : null);

  async function handleSubmit(action: "approve" | "reject") {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/assessments/${assessment.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminScore,
          adminTier,
          adminNotes,
          action,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save review");
      }

      setSaved(true);
      setReviewAction(action);
    } catch (err) {
      console.error("Assessment review save failed:", err);
      setError("Unable to save your review. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Candidate Info Card */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0F2744" }}>
          Candidate Information
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Name</p>
            <p className="font-medium text-gray-900">{assessment.user.name}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Email</p>
            <p className="font-medium text-gray-900">{assessment.user.email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Specialty</p>
            <p className="font-medium text-gray-900">{assessment.specialty.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Years of Experience</p>
            <p className="font-medium text-gray-900">
              {assessment.user.profile?.yearsExperience ?? "N/A"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Location</p>
            <p className="font-medium text-gray-900">
              {assessment.user.profile?.location ?? "N/A"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Track</p>
            <p className="font-medium text-gray-900">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                assessment.track === "INTERN" || assessment.track === "SIWES" ? "bg-green-50 text-green-700" :
                assessment.track === "FELLOWSHIP" ? "bg-purple-50 text-purple-700" :
                "bg-blue-50 text-blue-700"
              }`}>
                {(assessment.track ?? "CONSULTANT").replace(/_/g, " ")}
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Current Tier</p>
            <p className="font-medium text-gray-900">{assessment.user.profile?.tier ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Completed</p>
            <p className="font-medium text-gray-900">
              {assessment.completedAt
                ? new Date(assessment.completedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Scores Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <p className="text-xs text-gray-400 mb-1">AI Content Score</p>
          <p
            className="text-3xl font-bold"
            style={{ color: scoreColor(assessment.aiContentScore) }}
          >
            {assessment.aiContentScore ?? "Pending"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Quality of answers</p>
        </div>
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <p className="text-xs text-gray-400 mb-1">AI Integrity Score</p>
          <p
            className="text-3xl font-bold"
            style={{ color: scoreColor(assessment.aiIntegrityScore) }}
          >
            {assessment.aiIntegrityScore ?? "Pending"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Authenticity rating</p>
        </div>
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <p className="text-xs text-gray-400 mb-1">Behavioural Integrity</p>
          <p
            className="text-3xl font-bold"
            style={{ color: scoreColor(integrityReport.overallScore) }}
          >
            {integrityReport.overallScore}
          </p>
          <p className="text-xs text-gray-400 mt-1">Signal-based score</p>
        </div>
      </div>

      {/* AI Narrative */}
      {narrative && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-base font-semibold mb-2" style={{ color: "#0F2744" }}>
            AI Assessment Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{narrative}</p>
          {aiBreakdown?.recommendedTier && (
            <p className="mt-3 text-sm">
              <span className="text-gray-400">Recommended tier: </span>
              <span className="font-semibold" style={{ color: "#0F2744" }}>
                {aiBreakdown.recommendedTier}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <h2 className="text-base font-semibold mb-2" style={{ color: "#dc2626" }}>
            Red Flags
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            {redFlags.map((flag, i) => (
              <li key={i} className="text-sm text-red-700">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Integrity Dashboard */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0F2744" }}>
          Integrity Dashboard
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Tab Switch Risk</p>
            {riskBadge(integrityReport.tabSwitchRisk)}
            <p className="text-xs text-gray-500 mt-1">
              {assessment.tabSwitchCount} total switches
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Paste Risk</p>
            {riskBadge(integrityReport.pasteRisk)}
            <p className="text-xs text-gray-500 mt-1">
              {assessment.pasteEventCount} total pastes
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Timing Risk</p>
            {riskBadge(integrityReport.timingRisk)}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Flags</p>
            <p className="text-lg font-bold text-gray-900">{integrityReport.flags.length}</p>
          </div>
        </div>

        {integrityReport.flags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Flag Details
            </p>
            {integrityReport.flags.map((flag, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg text-sm"
                style={{
                  background:
                    flag.severity === "high"
                      ? "#fef2f2"
                      : flag.severity === "medium"
                        ? "#fffbeb"
                        : "#f0fdf4",
                  border: `1px solid ${
                    flag.severity === "high"
                      ? "#fecaca"
                      : flag.severity === "medium"
                        ? "#fde68a"
                        : "#bbf7d0"
                  }`,
                }}
              >
                <span
                  className="shrink-0 w-2 h-2 rounded-full mt-1.5"
                  style={{
                    background:
                      flag.severity === "high"
                        ? "#dc2626"
                        : flag.severity === "medium"
                          ? "#d97706"
                          : "#16a34a",
                  }}
                />
                <div>
                  <p className="font-medium text-gray-700">
                    {flag.type.replace(/_/g, " ")}
                    <span className="ml-2 text-xs text-gray-400">{flag.severity}</span>
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">{flag.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3 italic">{integrityReport.summary}</p>
      </div>

      {/* Per-Response Review: Scenarios */}
      {scenarioResponses.length > 0 && (
        <ResponseSection
          title="Scenario Responses"
          responses={scenarioResponses}
          breakdownResponses={breakdownResponses}
        />
      )}

      {/* Per-Response Review: Experience */}
      {experienceResponses.length > 0 && (
        <ResponseSection
          title="Experience Responses"
          responses={experienceResponses}
          breakdownResponses={breakdownResponses}
        />
      )}

      {/* Quick-Fire Answers */}
      {quickfireResponses.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-base font-semibold mb-3" style={{ color: "#0F2744" }}>
            Quick-Fire Answers
          </h2>
          <div className="space-y-3">
            {quickfireResponses.map((r) => {
              const bd = breakdownResponses.find((b) => b.questionId === r.questionId);
              return (
                <div
                  key={r.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "#f8fafc", border: "1px solid #e5eaf0" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{r.questionText}</p>
                    <p className="text-sm text-gray-800 font-medium">{r.answer}</p>
                    <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                      <span>{formatDuration(r.timeSpentSec)}</span>
                      <span>{r.wordCount ?? 0} words</span>
                    </div>
                  </div>
                  {bd && (
                    <div className="text-right shrink-0">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: scoreColor(bd.contentScore) }}
                      >
                        {bd.contentScore}
                      </p>
                      <p className="text-[10px] text-gray-400">content</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Player */}
      {assessment.videoUrl && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-base font-semibold mb-3" style={{ color: "#0F2744" }}>
            Video Response
          </h2>
          <p className="text-xs text-gray-400 mb-2">
            Duration: {formatDuration(assessment.videoDurationSec)}
          </p>
          <video
            controls
            src={assessment.videoUrl}
            className="w-full max-w-2xl rounded-lg"
            style={{ background: "#000" }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Admin Action Form */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: "#0F2744" }}>
          Admin Review
        </h2>

        {assessment.reviewedAt && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <p className="text-green-700">
              Previously reviewed on{" "}
              {new Date(assessment.reviewedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Score Slider */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Overall Score: {adminScore}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={adminScore}
              onChange={(e) => setAdminScore(Number(e.target.value))}
              className="w-full max-w-md"
              style={{ accentColor: "#0F2744" }}
            />
            <div className="flex justify-between max-w-md text-[10px] text-gray-400">
              <span>1 (Poor)</span>
              <span>5 (Average)</span>
              <span>10 (Exceptional)</span>
            </div>
          </div>

          {/* Tier Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tier Assignment
            </label>
            <select
              value={adminTier}
              onChange={(e) => setAdminTier(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: "#e5eaf0" }}
            >
              <option value="INTERN">Intern</option>
              <option value="EMERGING">Emerging</option>
              <option value="STANDARD">Standard</option>
              <option value="EXPERIENCED">Experienced</option>
              <option value="ELITE">Elite</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Review Notes
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
              style={{ borderColor: "#e5eaf0" }}
              placeholder="Notes about this candidate's assessment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleSubmit("approve")}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#16a34a" }}
            >
              {saving ? "Saving..." : "Approve"}
            </button>
            <button
              onClick={() => handleSubmit("reject")}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#dc2626" }}
            >
              {saving ? "Saving..." : "Reject"}
            </button>
          </div>

          {saved && reviewAction === "approve" && (
            <div className="rounded-lg p-4 border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
              <p className="text-sm font-semibold text-green-800">Consultant Approved</p>
              <p className="text-xs text-green-700 mt-1">
                {assessment.user.name} has been approved as a {adminTier} consultant and their account is now active.
                They can log in and start receiving assignments.
              </p>
              <a
                href="/admin/onboarding"
                className="inline-block mt-2 text-xs font-medium text-green-700 hover:underline"
              >
                View onboarding status
              </a>
            </div>
          )}
          {saved && reviewAction === "reject" && (
            <div className="rounded-lg p-4 border" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
              <p className="text-sm font-semibold text-red-800">Consultant Rejected</p>
              <p className="text-xs text-red-700 mt-1">
                {assessment.user.name} has been rejected. Their portal access has been revoked.
              </p>
            </div>
          )}
          {error && (
            <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Sub-component for response sections ----

function ResponseSection({
  title,
  responses,
  breakdownResponses,
}: {
  title: string;
  responses: ResponseData[];
  breakdownResponses: Array<{
    questionId: string;
    contentScore: number;
    authenticityScore: number;
    notes: string;
  }>;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <h2 className="text-base font-semibold mb-3" style={{ color: "#0F2744" }}>
        {title}
      </h2>
      <div className="space-y-4">
        {responses.map((r) => {
          const bd = breakdownResponses.find((b) => b.questionId === r.questionId);
          return (
            <div
              key={r.id}
              className="rounded-lg p-4"
              style={{ background: "#f8fafc", border: "1px solid #e5eaf0" }}
            >
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
                {r.questionId}
              </p>
              <p className="text-sm font-medium text-gray-700 mb-2">{r.questionText}</p>
              <div
                className="p-3 rounded-lg text-sm text-gray-800 leading-relaxed mb-3"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                {r.answer}
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                <span>Time: {formatDuration(r.timeSpentSec)}</span>
                <span>{r.wordCount ?? 0} words</span>
                <span>Pastes: {r.pasteEvents}</span>
                <span>Tab switches: {r.tabSwitches}</span>
              </div>

              {/* AI per-response scores */}
              {bd && (
                <div
                  className="mt-3 p-3 rounded-lg flex flex-wrap gap-4 items-start"
                  style={{ background: "#eff6ff", border: "1px solid #dbeafe" }}
                >
                  <div>
                    <p className="text-[10px] text-gray-400">Content</p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: scoreColor(bd.contentScore) }}
                    >
                      {bd.contentScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Authenticity</p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: scoreColor(bd.authenticityScore) }}
                    >
                      {bd.authenticityScore}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400">AI Notes</p>
                    <p className="text-xs text-gray-600">{bd.notes}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
