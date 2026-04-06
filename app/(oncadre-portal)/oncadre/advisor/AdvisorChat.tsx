"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Professional {
  firstName: string;
  lastName: string;
  cadre: string;
  subSpecialty: string | null;
  yearsOfExperience: number | null;
}

const STARTER_QUESTIONS = [
  "What should I do to improve my employability?",
  "Should I pursue a fellowship or emigrate?",
  "What is the fastest path to practising in the UK?",
  "How do I increase my salary?",
  "What certifications would make the biggest impact?",
  "Help me plan my next 2 years",
];

export default function AdvisorChat({
  initialMessages,
  professional,
}: {
  initialMessages: Message[];
  professional: Professional;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/cadre/career-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await res.json();

      const advisorMsg: Message = {
        id: `resp-${Date.now()}`,
        role: "advisor",
        content: data.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, advisorMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Remove optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Career Advisor</h1>
            <p className="text-xs text-gray-500">
              Your personal career guide for {professional.cadre}
            </p>
          </div>
        </div>
        <Link
          href="/oncadre/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl border bg-white"
        style={{ borderColor: "#E8EBF0" }}
      >
        <div className="p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{ background: "linear-gradient(135deg, #0B3C5D10, #D4AF3715)" }}
              >
                <svg className="h-10 w-10" style={{ color: "#0B3C5D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Hello, {professional.firstName}
              </h3>
              <p className="mt-2 max-w-md text-center text-sm text-gray-500">
                I am your career advisor, specializing in {professional.cadre} careers
                {professional.subSpecialty ? ` with a focus on ${professional.subSpecialty}` : ""}.
                Ask me anything about your career path, salary expectations, certifications, or international opportunities.
              </p>

              {/* Starter questions */}
              <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {STARTER_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={sending}
                    className="rounded-xl border p-3 text-left text-xs font-medium text-gray-600 transition-all hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 hover:text-gray-900 disabled:opacity-50"
                    style={{ borderColor: "#E8EBF0" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[85%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "advisor" && (
                      <div
                        className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
                      >
                        CH
                      </div>
                    )}
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, #0B3C5D, #0d4a73)"
                          : "#F8F9FB",
                        color: msg.role === "user" ? "white" : "#1f2937",
                        borderBottomRightRadius: msg.role === "user" ? "4px" : undefined,
                        borderBottomLeftRadius: msg.role === "advisor" ? "4px" : undefined,
                      }}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </div>
                      <div className={`mt-1.5 text-[10px] ${msg.role === "user" ? "text-white/40" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div
                      className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
                    >
                      CH
                    </div>
                    <div className="rounded-2xl px-4 py-3" style={{ background: "#F8F9FB", borderBottomLeftRadius: "4px" }}>
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 animate-bounce rounded-full" style={{ background: "#D4AF37", animationDelay: "0ms" }} />
                        <div className="h-2 w-2 animate-bounce rounded-full" style={{ background: "#D4AF37", animationDelay: "150ms" }} />
                        <div className="h-2 w-2 animate-bounce rounded-full" style={{ background: "#D4AF37", animationDelay: "300ms" }} />
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
        <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="mt-3">
        <div
          className="flex items-end gap-2 rounded-2xl border bg-white p-2"
          style={{ borderColor: "#E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your career..."
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            style={{ maxHeight: "120px" }}
            disabled={sending}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-30"
            style={{
              background: input.trim() ? "linear-gradient(135deg, #0B3C5D, #0d4a73)" : "#E8EBF0",
            }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-400">
          Your career advisor is here to help. Advice is based on your professional profile.
        </p>
      </div>
    </div>
  );
}
