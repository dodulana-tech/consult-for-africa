"use client";

import { useState } from "react";
import {
  CheckCircle, XCircle, Loader2, ChevronRight, ArrowLeft,
  Mail, Shield, User, Clock, AlertCircle,
} from "lucide-react";

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

const STATUS_ORDER = ["INVITED", "PROFILE_SETUP", "ASSESSMENT_PENDING", "ASSESSMENT_COMPLETE", "REVIEW", "ACTIVE", "REJECTED"];

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
        const text = await res.text();
        setError(text || "Action failed. Try again.");
      }
    } finally {
      setActionLoading(null);
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

  // Detail view
  if (selected) {
    const style = STATUS_STYLES[selected.status] ?? STATUS_STYLES.INVITED;
    const stepIndex = STATUS_ORDER.indexOf(selected.status);

    return (
      <div className="max-w-2xl">
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} /> Back to list
        </button>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600 mb-4" style={{ background: "#FEF2F2" }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Header */}
        <div className="rounded-xl bg-white p-5 mb-4" style={{ border: "1px solid #e5eaf0" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selected.userName}</h2>
              <p className="text-sm text-gray-500">{selected.userEmail}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: style.bg, color: style.text }}>
              {style.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div>
              <span className="text-gray-400 block">Assessment Level</span>
              <span className="text-gray-700 font-medium">{selected.assessmentLevel}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Invited</span>
              <span className="text-gray-700 font-medium">{formatDate(selected.createdAt)}</span>
            </div>
            {selected.approvedAt && (
              <div>
                <span className="text-gray-400 block">Approved</span>
                <span className="text-gray-700 font-medium">{formatDate(selected.approvedAt)}</span>
              </div>
            )}
            {selected.applicationId && (
              <div>
                <span className="text-gray-400 block">Source</span>
                <span className="text-gray-700 font-medium">Careers Application</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3">
              {selected.profileCompleted ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-300" />}
              <span className="text-sm text-gray-700">Profile completed</span>
            </div>
            <div className="flex items-center gap-3">
              {selected.assessmentLevel === "LIGHT" ? (
                <>
                  <span className="text-xs text-gray-400 ml-5">N/A</span>
                  <span className="text-sm text-gray-400">Assessment (not required for LIGHT)</span>
                </>
              ) : selected.assessmentCompleted ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm text-gray-700">Assessment completed</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-gray-300" />
                  <span className="text-sm text-gray-700">Assessment pending</span>
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
      </div>
    );
  }

  // List view
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

      {/* Handle "pending" filter specially */}
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
              const style = STATUS_STYLES[r.status] ?? STATUS_STYLES.INVITED;
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
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.userName}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: style.bg, color: style.text }}>
                        {style.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{r.assessmentLevel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{r.userEmail}</span>
                      <span>{formatDate(r.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        {r.profileCompleted ? <CheckCircle size={10} className="text-green-500" /> : <Clock size={10} />}
                        Profile
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
