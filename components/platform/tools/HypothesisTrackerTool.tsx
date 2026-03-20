"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

type Status = "UNVALIDATED" | "SUPPORTED" | "REFUTED" | "INCONCLUSIVE";

interface Hypothesis {
  id: string;
  statement: string;
  status: Status;
  evidence: string[];
  priority: "HIGH" | "MEDIUM" | "LOW";
}

const STATUS_STYLES: Record<Status, { bg: string; color: string; label: string }> = {
  UNVALIDATED: { bg: "#F3F4F6", color: "#6B7280", label: "Unvalidated" },
  SUPPORTED: { bg: "#DCFCE7", color: "#166534", label: "Supported" },
  REFUTED: { bg: "#FEE2E2", color: "#991B1B", label: "Refuted" },
  INCONCLUSIVE: { bg: "#FEF3C7", color: "#92400E", label: "Inconclusive" },
};

let idCounter = 0;
function uid() { return `h-${++idCounter}`; }

export default function HypothesisTrackerTool() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([
    { id: uid(), statement: "", status: "UNVALIDATED", evidence: [], priority: "MEDIUM" },
  ]);
  const [newEvidence, setNewEvidence] = useState<Record<string, string>>({});

  function addHypothesis() {
    setHypotheses((prev) => [...prev, { id: uid(), statement: "", status: "UNVALIDATED", evidence: [], priority: "MEDIUM" }]);
  }

  function updateHypothesis(id: string, field: string, value: unknown) {
    setHypotheses((prev) => prev.map((h) => h.id === id ? { ...h, [field]: value } : h));
  }

  function addEvidence(id: string) {
    const text = newEvidence[id]?.trim();
    if (!text) return;
    setHypotheses((prev) => prev.map((h) => h.id === id ? { ...h, evidence: [...h.evidence, text] } : h));
    setNewEvidence((prev) => ({ ...prev, [id]: "" }));
  }

  function removeEvidence(hId: string, eIdx: number) {
    setHypotheses((prev) => prev.map((h) => h.id === hId ? { ...h, evidence: h.evidence.filter((_, i) => i !== eIdx) } : h));
  }

  function removeHypothesis(id: string) {
    setHypotheses((prev) => prev.filter((h) => h.id !== id));
  }

  function exportText() {
    const lines = hypotheses.map((h, i) => {
      const evidenceLines = h.evidence.map((e, j) => `    ${j + 1}. ${e}`).join("\n");
      return `${i + 1}. [${STATUS_STYLES[h.status].label}] [${h.priority}] ${h.statement}\n   Evidence:\n${evidenceLines || "    (none)"}`;
    });
    const blob = new Blob([`Hypothesis Tracker\n${"=".repeat(40)}\n\n${lines.join("\n\n")}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "hypothesis-tracker.txt"; a.click();
  }

  const statusCycle: Status[] = ["UNVALIDATED", "SUPPORTED", "REFUTED", "INCONCLUSIVE"];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400">Track and prioritize hypotheses throughout your engagement, linking evidence to conclusions.</p>
        <div className="flex gap-2">
          <button onClick={exportText} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0", color: "#6B7280" }}>
            <Download size={12} /> Export
          </button>
          <button onClick={addHypothesis} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: "#0F2744" }}>
            <Plus size={12} /> Add Hypothesis
          </button>
        </div>
      </div>

      {hypotheses.map((h) => {
        const st = STATUS_STYLES[h.status];
        return (
          <div key={h.id} className="rounded-xl border p-5" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  value={h.statement}
                  onChange={(e) => updateHypothesis(h.id, "statement", e.target.value)}
                  placeholder="State your hypothesis..."
                  className="w-full text-sm font-medium border-0 border-b border-transparent focus:border-gray-200 outline-none pb-1 bg-transparent"
                  style={{ color: "#0F2744" }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateHypothesis(h.id, "status", statusCycle[(statusCycle.indexOf(h.status) + 1) % statusCycle.length])}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
                  </button>
                  <select
                    value={h.priority}
                    onChange={(e) => updateHypothesis(h.id, "priority", e.target.value)}
                    className="text-[10px] border rounded px-1.5 py-0.5"
                    style={{ borderColor: "#e5eaf0" }}
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <button onClick={() => removeHypothesis(h.id)} className="text-gray-300 hover:text-red-400">
                <X size={14} />
              </button>
            </div>

            <div className="mt-3 pl-1">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Evidence</p>
              {h.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600 mb-1">
                  <span className="text-gray-300 mt-0.5">{i + 1}.</span>
                  <span className="flex-1">{e}</span>
                  <button onClick={() => removeEvidence(h.id, i)} className="text-gray-300 hover:text-red-400 shrink-0"><X size={10} /></button>
                </div>
              ))}
              <div className="flex gap-2 mt-1.5">
                <input
                  value={newEvidence[h.id] ?? ""}
                  onChange={(e) => setNewEvidence((prev) => ({ ...prev, [h.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addEvidence(h.id)}
                  placeholder="Add evidence..."
                  className="flex-1 text-xs border rounded-lg px-2.5 py-1.5"
                  style={{ borderColor: "#e5eaf0" }}
                />
                <button onClick={() => addEvidence(h.id)} className="text-xs px-2 py-1 rounded-lg border" style={{ borderColor: "#e5eaf0" }}>Add</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
