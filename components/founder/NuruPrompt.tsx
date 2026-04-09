"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowRight, MessageCircle } from "lucide-react";

interface PromptData {
  message: string;
  type: "accountability" | "strategic" | "celebration" | "challenge";
  context: string;
}

const TYPE_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  accountability: { border: "#D4AF37", bg: "rgba(212,175,55,0.04)", icon: "rgba(212,175,55,1)" },
  strategic: { border: "#0B3C5D", bg: "rgba(11,60,93,0.03)", icon: "#0B3C5D" },
  celebration: { border: "#059669", bg: "rgba(5,150,105,0.03)", icon: "#059669" },
  challenge: { border: "#DC2626", bg: "rgba(220,38,38,0.03)", icon: "#DC2626" },
};

export default function NuruPrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  async function loadPrompt() {
    try {
      const res = await fetch("/api/founder/nuru-prompt", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPrompt(data);
      }
    } catch {
      // Silently fail, dashboard still works
    } finally {
      setLoading(false);
    }
  }

  if (dismissed || (!loading && !prompt)) return null;

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-3"
        style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.2)" }}
      >
        <div className="rounded-xl p-2.5" style={{ background: "rgba(212,175,55,0.1)" }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#D4AF37" }} />
        </div>
        <p className="text-sm text-gray-500">Nuru is preparing your check-in...</p>
      </div>
    );
  }

  const style = TYPE_STYLES[prompt!.type] ?? TYPE_STYLES.strategic;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${style.border}20`, background: style.bg }}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-xl p-2.5" style={{ background: `${style.icon}12` }}>
            <MessageCircle className="h-5 w-5" style={{ color: style.icon }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#D4AF37" }}>
                Nuru
              </p>
              <span className="text-[9px] text-gray-400">
                {prompt!.type === "accountability" ? "Accountability check" : prompt!.type === "challenge" ? "Challenge" : prompt!.type === "celebration" ? "Win" : "Strategic prompt"}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-800 leading-relaxed">
              {prompt!.message}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${style.border}10` }}>
        <button
          onClick={() => router.push("/founder/ai-coach")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:opacity-80"
          style={{ color: style.icon }}
        >
          Reply to Nuru
          <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
