"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  CheckCircle,
  RotateCcw,
  Loader2,
  User,
  MapPin,
  FileText,
  Calendar,
  Send,
  Settings,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import AIQualityScore from "./AIQualityScore";
import { formatDate, timeAgo } from "@/lib/utils";
import VersionHistory from "./deliverable/VersionHistory";
import CommentThread from "./deliverable/CommentThread";

interface Deliverable {
  id: string;
  name: string;
  description: string;
  status: string;
  version: number;
  dueDate?: string | null;
  submittedAt: string | null;
  reviewScore: number | null;
  reviewNotes: string | null;
  fileUrl: string | null;
  clientVisible?: boolean;
  project: { id: string; name: string };
  assignmentId?: string | null;
  assignment: {
    id?: string;
    consultant: {
      id: string;
      name: string;
      email: string;
      consultantProfile: {
        title: string;
        location: string;
        tier: string;
      } | null;
    };
  } | null;
}

interface ProjectAssignment {
  id: string;
  role: string;
  consultant: {
    id: string;
    name: string;
    consultantProfile: { title: string; tier: string } | null;
  };
}

const RUBRIC = [
  {
    key: "technical" as const,
    label: "Technical Quality",
    description: "Is the analysis rigorous and evidence-based?",
  },
  {
    key: "actionability" as const,
    label: "Actionability",
    description: "Are the recommendations specific and implementable?",
  },
  {
    key: "context" as const,
    label: "Nigerian Context",
    description: "Does it account for local healthcare realities?",
  },
  {
    key: "clientReady" as const,
    label: "Client-Ready",
    description: "Is the formatting and presentation professional?",
  },
];

type RubricKey = "technical" | "actionability" | "context" | "clientReady";

