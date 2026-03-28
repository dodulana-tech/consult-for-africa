"use client";

import { useState, useRef, useEffect, useCallback, FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING =
  "Hi, I am Nuru, Consult For Africa's AI assistant. How can I help you learn about our healthcare consulting services?";

export default function NuruChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll to bottom when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Focus input when panel opens */
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || loading) return;

      const userMsg: Message = { role: "user", content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setLoading(true);

      // Add a placeholder assistant message for streaming
      const assistantIdx = updatedMessages.length;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          setMessages((prev) => {
            const copy = [...prev];
            copy[assistantIdx] = {
              role: "assistant",
              content:
                res.status === 429
                  ? "You are sending messages too quickly. Please wait a moment."
                  : errText || "Something went wrong. Please try again.",
            };
            return copy;
          });
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[assistantIdx] = {
              role: "assistant",
              content: "Something went wrong. Please try again.",
            };
            return copy;
          });
          setLoading(false);
          return;
        }

        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const current = accumulated;
          setMessages((prev) => {
            const copy = [...prev];
            copy[assistantIdx] = { role: "assistant", content: current };
            return copy;
          });
        }
      } catch {
        setMessages((prev) => {
          const copy = [...prev];
          copy[assistantIdx] = {
            role: "assistant",
            content:
              "I could not connect. Please check your internet and try again.",
          };
          return copy;
        });
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages]
  );

  return (
    <>
      {/* ── Chat Panel ── */}
      <div
        className={`fixed bottom-20 right-4 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-[400px] transition-all duration-300 origin-bottom-right ${
          open
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-[min(500px,70vh)] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0F2744] text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4A574] flex items-center justify-center text-[#0F2744] font-bold text-sm">
                N
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Nuru</p>
                <p className="text-[11px] text-gray-300">C4A AI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-gray-100 text-gray-900 rounded-br-sm"
                      : "bg-white border-l-[3px] border-[#0F2744] text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about our services..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]/50 focus:border-[#D4A574] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="p-2 bg-[#D4A574] text-white rounded-lg hover:bg-[#c49564] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close Nuru chat" : "Open Nuru chat"}
        className="fixed bottom-4 right-4 sm:right-6 z-[9999] w-14 h-14 rounded-full bg-[#0F2744] text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
      >
        {open ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {/* Gold accent dot */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#D4A574] rounded-full border-2 border-[#0F2744]" />
          </>
        )}
      </button>
    </>
  );
}
