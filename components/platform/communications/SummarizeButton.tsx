"use client";

import { useState } from "react";
import { Sparkles, Loader2, X, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import type { SubjectRef } from "./CommunicationsTimeline";

interface SummaryResult {
  summary: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  openQuestions: string[];
  suggestedNextAction: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  generatedAt: string;
  basedOnCommIds: string[];
}

const SENTIMENT_STYLES: Record<string, { background: string; color: string }> = {
  POSITIVE: { background: "#D1FAE5", color: "#065F46" },
  NEUTRAL: { background: "#F3F4F6", color: "#374151" },
  NEGATIVE: { background: "#FEE2E2", color: "#991B1B" },
};

const URGENCY_STYLES: Record<string, { background: string; color: string }> = {
  LOW: { background: "#F3F4F6", color: "#6B7280" },
  MEDIUM: { background: "#FEF3C7", color: "#92400E" },
  HIGH: { background: "#FEE2E2", color: "#991B1B" },
};

export default function SummarizeButton({ subject }: { subject: SubjectRef }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState("");

  async function handleSummarize() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/communications/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType: subject.subjectType,
          consultantId: subject.consultantId,
          clientId: subject.clientId,
          clientContactId: subject.clientContactId,
          applicationId: subject.applicationId,
          cadreProfessionalId: subject.cadreProfessionalId,
          partnerFirmId: subject.partnerFirmId,
          salesAgentId: subject.salesAgentId,
          discoveryCallId: subject.discoveryCallId,
          maarovaUserId: subject.maarovaUserId,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to summarize."));
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setOpen(true);
    if (!result && !loading) {
      handleSummarize();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
        style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}
        title="Summarise this contact's history"
      >
        <Sparkles size={11} />
        Summarise
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "#92400E" }} />
                <h3 className="text-base font-semibold" style={{ color: "#0F2744" }}>
                  Communication Summary
                </h3>
                {subject.subjectName && (
                  <span className="text-xs text-gray-400">· {subject.subjectName}</span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              {loading && (
                <div className="py-8 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">Analysing the history...</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2" }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Sentiment + Urgency */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={SENTIMENT_STYLES[result.sentiment]}
                    >
                      {result.sentiment}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={URGENCY_STYLES[result.urgency]}
                    >
                      {result.urgency === "HIGH" && <AlertTriangle size={9} />}
                      {result.urgency} urgency
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      Based on {result.basedOnCommIds.length} comm{result.basedOnCommIds.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Summary</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
                  </div>

                  {/* Open questions */}
                  {result.openQuestions.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Open Items</p>
                      <ul className="space-y-1">
                        {result.openQuestions.map((q, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-gray-400 mt-1 shrink-0">·</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggested next action */}
                  {result.suggestedNextAction && (
                    <div className="rounded-lg p-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 mb-1 flex items-center gap-1">
                        <Clock size={9} /> Suggested Next Action
                      </p>
                      <p className="text-sm text-blue-900">{result.suggestedNextAction}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 pt-2 border-t" style={{ borderColor: "#F3F4F6" }}>
                    Generated {new Date(result.generatedAt).toLocaleString("en-GB")}.
                    Click Summarise again to refresh after new activity.
                  </p>
                </div>
              )}
            </div>

            {result && (
              <div className="px-5 pb-4 flex justify-end gap-2">
                <button
                  onClick={() => { setResult(null); handleSummarize(); }}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                  style={{ border: "1px solid #e5eaf0", color: "#0F2744" }}
                >
                  Regenerate
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "#0F2744" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