export default function DeliverableReview({
  deliverable,
  isEM = false,
  userId,
  userName,
}: {
  deliverable: Deliverable;
  isEM?: boolean;
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<RubricKey, number>>({
    technical: 0,
    actionability: 0,
    context: 0,
    clientReady: 0,
  });
  const [notes, setNotes] = useState(deliverable.reviewNotes ?? "");
  const [microFeedback, setMicroFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"approved" | "revision" | "delivered" | null>(null);
  const [error, setError] = useState("");
  const [delivering, setDelivering] = useState(false);

  // Management state
  const [showManage, setShowManage] = useState(false);
  const [editName, setEditName] = useState(deliverable.name);
  const [editDesc, setEditDesc] = useState(deliverable.description);
  const [editDueDate, setEditDueDate] = useState(deliverable.dueDate?.split("T")[0] ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Reassignment state
  const [showReassign, setShowReassign] = useState(false);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassigning, setReassigning] = useState(false);

  async function handleSaveEdits() {
    setSaving(true);
    setSaveMsg("");
    try {
      const body: Record<string, unknown> = {};
      if (editName !== deliverable.name) body.name = editName;
      if (editDesc !== deliverable.description) body.description = editDesc;
      const dueDateISO = editDueDate ? new Date(editDueDate).toISOString() : null;
      if (dueDateISO !== (deliverable.dueDate ?? null)) body.dueDate = dueDateISO;
      if (Object.keys(body).length === 0) {
        setSaveMsg("No changes to save.");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/deliverables/${deliverable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveMsg("Saved.");
      setTimeout(() => router.refresh(), 800);
    } catch {
      setSaveMsg("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function loadAssignments() {
    setLoadingAssignments(true);
    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}/assignments`);
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAssignments(false);
    }
  }

  async function handleReassign() {
    if (!selectedAssignmentId) return;
    setReassigning(true);
    setError("");
    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: selectedAssignmentId, reason: reassignReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setShowReassign(false);
      setShowManage(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign.");
    } finally {
      setReassigning(false);
    }
  }

  const alreadyDelivered = deliverable.status === "DELIVERED_TO_CLIENT";
  const alreadyReviewed = deliverable.status === "APPROVED" || alreadyDelivered;
  const canReview = !alreadyReviewed && deliverable.status !== "DRAFT";

  const isAssignedConsultant = deliverable.assignment?.consultant?.id === userId;
  const canUpload = isEM || isAssignedConsultant;

  const allScored = Object.values(scores).every((s) => s > 0);
  const avgScore = allScored
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / 4).toFixed(1)
    : null;

  async function deliverToClient() {
    setDelivering(true);
    setError("");
    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}/deliver`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setResult("delivered");
      setTimeout(() => router.push(`/projects/${deliverable.project.id}?tab=deliverables`), 1800);
    } catch {
      setError("Failed to mark as delivered. Please try again.");
    } finally {
      setDelivering(false);
    }
  }

  async function submit(action: "approve" | "request_revision") {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/deliverables/${deliverable.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, scores: allScored ? scores : null, notes, microFeedback: action === "approve" ? microFeedback || null : null }),
      });
      if (!res.ok) throw new Error("Failed");
      setResult(action === "approve" ? "approved" : "revision");
      setTimeout(() => router.push(`/projects/${deliverable.project.id}?tab=deliverables`), 1800);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <Link
          href={`/projects/${deliverable.project.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to {deliverable.project.name}
        </Link>

        {/* Success state */}
        {result && (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: result === "approved" ? "#ECFDF5" : "#FFFBEB",
              border: `1px solid ${result === "approved" ? "#A7F3D0" : "#FDE68A"}`,
            }}
          >
            {result === "approved" ? (
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            ) : (
              <RotateCcw size={32} className="text-amber-500 mx-auto mb-3" />
            )}
            <p className="font-semibold text-gray-900">
              {result === "approved"
                ? "Deliverable approved"
                : result === "delivered"
                ? "Delivered to client"
                : "Revision requested"}
            </p>
            <p className="text-sm text-gray-500 mt-1">Redirecting you back...</p>
          </div>
        )}

        {/* Deliverable info */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={15} className="text-gray-400" />
                <StatusBadge status={deliverable.status} />
                {deliverable.version > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    v{deliverable.version}
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-gray-900">{deliverable.name}</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{deliverable.description}</p>
            </div>
          </div>

          {/* Meta row */}
          <div
            className="mt-4 pt-4 flex flex-wrap gap-4 text-xs text-gray-400"
            style={{ borderTop: "1px solid #f0f0f0" }}
          >
            {deliverable.assignment && (
              <span className="flex items-center gap-1">
                <User size={11} />
                {deliverable.assignment.consultant.name}
                {deliverable.assignment.consultant.consultantProfile && (
                  <span className="text-gray-300">
                    · {deliverable.assignment.consultant.consultantProfile.title}
                  </span>
                )}
              </span>
            )}
            {deliverable.submittedAt && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                Submitted {timeAgo(new Date(deliverable.submittedAt))}
              </span>
            )}
            {deliverable.assignment?.consultant.consultantProfile && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {deliverable.assignment.consultant.consultantProfile.location}
              </span>
            )}
          </div>

          {deliverable.fileUrl && (
            <a
              href={deliverable.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "#F3F4F6", color: "#374151" }}
            >
              <FileText size={14} />
              Download File
            </a>
          )}
        </div>

        {/* Manage deliverable */}
        {isEM && !result && (
          <div>
            <button
              onClick={() => setShowManage(!showManage)}
              className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              style={{
                background: showManage ? "#F1F5F9" : "transparent",
                color: "#64748B",
              }}
            >
              <Settings size={13} />
              {showManage ? "Hide" : "Manage Deliverable"}
            </button>

            {showManage && (
              <div
                className="mt-3 rounded-xl p-5 space-y-4"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <h3 className="text-sm font-semibold text-gray-900">Edit Deliverable</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="text-sm rounded-lg px-3 py-2 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveEdits}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "#0F2744" }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Save Changes
                  </button>
                  {saveMsg && (
                    <span className="text-xs text-gray-500">{saveMsg}</span>
                  )}
                </div>

                {/* Reassignment */}
                <div className="pt-4" style={{ borderTop: "1px solid #f0f0f0" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <RefreshCw size={14} />
                        Reassign Consultant
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Transfer this deliverable to another consultant on the project. Status will reset to Draft.
                      </p>
                    </div>
                    {!showReassign && (
                      <button
                        onClick={() => {
                          setShowReassign(true);
                          loadAssignments();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}
                      >
                        Reassign
                      </button>
                    )}
                  </div>

                  {showReassign && (
                    <div className="space-y-3">
                      {loadingAssignments ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                          <Loader2 size={12} className="animate-spin" /> Loading consultants...
                        </div>
                      ) : assignments.length === 0 ? (
                        <p className="text-xs text-gray-400">No other active consultants on this project.</p>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Select Consultant
                            </label>
                            <select
                              value={selectedAssignmentId}
                              onChange={(e) => setSelectedAssignmentId(e.target.value)}
                              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                              style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                            >
                              <option value="">Choose a consultant...</option>
                              {assignments
                                .filter((a) => a.id !== (deliverable.assignmentId ?? deliverable.assignment?.id))
                                .map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.consultant.name}
                                    {a.consultant.consultantProfile?.title
                                      ? ` - ${a.consultant.consultantProfile.title}`
                                      : ""}
                                    {` (${a.role})`}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Reason for reassignment
                            </label>
                            <textarea
                              value={reassignReason}
                              onChange={(e) => setReassignReason(e.target.value)}
                              placeholder="e.g. Original consultant unable to deliver on time..."
                              rows={2}
                              className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
                              style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleReassign}
                              disabled={reassigning || !selectedAssignmentId}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                              style={{ background: "#D97706" }}
                            >
                              {reassigning ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              Confirm Reassignment
                            </button>
                            <button
                              onClick={() => {
                                setShowReassign(false);
                                setSelectedAssignmentId("");
                                setReassignReason("");
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50"
                            >
                              <X size={12} />
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Version history */}
        <VersionHistory
          deliverableId={deliverable.id}
          currentVersion={deliverable.version}
          canUpload={
            canUpload &&
            deliverable.status !== "APPROVED" &&
            deliverable.status !== "DELIVERED_TO_CLIENT"
          }
        />

        {/* Comment thread */}
        <CommentThread deliverableId={deliverable.id} currentUserName={userName} />

        {/* Already reviewed */}
        {alreadyReviewed && (
          <div
            className="rounded-xl p-5"
            style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    {alreadyDelivered ? "Delivered to client" : "Deliverable approved"}
                  </p>
                  {deliverable.reviewScore && (
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Score: {deliverable.reviewScore}/10
                    </p>
                  )}
                </div>
              </div>
              {/* Deliver to Client button - only for approved (not yet delivered) */}
              {isEM && deliverable.status === "APPROVED" && !result && (
                <button
                  onClick={deliverToClient}
                  disabled={delivering}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "#0F2744" }}
                >
                  {delivering ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Deliver to Client
                </button>
              )}
            </div>
          </div>
        )}

        {/* Review form */}
        {canReview && !result && (
          <>
            {/* AI pre-score */}
            {isEM && (
              <AIQualityScore
                deliverableId={deliverable.id}
                onScoresLoaded={(loaded) =>
                  setScores((prev) => ({ ...prev, ...(loaded as typeof prev) }))
                }
              />
            )}

            <div
              className="rounded-xl p-5 space-y-5"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Quality Rubric</h3>
                {avgScore && (
                  <span className="text-sm font-bold" style={{ color: "#D4AF37" }}>
                    <Star size={14} className="inline mr-1 text-amber-400" />
                    {avgScore}/5 avg
                  </span>
                )}
              </div>

              {RUBRIC.map(({ key, label, description }) => (
                <div key={key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        onClick={() => setScores((s) => ({ ...s, [key]: v }))}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: scores[key] >= v ? "#0F2744" : "#F3F4F6",
                          color: scores[key] >= v ? "#fff" : "#9CA3AF",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div
              className="rounded-xl p-5"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Feedback Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add feedback for the consultant (required for revision requests)..."
                rows={4}
                className="w-full text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => submit("request_revision")}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RotateCcw size={15} />
                )}
                Request Revision
              </button>
              <div className="flex-1 space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  {["Great work", "Well structured", "Thorough analysis", "Strong delivery"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setMicroFeedback(microFeedback === tag ? "" : tag)}
                      className="px-2 py-1 rounded-full text-[10px] font-medium transition-all"
                      style={{
                        background: microFeedback === tag ? "#10B981" : "#F0FDF4",
                        color: microFeedback === tag ? "#fff" : "#065F46",
                        border: microFeedback === tag ? "1px solid #10B981" : "1px solid #BBF7D0",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => submit("approve")}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#10B981", color: "#fff" }}
                >
                  {submitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle size={15} />
                  )}
                  Approve{microFeedback ? ` + "${microFeedback}"` : ""}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
