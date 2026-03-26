"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface DeliverableVersion {
  id: string;
  versionNumber: number;
  fileUrl: string | null;
  fileName: string | null;
  changeNotes: string | null;
  submittedAt: string;
}

interface DeliverableComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorType: "INTERNAL" | "CLIENT";
  parentId: string | null;
  isResolved: boolean;
  createdAt: string;
}

interface DeliverableData {
  id: string;
  name: string;
  description: string;
  status: string;
  fileUrl: string | null;
  dueDate: string | null;
  submittedAt: string | null;
  reviewStage: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  engagement: { id: string; name: string; clientId: string };
  versions: DeliverableVersion[];
  comments: DeliverableComment[];
}

/* ─── Style Maps ─────────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:               { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  SUBMITTED:           { bg: "#FEF3C7", color: "#92400E", label: "Submitted" },
  IN_REVIEW:           { bg: "#DBEAFE", color: "#1D4ED8", label: "In Review" },
  NEEDS_REVISION:      { bg: "#FEE2E2", color: "#991B1B", label: "Revision Requested" },
  APPROVED:            { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
  DELIVERED_TO_CLIENT: { bg: "#DCFCE7", color: "#166534", label: "Delivered" },
};

const AUTHOR_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  INTERNAL: { bg: "#EFF6FF", color: "#1D4ED8", label: "C4A Team" },
  CLIENT:   { bg: "#FEF9E7", color: "#92400E", label: "Client" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

/* ─── Component ──────────────────────────────────────────────────────────────── */

