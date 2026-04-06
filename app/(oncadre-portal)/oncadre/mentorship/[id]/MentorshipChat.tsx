"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface MentorshipChatProps {
  mentorshipId: string;
  currentUserId: string;
  role: "mentor" | "mentee";
  status: string;
  initialMessages: Message[];
  mentorName: string;
  menteeName: string;
  topic: string;
  rating: number | null;
}

export default function MentorshipChat({
  mentorshipId,
  currentUserId,
  role,
  status,
  initialMessages,
  mentorName,
  menteeName,
  topic,
  rating,
}: MentorshipChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(rating !== null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    const text = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/cadre/mentorship/${mentorshipId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...data.message, createdAt: data.message.createdAt } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cadre/mentorship/${mentorshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action}`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRating = async () => {
    if (ratingValue === 0) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cadre/mentorship/${mentorshipId}/rate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: ratingValue,
            feedback: feedback.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit rating");
      }

      setRatingSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const partnerName = role === "mentor" ? menteeName : mentorName;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-2xl border bg-white px-4 py-3 sm:px-6"
        style={{ borderColor: "#E8EBF0" }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/oncadre/mentorship"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-gray-100"
          >
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </a>
          <div>
            <h2 className="text-sm font-bold text-gray-900">{partnerName}</h2>
            <p className="text-[10px] text-gray-500">{topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{
              background:
                status === "ACTIVE"
                  ? "#ECFDF5"
                  : status === "REQUESTED"
                    ? "#FFFBEB"
                    : status === "COMPLETED"
                      ? "#EFF6FF"
                      : "#F1F5F9",
              color:
                status === "ACTIVE"
                  ? "#059669"
                  : status === "REQUESTED"
                    ? "#D97706"
                    : status === "COMPLETED"
                      ? "#2563EB"
                      : "#64748B",
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Action buttons for mentor on REQUESTED status */}
      {role === "mentor" && status === "REQUESTED" && (
        <div
          className="flex items-center justify-between border-x border-b bg-amber-50 px-4 py-3 sm:px-6"
          style={{ borderColor: "#E8EBF0" }}
        >
          <p className="text-sm text-amber-800">
            {menteeName} has requested mentorship on: <strong>{topic}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("decline")}
              disabled={actionLoading}
              className="rounded-lg border bg-white px-4 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "#E8EBF0" }}
            >
              Decline
            </button>
            <button
              onClick={() => handleAction("accept")}
              disabled={actionLoading}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, #059669, #047857)",
              }}
            >
              {actionLoading ? "..." : "Accept"}
            </button>
          </div>
        </div>
      )}

      {/* Complete button for mentor on ACTIVE status */}
      {role === "mentor" && status === "ACTIVE" && (
        <div
          className="flex items-center justify-end border-x border-b bg-white px-4 py-2 sm:px-6"
          style={{ borderColor: "#E8EBF0" }}
        >
          <button
            onClick={() => handleAction("complete")}
            disabled={actionLoading}
            className="rounded-lg border px-4 py-1.5 text-xs font-medium transition hover:bg-blue-50 disabled:opacity-50"
            style={{ borderColor: "#BFDBFE", color: "#2563EB" }}
          >
            {actionLoading ? "..." : "Mark Complete"}
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto border-x bg-white"
        style={{ borderColor: "#E8EBF0" }}
      >
        <div className="p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "#0B3C5D08" }}
              >
                <svg
                  className="h-8 w-8"
                  style={{ color: "#0B3C5D" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                No messages yet
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {status === "ACTIVE"
                  ? "Start the conversation!"
                  : status === "REQUESTED"
                    ? role === "mentor"
                      ? "Accept the request to start messaging."
                      : "Waiting for your mentor to accept."
                    : "This mentorship has ended."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[85%] gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      {!isMe && (
                        <div
                          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{
                            background:
                              "linear-gradient(135deg, #0B3C5D, #0d4a73)",
                          }}
                        >
                          {partnerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      )}
                      <div
                        className="rounded-2xl px-4 py-3"
                        style={{
                          background: isMe
                            ? "linear-gradient(135deg, #0B3C5D, #0d4a73)"
                            : "#F8F9FB",
                          color: isMe ? "white" : "#1f2937",
                          borderBottomRightRadius: isMe
                            ? "4px"
                            : undefined,
                          borderBottomLeftRadius: !isMe
                            ? "4px"
                            : undefined,
                        }}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.content}
                        </div>
                        <div
                          className={`mt-1.5 text-[10px] ${isMe ? "text-white/40" : "text-gray-400"}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString(
                            "en-NG",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div
                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, #0B3C5D, #0d4a73)",
                      }}
                    >
                      ...
                    </div>
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background: "#F8F9FB",
                        borderBottomLeftRadius: "4px",
                      }}
                    >
                      <div className="flex gap-1.5">
                        <div
                          className="h-2 w-2 animate-bounce rounded-full"
                          style={{
                            background: "#D4AF37",
                            animationDelay: "0ms",
                          }}
                        />
                        <div
                          className="h-2 w-2 animate-bounce rounded-full"
                          style={{
                            background: "#D4AF37",
                            animationDelay: "150ms",
                          }}
                        />
                        <div
                          className="h-2 w-2 animate-bounce rounded-full"
                          style={{
                            background: "#D4AF37",
                            animationDelay: "300ms",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="border-x bg-red-50 px-4 py-2 text-xs text-red-600"
          style={{ borderColor: "#E8EBF0" }}
        >
          {error}
        </div>
      )}

      {/* Rating form for mentee + COMPLETED */}
      {role === "mentee" && status === "COMPLETED" && !ratingSubmitted && (
        <div
          className="border-x border-b rounded-b-2xl bg-white p-4 sm:p-6"
          style={{ borderColor: "#E8EBF0" }}
        >
          <h3 className="text-sm font-bold text-gray-900">
            Rate your mentorship experience
          </h3>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingValue(star)}
                className="transition hover:scale-110"
              >
                <svg
                  className="h-8 w-8"
                  fill={star <= ratingValue ? "#D4AF37" : "#E8EBF0"}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={2}
            className="mt-3 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
            style={{ borderColor: "#E8EBF0" }}
          />
          <button
            onClick={handleRating}
            disabled={ratingValue === 0 || actionLoading}
            className="mt-3 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #b8962e)",
            }}
          >
            {actionLoading ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}

      {/* Rating submitted message */}
      {role === "mentee" && status === "COMPLETED" && ratingSubmitted && (
        <div
          className="border-x border-b rounded-b-2xl bg-white p-4 text-center sm:p-6"
          style={{ borderColor: "#E8EBF0" }}
        >
          <p className="text-sm font-medium text-gray-500">
            Thank you for rating your mentorship experience!
          </p>
        </div>
      )}

      {/* Input area - only if ACTIVE */}
      {status === "ACTIVE" && (
        <div
          className="rounded-b-2xl border-x border-b bg-white p-3"
          style={{ borderColor: "#E8EBF0" }}
        >
          <div
            className="flex items-end gap-2 rounded-xl border p-2"
            style={{
              borderColor: "#E8EBF0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
              style={{ maxHeight: "120px" }}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-30"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, #0B3C5D, #0d4a73)"
                  : "#E8EBF0",
              }}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
