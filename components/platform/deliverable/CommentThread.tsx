"use client";

import { useState, useEffect } from "react";
import { Send, CornerDownRight } from "lucide-react";

interface CommentBase {
  id: string;
  content: string;
  authorName: string;
  authorType: string;
  authorId: string;
  resolved: boolean;
  createdAt: string;
}

interface Comment extends CommentBase {
  replies: CommentBase[];
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
      style={{ background: "#0F2744" }}
    >
      {initial}
    </div>
  );
}

export default function CommentThread({
  deliverableId,
  currentUserName,
}: {
  deliverableId: string;
  currentUserName: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetch(`/api/deliverables/${deliverableId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
      })
      .finally(() => setLoading(false));
  }, [deliverableId]);

  async function postComment(content: string, parentId?: string) {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/deliverables/${deliverableId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), parentId }),
      });
      if (!res.ok) return;
      const { comment } = await res.json();
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId ? { ...c, replies: [...c.replies, comment] } : c
          )
        );
        setReplyTo(null);
        setReplyContent("");
      } else {
        setComments((prev) => [...prev, { ...comment, replies: [] }]);
        setNewComment("");
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <h3 className="text-sm font-semibold text-gray-900">Comments</h3>

      {loading ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400">No comments yet. Be the first to add one.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="space-y-2">
              {/* Parent comment */}
              <div className="flex gap-3">
                <Avatar name={c.authorName} />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-900">{c.authorName}</span>
                    <span className="text-[10px] text-gray-400">
                      {timeAgo(new Date(c.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                  <button
                    onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                    className="text-[10px] text-gray-400 hover:text-gray-700 mt-1"
                  >
                    Reply
                  </button>
                </div>
              </div>

              {/* Replies */}
              {c.replies.length > 0 && (
                <div className="ml-10 space-y-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <CornerDownRight size={12} className="text-gray-300 mt-1 shrink-0" />
                      <Avatar name={r.authorName} />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-gray-900">
                            {r.authorName}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {timeAgo(new Date(r.createdAt))}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyTo === c.id && (
                <div className="ml-10 flex gap-2">
                  <input
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        postComment(replyContent, c.id);
                      }
                    }}
                    placeholder="Write a reply..."
                    className="flex-1 text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                  />
                  <button
                    onClick={() => postComment(replyContent, c.id)}
                    disabled={!replyContent.trim() || posting}
                    className="px-3 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ background: "#0F2744" }}
                  >
                    <Send size={12} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
        <Avatar name={currentUserName} />
        <div className="flex-1 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                postComment(newComment);
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
          />
          <button
            onClick={() => postComment(newComment)}
            disabled={!newComment.trim() || posting}
            className="px-3 py-2 rounded-lg disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
