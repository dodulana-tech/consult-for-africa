"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, User, Bot, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const EXAMPLE_QUESTIONS = [
  "Which projects are at risk right now?",
  "Who are our top available consultants?",
  "What's our total budget across active projects?",
  "Which deliverables need review?",
  "Show me projects over budget",
  "Which consultant has the highest rating?",
];

export default function AskAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(question?: string) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answer = res.ok ? data.answer : data || "Something went wrong. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #e5eaf0" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#0F2744" }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Ask Imara</p>
            <p className="text-[11px] text-gray-400">Natural language insights from your platform data</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 text-center">Ask anything about your projects, consultants, or performance.</p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity leading-snug"
                  style={{ background: "#F0F4FF", color: "#0F2744", border: "1px solid #C7D7FF" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#0F2744" }}
                >
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  m.role === "user"
                    ? { background: "#0F2744", color: "#fff", borderRadius: "18px 18px 4px 18px" }
                    : { background: "#F9FAFB", color: "#374151", border: "1px solid #e5eaf0", borderRadius: "4px 18px 18px 18px" }
                }
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gray-200"
                >
                  <User size={12} className="text-gray-500" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "#0F2744" }}>
              <Bot size={12} className="text-white" />
            </div>
            <div
              className="px-4 py-2.5 rounded-2xl flex items-center gap-1.5"
              style={{ background: "#F9FAFB", border: "1px solid #e5eaf0", borderRadius: "4px 18px 18px 18px" }}
            >
              <Loader2 size={12} className="animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid #e5eaf0" }}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask Imara about projects, consultants, revenue..."
            className="flex-1 text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
            style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
            style={{ background: "#0F2744" }}
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
