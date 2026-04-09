"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertTriangle, TrendingUp, Lightbulb, CheckCircle2 } from "lucide-react";

interface Insight {
  type: "win" | "risk" | "opportunity" | "action";
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

interface MacroNews {
  headline: string;
  source: string;
  relevance: string;
}

interface Pulse {
  id: string;
  summary: string;
  insights: { business: Insight[]; macroNews: MacroNews[] } | Insight[];
  date: string;
}

const INSIGHT_ICONS: Record<string, typeof TrendingUp> = {
  win: CheckCircle2,
  risk: AlertTriangle,
  opportunity: Lightbulb,
  action: TrendingUp,
};

const INSIGHT_COLORS: Record<string, { bg: string; color: string }> = {
  win: { bg: "#D1FAE5", color: "#065F46" },
  risk: { bg: "#FEF2F2", color: "#991B1B" },
  opportunity: { bg: "#EFF6FF", color: "#1D4ED8" },
  action: { bg: "#FEF9E7", color: "#92400E" },
};

export default function DailyPulse() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPulse();
  }, []);

  async function loadPulse() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/founder/daily-pulse", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate pulse");
      const data = await res.json();
      setPulse(data);
    } catch {
      setError("Could not generate daily pulse");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#D4AF37" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Generating your daily pulse...</p>
            <p className="text-xs text-gray-400">Nuru is analysing your business metrics</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <p className="text-sm text-gray-400">{error}</p>
        <button onClick={loadPulse} className="mt-2 text-xs font-medium text-[#D4AF37] hover:underline">Retry</button>
      </div>
    );
  }

  if (!pulse) return null;

  const rawInsights = pulse.insights;
  const insights: Insight[] = Array.isArray(rawInsights) ? rawInsights : (rawInsights as { business: Insight[]; macroNews: MacroNews[] }).business ?? [];
  const macroNews: MacroNews[] = Array.isArray(rawInsights) ? [] : (rawInsights as { business: Insight[]; macroNews: MacroNews[] }).macroNews ?? [];

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: "1px solid #E8EBF0" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ background: "#FAFBFC", borderBottom: "1px solid #E8EBF0" }}>
        <div className="rounded-xl p-2" style={{ background: "rgba(212,175,55,0.1)" }}>
          <Sparkles className="h-4 w-4" style={{ color: "#D4AF37" }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#0F2744" }}>Daily Pulse from Nuru</p>
          <p className="text-[10px] text-gray-400">
            {new Date(pulse.date).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4">
        <p className="text-sm text-gray-700 leading-relaxed">{pulse.summary}</p>
      </div>

      {/* Business Insights */}
      {insights.length > 0 && (
        <div className="px-6 pb-4 space-y-2">
          {insights.map((insight, i) => {
            const Icon = INSIGHT_ICONS[insight.type] ?? Lightbulb;
            const colors = INSIGHT_COLORS[insight.type] ?? INSIGHT_COLORS.action;
            return (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: colors.bg + "40" }}>
                <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: colors.color }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: colors.color }}>{insight.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{insight.detail}</p>
                </div>
                {insight.priority === "high" && (
                  <span className="ml-auto shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600">
                    HIGH
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Macro News */}
      {macroNews.length > 0 && (
        <div className="px-6 pb-5" style={{ borderTop: "1px solid #F1F5F9" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 pt-4 pb-2">Industry & Macro</p>
          <div className="space-y-2">
            {macroNews.map((news, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: "#F8F9FB" }}>
                <p className="text-xs font-semibold text-gray-800">{news.headline}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium" style={{ color: "#0B3C5D" }}>{news.source}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{news.relevance}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
