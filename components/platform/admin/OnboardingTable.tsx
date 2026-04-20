"use client";

import { useState } from "react";
import {
  CheckCircle, XCircle, Loader2, ChevronRight, ArrowLeft,
  Mail, User, Clock, AlertCircle, MapPin, Briefcase, CreditCard,
  FileText, Star, ChevronDown, ExternalLink,
} from "lucide-react";

interface ProfileData {
  title: string;
  location: string;
  specialties: string[];
  primarySpecialty: string | null;
  yearsExperience: number;
  isDiaspora: boolean;
  hoursPerWeek: number | null;
  bio: string;
  bankName: string | null;
  accountName: string | null;
  currency: string | null;
  hasBanking: boolean;
}

interface ApplicationData {
  specialty: string;
  currentRole: string | null;
  currentOrg: string | null;
  cvFileUrl: string | null;
  coverLetter: string | null;
  aiScore: number | null;
  aiSummary: string | null;
  aiRecommendation: string | null;
  aiStrengths: string[];
  aiConcerns: string[];
  track: string;
}

interface OnboardingRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  assessmentLevel: string;
  profileCompleted: boolean;
  assessmentCompleted: boolean;
  applicationId: string | null;
  createdAt: string;
  approvedAt: string | null;
  profile: ProfileData | null;
  application: ApplicationData | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  INVITED: { bg: "#F1F5F9", text: "#64748B", label: "Invited" },
  PROFILE_SETUP: { bg: "#DBEAFE", text: "#1E40AF", label: "Profile Setup" },
  ASSESSMENT_PENDING: { bg: "#FEF3C7", text: "#92400E", label: "Assessment Pending" },
  ASSESSMENT_COMPLETE: { bg: "#D1FAE5", text: "#065F46", label: "Assessment Complete" },
  REVIEW: { bg: "#EDE9FE", text: "#5B21B6", label: "Under Review" },
  ACTIVE: { bg: "#DCFCE7", text: "#166534", label: "Active" },
  REJECTED: { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
};

const LEVEL_LABELS: Record<string, string> = {
  LIGHT: "Light (profile only)",
  STANDARD: "Standard (profile + assessment)",
  MAAROVA: "Maarova assessment only",
  FULL: "Full (profile + assessment + Maarova)",
};