export default function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ id: string; deliverableId: string }>;
}) {
  const [projectId, setProjectId] = useState<string>("");
  const [deliverableId, setDeliverableId] = useState<string>("");
  const [deliverable, setDeliverable] = useState<DeliverableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment form state
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setProjectId(p.id);
      setDeliverableId(p.deliverableId);
    });
  }, [params]);

  const fetchDeliverable = useCallback(async () => {
    if (!deliverableId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/client-portal/deliverables/${deliverableId}`);
      if (res.status === 401) {
        window.location.href = "/client/login";
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load deliverable");
      }
      const data: DeliverableData = await res.json();
      setDeliverable(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [deliverableId]);

  useEffect(() => {
    fetchDeliverable();
  }, [fetchDeliverable]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !deliverableId) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/client-portal/deliverables/${deliverableId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: commentText.trim(),
            parentId: replyingTo,
          }),
        }
      );
      if (res.status === 401) {
        window.location.href = "/client/login";
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to post comment");
      }
      setCommentText("");
      setReplyingTo(null);
      // Refresh deliverable to get updated comments
      await fetchDeliverable();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  // Build comment tree
  function buildCommentTree(comments: DeliverableComment[]) {
    const topLevel = comments.filter((c) => !c.parentId);
    const replies = comments.filter((c) => c.parentId);
    const replyMap = new Map<string, DeliverableComment[]>();
    for (const r of replies) {
      const existing = replyMap.get(r.parentId!) ?? [];
      existing.push(r);
      replyMap.set(r.parentId!, existing);
    }
    return { topLevel, replyMap };
  }

  /* ─── Loading / Error ─── */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFB" }}>
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "#e5eaf0", borderTopColor: "#0F2744" }}
          />
          <p className="text-sm text-gray-500">Loading deliverable...</p>
        </div>
      </div>
    );
  }

  if (error || !deliverable) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFB" }}>
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error || "Deliverable not found"}</p>
          <Link
            href={projectId ? `/client/projects/${projectId}` : "/client/dashboard"}
            className="text-sm font-medium hover:underline"
            style={{ color: "#0F2744" }}
          >
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[deliverable.status] ?? STATUS_STYLES.DRAFT;
  const { topLevel, replyMap } = buildCommentTree(deliverable.comments);

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Client Portal
            </span>
            <span className="text-gray-300 text-sm">/</span>
            <Link
              href="/client/dashboard"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Projects
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <Link
              href={`/client/projects/${projectId}`}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors truncate max-w-[120px]"
            >
              {deliverable.engagement.name}
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <span
              className="text-sm font-medium truncate max-w-[160px]"
              style={{ color: "#0F2744" }}
            >
              {deliverable.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          href={`/client/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: "#0F2744" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to project
        </Link>

        {/* ── Deliverable Hero Card ── */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <div className="h-1" style={{ background: "#D4AF37" }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                    {deliverable.name}
                  </h1>
                  <span
                    className="text-[11px] px-3 py-1 rounded-full font-semibold"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                {deliverable.description && (
                  <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                    {deliverable.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {deliverable.dueDate && (
                    <span className="text-xs text-gray-400">
                      Due: {formatDate(deliverable.dueDate)}
                    </span>
                  )}
                  {deliverable.submittedAt && (
                    <span className="text-xs text-gray-400">
                      Submitted: {formatDate(deliverable.submittedAt)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    Version {deliverable.version}
                  </span>
                </div>
              </div>
              {deliverable.fileUrl && (
                <a
                  href={deliverable.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg transition-opacity hover:opacity-90 shrink-0"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 2v7.5M7 9.5L4.5 7M7 9.5L9.5 7M3 11.5h8"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download Latest
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Version History ── */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-sm font-semibold mb-5" style={{ color: "#0F2744" }}>
            Version History
          </h2>

          {deliverable.versions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No versions recorded yet.
            </p>
          ) : (
            <div className="space-y-0">
              {deliverable.versions.map((v, idx) => {
                const isLatest = idx === 0;
                const isLast = idx === deliverable.versions.length - 1;

                return (
                  <div key={v.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{
                          background: isLatest ? "#D4AF37" : "#e5eaf0",
                        }}
                      />
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{ background: "#e5eaf0", minHeight: "24px" }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                              Version {v.versionNumber}
                            </p>
                            {isLatest && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "#D1FAE5", color: "#065F46" }}
                              >
                                Latest
                              </span>
                            )}
                          </div>
                          {v.fileName && (
                            <p className="text-xs text-gray-500 mt-0.5">{v.fileName}</p>
                          )}
                          {v.changeNotes && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-lg">
                              {v.changeNotes}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">
                            {formatDateTime(v.submittedAt)}
                          </p>
                        </div>
                        {v.fileUrl && (
                          <a
                            href={v.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 shrink-0"
                            style={{ background: "#F8FAFB", color: "#0F2744", border: "1px solid #e5eaf0" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                              <path
                                d="M7 2v7.5M7 9.5L4.5 7M7 9.5L9.5 7M3 11.5h8"
                                stroke="currentColor"
                                strokeWidth="1.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Comments Thread ── */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-sm font-semibold mb-5" style={{ color: "#0F2744" }}>
            Comments
            {deliverable.comments.length > 0 && (
              <span className="text-gray-400 font-normal ml-2">
                ({deliverable.comments.length})
              </span>
            )}
          </h2>

          {deliverable.comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No comments yet. Be the first to leave feedback.
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              {topLevel.map((comment) => {
                const authorStyle =
                  AUTHOR_TYPE_STYLES[comment.authorType] ?? AUTHOR_TYPE_STYLES.CLIENT;
                const childReplies = replyMap.get(comment.id) ?? [];

                return (
                  <div key={comment.id}>
                    {/* Top-level comment */}
                    <div
                      className="rounded-xl px-5 py-4"
                      style={{ background: "#FAFBFC", border: "1px solid #e5eaf0" }}
                    >
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{
                            background:
                              comment.authorType === "CLIENT" ? "#D4AF37" : "#0F2744",
                          }}
                        >
                          {comment.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "#0F2744" }}
                        >
                          {comment.authorName}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: authorStyle.bg, color: authorStyle.color }}
                        >
                          {authorStyle.label}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-auto">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        className="text-[11px] font-medium mt-2 transition-colors hover:opacity-80"
                        style={{ color: "#D4AF37" }}
                      >
                        {replyingTo === comment.id ? "Cancel reply" : "Reply"}
                      </button>
                    </div>

                    {/* Replies */}
                    {childReplies.length > 0 && (
                      <div className="ml-8 mt-2 space-y-2">
                        {childReplies.map((reply) => {
                          const replyAuthorStyle =
                            AUTHOR_TYPE_STYLES[reply.authorType] ??
                            AUTHOR_TYPE_STYLES.CLIENT;
                          return (
                            <div
                              key={reply.id}
                              className="rounded-xl px-4 py-3"
                              style={{
                                background: "#F8FAFB",
                                border: "1px solid #e5eaf0",
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                  style={{
                                    background:
                                      reply.authorType === "CLIENT"
                                        ? "#D4AF37"
                                        : "#0F2744",
                                  }}
                                >
                                  {reply.authorName.charAt(0).toUpperCase()}
                                </div>
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: "#0F2744" }}
                                >
                                  {reply.authorName}
                                </span>
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: replyAuthorStyle.bg,
                                    color: replyAuthorStyle.color,
                                  }}
                                >
                                  {replyAuthorStyle.label}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-auto">
                                  {formatDateTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline reply form */}
                    {replyingTo === comment.id && (
                      <form
                        onSubmit={handleSubmitComment}
                        className="ml-8 mt-2"
                      >
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{ border: "1px solid #D4AF37" }}
                        >
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={`Reply to ${comment.authorName}...`}
                            rows={2}
                            className="w-full px-4 py-3 text-sm resize-none focus:outline-none"
                            style={{ background: "#FAFBFC" }}
                          />
                          <div
                            className="flex items-center justify-end gap-2 px-3 py-2"
                            style={{ background: "#F8FAFB", borderTop: "1px solid #e5eaf0" }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(null);
                                setCommentText("");
                              }}
                              className="text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submitting || !commentText.trim()}
                              className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                              style={{ background: "#0F2744", color: "#fff" }}
                            >
                              {submitting ? "Sending..." : "Reply"}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add comment form (top-level) */}
          {!replyingTo && (
            <form onSubmit={handleSubmitComment}>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave a comment on this deliverable..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm resize-none focus:outline-none"
                  style={{ background: "#FAFBFC" }}
                />
                <div
                  className="flex items-center justify-end px-3 py-2"
                  style={{ background: "#F8FAFB", borderTop: "1px solid #e5eaf0" }}
                >
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="text-xs font-semibold px-5 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#0F2744", color: "#fff" }}
                  >
                    {submitting ? "Sending..." : "Post Comment"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
