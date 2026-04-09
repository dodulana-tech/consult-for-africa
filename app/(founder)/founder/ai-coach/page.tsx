"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, User, Bot, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; createdAt?: string };

const SUGGESTED_QUESTIONS = [
  "What should I prioritise this week?",
  "How do I get CadreHealth outreach converting?",
  "What's the fastest path to first N10M in revenue?",
  "Should I focus on consulting delivery or product growth?",
  "How do I structure the Dr. Kumar engagement for maximum LTV?",
  "What's my biggest blindspot right now?",
  "How should I price the agent commission model?",
  "How do I get partner firms sending us staffing requests?",
];

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/founder/ai-coach");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Flatten: each record has question + answer
            const flattened: Message[] = [];
            for (const item of data) {
              flattened.push({ role: "user", content: item.question, createdAt: item.createdAt });
              flattened.push({ role: "assistant", content: item.answer, createdAt: item.createdAt });
            }
            setMessages(flattened);
          }
        }
      } finally {
        setHistoryLoaded(true);
      }
    }
    loadHistory();
  }, []);

  // Auto-scroll
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
      const res = await fetch("/api/founder/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answer = res.ok ? (data.answer ?? data) : "Something went wrong. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const showSuggestions = historyLoaded && messages.length === 0;

  return (
    <div className="flex flex-col h-full max-h-screen">

      {/* Header */}
      <div className="px-6 py-4 shrink-0 bg-white" style={{ borderBottom: "1px solid #e5eaf0" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#0F2744" }}
          >
            <Sparkles size={14} style={{ color: "#D4AF37" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Nuru</p>
            <p className="text-[11px] text-gray-400">
              Strategic co-pilot with live business context
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {showSuggestions && (
          <div className="space-y-5">
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#0F2744" }}
              >
                <Sparkles size={20} style={{ color: "#D4AF37" }} />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">Nuru</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Your strategic co-pilot. Knows your live business metrics, challenges your thinking, and helps you make better decisions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-xs px-3 py-3 rounded-xl hover:opacity-80 transition-opacity leading-snug"
                  style={{ background: "#F0F4FF", color: "#0F2744", border: "1px solid #C7D7FF" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {!showSuggestions && messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "#0F2744" }}
              >
                <Bot size={13} style={{ color: "#D4AF37" }} />
              </div>
            )}
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={
                m.role === "user"
                  ? {
                      background: "#0F2744",
                      color: "#fff",
                      borderRadius: "18px 18px 4px 18px",
                    }
                  : {
                      background: "#F9FAFB",
                      color: "#374151",
                      border: "1px solid #e5eaf0",
                      borderRadius: "4px 18px 18px 18px",
                    }
              }
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gray-200">
                <User size={13} className="text-gray-500" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#0F2744" }}
            >
              <Bot size={13} style={{ color: "#D4AF37" }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{
                background: "#F9FAFB",
                border: "1px solid #e5eaf0",
                borderRadius: "4px 18px 18px 18px",
              }}
            >
              <Loader2 size={12} className="animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 shrink-0 bg-white" style={{ borderTop: "1px solid #e5eaf0" }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask Nuru anything..."
            rows={1}
            className="flex-1 text-sm px-3 py-2.5 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
            style={{ border: "1px solid #e5eaf0", background: "#F9FAFB", minHeight: 42, maxHeight: 120 }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0"
            style={{ background: "#0F2744" }}
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 px-1">
          Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