const AI_RECOMMENDATION_STYLES: Record<string, { background: string; color: string }> = {
  STRONG_YES: { background: "#DCFCE7", color: "#166534" },
  YES: { background: "#D1FAE5", color: "#065F46" },
  MAYBE: { background: "#FEF3C7", color: "#92400E" },
  NO: { background: "#FEE2E2", color: "#991B1B" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function OnboardingTable({ records }: { records: OnboardingRecord[] }) {
  const [items, setItems] = useState(records);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [changingLevel, setChangingLevel] = useState(false);

  const filtered = filter === "all" ? items : items.filter((r) => r.status === filter);
  const selected = selectedId ? items.find((r) => r.id === selectedId) : null;

  const counts = {
    all: items.length,
    pending: items.filter((r) => !["ACTIVE", "REJECTED"].includes(r.status)).length,
    review: items.filter((r) => r.status === "REVIEW").length,
    active: items.filter((r) => r.status === "ACTIVE").length,
    rejected: items.filter((r) => r.status === "REJECTED").length,
  };

  async function handleAction(id: string, action: "approve" | "reject", reason?: string) {
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
      if (res.ok) {
        const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
        setItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus, approvedAt: action === "approve" ? new Date().toISOString() : r.approvedAt } : r))
        );
        setRejectId(null);
        setRejectReason("");
        if (selectedId === id) setSelectedId(null);
      } else {
        let msg = "Action failed. Try again.";
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch { msg = await res.text().catch(() => msg); }
        setError(msg);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangeLevel(id: string, level: string) {
    setChangingLevel(true);
    setError("");
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "change-level", assessmentLevel: level }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((r) => (r.id === id ? { ...r, assessmentLevel: level } : r)));
      } else {
        const msg = await res.text().catch(() => "Failed to change level.");
        setError(msg);
      }
    } catch {
      setError("Network error.");
    } finally {
      setChangingLevel(false);
    }
  }

  async function handleResendInvite(email: string, name: string) {
    setError("");
    try {
      const res = await fetch("/api/admin/onboarding/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendSuccess(email);
        setTimeout(() => setResendSuccess(null), 3000);
      } else {
        setError("Failed to resend invite. Try again.");
      }
    } catch {
      setError("Network error.");
    }
  }

  function canApprove(status: string) {
    return ["REVIEW", "ASSESSMENT_COMPLETE", "PROFILE_SETUP"].includes(status);
  }

  function canReject(status: string) {
    return !["ACTIVE", "REJECTED"].includes(status);
  }

  function canChangeLevel(status: string) {
    return !["ACTIVE", "REJECTED"].includes(status);
  }

  // ─── Detail View ───────────────────────────────────────────────────────────
  if (selected) {
    const style = STATUS_STYLES[selected.status] ?? STATUS_STYLES.INVITED;
    const p = selected.profile;
    const app = selected.application;

    return (
      <div className="max-w-3xl">
        <button
          onClick={() => { setSelectedId(null); setError(""); }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} /> Back to list
        </button>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600 mb-4" style={{ background: "#FEF2F2" }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Header Card */}
        <div className="rounded-xl bg-white p-5 mb-4" style={{ border: "1px solid #e5eaf0" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selected.userName}</h2>
              <p className="text-sm text-gray-500">{selected.userEmail}</p>
              {p?.title && p.title !== "Consultant" && (
                <p className="text-xs text-gray-400 mt-0.5">{p.title}</p>
              )}
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: style.bg, color: style.text }}>
              {style.label}
            </span>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div>
              <span className="text-gray-400 block mb-0.5">Assessment Level</span>
              {canChangeLevel(selected.status) ? (
                <select
                  value={selected.assessmentLevel}
                  onChange={(e) => handleChangeLevel(selected.id, e.target.value)}
                  disabled={changingLevel}
                  className="text-xs font-medium text-gray-700 border rounded-md px-1.5 py-0.5 bg-white disabled:opacity-50"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  <option value="LIGHT">Light</option>
                  <option value="STANDARD">Standard</option>
                  <option value="MAAROVA">Maarova</option>
                  <option value="FULL">Full</option>
                </select>
              ) : (
                <span className="text-gray-700 font-medium">{selected.assessmentLevel}</span>
              )}
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Invited</span>
              <span className="text-gray-700 font-medium">{formatDate(selected.createdAt)}</span>
            </div>
            {p?.yearsExperience != null && p.yearsExperience > 0 && (
              <div>
                <span className="text-gray-400 block mb-0.5">Experience</span>
                <span className="text-gray-700 font-medium">{p.yearsExperience} years</span>
              </div>
            )}
            {p?.location && p.location !== "Nigeria" && (
              <div>
                <span className="text-gray-400 block mb-0.5">Location</span>
                <span className="text-gray-700 font-medium flex items-center gap-1">
                  <MapPin size={10} /> {p.location}
                </span>
              </div>
            )}
            {selected.approvedAt && (
              <div>
                <span className="text-gray-400 block mb-0.5">Approved</span>
                <span className="text-gray-700 font-medium">{formatDate(selected.approvedAt)}</span>
              </div>
            )}
            {selected.applicationId && (
              <div>
                <span className="text-gray-400 block mb-0.5">Source</span>
                <span className="text-gray-700 font-medium">
                  {app?.track === "INTERN" ? "Intern Application" :
                   app?.track === "SIWES" ? "SIWES Application" :
                   app?.track === "FELLOWSHIP" ? "Fellowship Application" :
                   "Careers Application"}
                </span>
              </div>
            )}
            {p?.isDiaspora && (
              <div>
                <span className="text-gray-400 block mb-0.5">Diaspora</span>
                <span className="text-blue-600 font-medium">Yes</span>
              </div>
            )}
            {p?.hoursPerWeek != null && (
              <div>
                <span className="text-gray-400 block mb-0.5">Availability</span>
                <span className="text-gray-700 font-medium">{p.hoursPerWeek}h/week</span>
              </div>
            )}
          </div>

          {/* Specialties */}
          {p?.specialties && p.specialties.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium block mb-1.5">Specialties</span>
              <div className="flex flex-wrap gap-1.5">
                {p.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: s === p.primarySpecialty ? "#EFF6FF" : "#F3F4F6",
                      color: s === p.primarySpecialty ? "#1E40AF" : "#6B7280",
                      border: s === p.primarySpecialty ? "1px solid #BFDBFE" : "1px solid #E5E7EB",
                    }}
                  >
                    {s === p.primarySpecialty && <Star size={8} className="inline mr-0.5 -mt-0.5" />}
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {p?.bio && p.bio.trim().length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium block mb-1">Bio</span>
              <p className="text-xs text-gray-600 leading-relaxed">{p.bio}</p>
            </div>
          )}

          {/* Progress Checklist */}
          <div className="space-y-2 mb-4 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium block mb-2">Onboarding Progress</span>

            <div className="flex items-center gap-3">
              {selected.profileCompleted ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-300" />}
              <span className={`text-sm ${selected.profileCompleted ? "text-gray-700" : "text-gray-400"}`}>Profile completed</span>
            </div>

            <div className="flex items-center gap-3">
              {p?.hasBanking ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-300" />}
              <span className={`text-sm ${p?.hasBanking ? "text-gray-700" : "text-gray-400"}`}>
                Banking details
                {p?.hasBanking && p.bankName && (
                  <span className="text-xs text-gray-400 ml-2">({p.bankName} - {p.currency ?? "NGN"})</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {selected.assessmentLevel === "LIGHT" ? (
                <>
                  <span className="w-4 h-4 flex items-center justify-center text-[10px] text-gray-300">--</span>
                  <span className="text-sm text-gray-400">Assessment (not required for Light)</span>
                </>
              ) : selected.assessmentCompleted ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm text-gray-700">Assessment completed</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-gray-300" />
                  <span className="text-sm text-gray-400">Assessment pending</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
            {canApprove(selected.status) && (
              <button
                onClick={() => handleAction(selected.id, "approve")}
                disabled={actionLoading === selected.id}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60 flex items-center gap-1.5"
                style={{ background: "#166534" }}
              >
                {actionLoading === selected.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                Approve and Activate
              </button>
            )}
            {canReject(selected.status) && (
              <button
                onClick={() => setRejectId(selected.id)}
                className="px-4 py-2 rounded-lg text-xs font-medium"
                style={{ background: "#FEE2E2", color: "#991B1B" }}
              >
                Reject
              </button>
            )}
            {selected.status === "INVITED" && (
              <button
                onClick={() => handleResendInvite(selected.userEmail, selected.userName)}
                className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5"
                style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
              >
                <Mail size={12} />
                {resendSuccess === selected.userEmail ? "Sent!" : "Resend Invite"}
              </button>
            )}
          </div>
        </div>

        {/* Application Data (from talent pipeline) */}
        {app && (
          <div className="rounded-xl bg-white p-5 mb-4" style={{ border: "1px solid #e5eaf0" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={14} /> Application Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
              {app.currentRole && (
                <div>
                  <span className="text-gray-400 block mb-0.5">Current Role</span>
                  <span className="text-gray-700 font-medium">{app.currentRole}</span>
                </div>
              )}
              {app.currentOrg && (
                <div>
                  <span className="text-gray-400 block mb-0.5">Organisation</span>
                  <span className="text-gray-700 font-medium">{app.currentOrg}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400 block mb-0.5">Specialty</span>
                <span className="text-gray-700 font-medium">{app.specialty}</span>
              </div>
            </div>

            {/* AI Screening */}
            {app.aiScore !== null && (
              <div className="rounded-lg p-4 mb-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Screening Score</span>
                  {app.aiRecommendation && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={AI_RECOMMENDATION_STYLES[app.aiRecommendation] ?? { background: "#F3F4F6", color: "#6B7280" }}
                    >
                      {app.aiRecommendation.replace("_", " ")}
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-2xl font-bold" style={{ color: "#0F2744" }}>{app.aiScore}</span>
                  <span className="text-sm text-gray-400 mb-0.5">/100</span>
                </div>
                {app.aiSummary && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{app.aiSummary}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {app.aiStrengths.length > 0 && (
                    <div>
                      <span className="text-[10px] text-green-600 font-medium uppercase tracking-wider block mb-1">Strengths</span>
                      <ul className="space-y-0.5">
                        {app.aiStrengths.map((s, i) => (
                          <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                            <span className="text-green-500 mt-0.5 shrink-0">+</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {app.aiConcerns.length > 0 && (
                    <div>
                      <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wider block mb-1">Concerns</span>
                      <ul className="space-y-0.5">
                        {app.aiConcerns.map((c, i) => (
                          <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                            <span className="text-amber-500 mt-0.5 shrink-0">-</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CV + Cover Letter */}
            <div className="flex items-center gap-3 flex-wrap">
              {app.cvFileUrl && (
                <a
                  href={app.cvFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-50"
                  style={{ color: "#1E40AF", border: "1px solid #BFDBFE" }}
                >
                  <ExternalLink size={11} /> View CV
                </a>
              )}
              {app.coverLetter && (
                <span className="text-[11px] text-gray-400">Cover letter submitted ({app.coverLetter.length} chars)</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>Reject Consultant</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason for rejecting this consultant.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setRejectId(null); setRejectReason(""); }} className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => handleAction(rejectId, "reject", rejectReason)}
                disabled={actionLoading === rejectId}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                style={{ background: "#EF4444" }}
              >
                {actionLoading === rejectId ? <Loader2 size={14} className="animate-spin" /> : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600 mb-4" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "all", label: `All (${counts.all})` },
          { key: "pending", label: `In Pipeline (${counts.pending})` },
          { key: "REVIEW", label: `Needs Review (${counts.review})` },
          { key: "ACTIVE", label: `Active (${counts.active})` },
          { key: "REJECTED", label: `Rejected (${counts.rejected})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key === "pending" ? "pending" : f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filter === f.key ? "#0F2744" : "#fff",
              color: filter === f.key ? "#fff" : "#6B7280",
              border: filter === f.key ? "1px solid #0F2744" : "1px solid #e5eaf0",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {(() => {
        const display = filter === "pending"
          ? items.filter((r) => !["ACTIVE", "REJECTED"].includes(r.status))
          : filtered;

        if (display.length === 0) {
          return (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <User size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No consultants in this category.</p>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            {display.map((r) => {
              const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.INVITED;
              const hasAiScore = r.application?.aiScore != null;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="w-full rounded-xl bg-white p-4 text-left hover:shadow-sm transition-shadow flex items-center gap-4 group"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: "#0F2744" }}>
                    {r.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.userName}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{r.assessmentLevel}</span>
                      {hasAiScore && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#EFF6FF", color: "#1E40AF" }}>
                          Score: {r.application!.aiScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>{r.userEmail}</span>
                      <span>{formatDate(r.createdAt)}</span>
                      {r.profile?.location && r.profile.location !== "Nigeria" && (
                        <span className="flex items-center gap-0.5"><MapPin size={9} /> {r.profile.location}</span>
                      )}
                      <span className="flex items-center gap-1">
                        {r.profileCompleted ? <CheckCircle size={10} className="text-green-500" /> : <Clock size={10} />}
                        Profile
                      </span>
                      <span className="flex items-center gap-1">
                        {r.profile?.hasBanking ? <CheckCircle size={10} className="text-green-500" /> : <Clock size={10} />}
                        Banking
                      </span>
                      {r.assessmentLevel !== "LIGHT" && (
                        <span className="flex items-center gap-1">
                          {r.assessmentCompleted ? <CheckCircle size={10} className="text-green-500" /> : <Clock size={10} />}
                          Assessment
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
