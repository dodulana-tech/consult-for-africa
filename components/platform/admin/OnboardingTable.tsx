"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

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

export default function OnboardingTable({ records }: { records: OnboardingRecord[] }) {
  const [items, setItems] = useState(records);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "ACTIVE", approvedAt: new Date().toISOString() } : r))
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject", reason: rejectReason }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r))
        );
        setRejectId(null);
        setRejectReason("");
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>
              Reject Consultant
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Provide a reason for rejecting this consultant. They will not be notified automatically.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectId(null); setRejectReason(""); }}
                className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectId)}
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

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No consultants in the onboarding pipeline.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((r) => {
                  const style = STATUS_STYLES[r.status] ?? STATUS_STYLES.INVITED;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{r.userName}</td>
                      <td className="px-5 py-3.5 text-gray-500">{r.userEmail}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{r.assessmentLevel}</td>
                      <td className="px-5 py-3.5 text-center">
                        {r.profileCompleted ? (
                          <CheckCircle size={16} className="text-green-500 inline-block" />
                        ) : (
                          <XCircle size={16} className="text-gray-300 inline-block" />
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {r.assessmentLevel === "LIGHT" ? (
                          <span className="text-xs text-gray-400">N/A</span>
                        ) : r.assessmentCompleted ? (
                          <CheckCircle size={16} className="text-green-500 inline-block" />
                        ) : (
                          <XCircle size={16} className="text-gray-300 inline-block" />
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.status === "REVIEW" && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={actionLoading === r.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
                              style={{ background: "#166534" }}
                            >
                              {actionLoading === r.id ? <Loader2 size={12} className="animate-spin" /> : "Approve"}
                            </button>
                            <button
                              onClick={() => setRejectId(r.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: "#FEE2E2", color: "#991B1B" }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {r.status === "ACTIVE" && r.approvedAt && (
                          <span className="text-xs text-green-600">
                            Approved {new Date(r.approvedAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short",
                            })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
