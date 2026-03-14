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
  submittedAt: string | null;
  reviewScore: number | null;
  reviewNotes: string | null;
  fileUrl: string | null;
  project: { id: string; name: string };
  assignment: {
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
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"approved" | "revision" | "delivered" | null>(null);
  const [error, setError] = useState("");
  const [delivering, setDelivering] = useState(false);

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
        body: JSON.stringify({ action, scores: allScored ? scores : null, notes }),
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
              <button
                onClick={() => submit("approve")}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#10B981", color: "#fff" }}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                Approve
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
