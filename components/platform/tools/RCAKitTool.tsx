"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface WhyStep { id: string; question: string; answer: string }
interface Investigation { id: string; incident: string; date: string; severity: string; whys: WhyStep[]; rootCause: string; correctiveActions: string[]; preventiveActions: string[] }

let c = 0;
function uid() { return `rca-${++c}`; }

export default function RCAKitTool() {
  const [investigation, setInvestigation] = useState<Investigation>({
    id: uid(), incident: "", date: new Date().toISOString().split("T")[0], severity: "MODERATE",
    whys: [{ id: uid(), question: "Why did this happen?", answer: "" }],
    rootCause: "", correctiveActions: [""], preventiveActions: [""],
  });

  const inv = investigation;
  function set(field: string, value: unknown) { setInvestigation((prev) => ({ ...prev, [field]: value })); }

  function addWhy() {
    const lastAnswer = inv.whys[inv.whys.length - 1]?.answer || "";
    set("whys", [...inv.whys, { id: uid(), question: `Why ${lastAnswer.toLowerCase().replace(/\.$/, "")}?`, answer: "" }]);
  }
  function updateWhy(idx: number, field: string, value: string) {
    set("whys", inv.whys.map((w, i) => i === idx ? { ...w, [field]: value } : w));
  }
  function removeWhy(idx: number) {
    if (inv.whys.length <= 1) return;
    set("whys", inv.whys.filter((_, i) => i !== idx));
  }

  function updateAction(type: "correctiveActions" | "preventiveActions", idx: number, value: string) {
    set(type, inv[type].map((a: string, i: number) => i === idx ? value : a));
  }
  function addAction(type: "correctiveActions" | "preventiveActions") {
    set(type, [...inv[type], ""]);
  }
  function removeAction(type: "correctiveActions" | "preventiveActions", idx: number) {
    set(type, inv[type].filter((_: string, i: number) => i !== idx));
  }

  function exportText() {
    const text = `ROOT CAUSE ANALYSIS INVESTIGATION
${"=".repeat(40)}
Incident: ${inv.incident}
Date: ${inv.date}
Severity: ${inv.severity}

5 WHYS ANALYSIS
${inv.whys.map((w, i) => `  Why ${i + 1}: ${w.question}\n  Answer: ${w.answer}`).join("\n\n")}

ROOT CAUSE: ${inv.rootCause}

CORRECTIVE ACTIONS:
${inv.correctiveActions.filter(Boolean).map((a, i) => `  ${i + 1}. ${a}`).join("\n")}

PREVENTIVE ACTIONS:
${inv.preventiveActions.filter(Boolean).map((a, i) => `  ${i + 1}. ${a}`).join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rca-investigation.txt"; a.click();
  }

  const SEVERITY_COLORS: Record<string, { bg: string; color: string }> = {
    LOW: { bg: "#DCFCE7", color: "#166534" }, MODERATE: { bg: "#FEF3C7", color: "#92400E" },
    HIGH: { bg: "#FEE2E2", color: "#991B1B" }, CRITICAL: { bg: "#7F1D1D", color: "#FCA5A5" },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex justify-end"><button onClick={exportText} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button></div>

      {/* Incident details */}
      <div className="rounded-xl border p-5" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Incident Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2"><input value={inv.incident} onChange={(e) => set("incident", e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#e5eaf0" }} placeholder="Describe the incident..." /></div>
          <div className="flex gap-2">
            <input type="date" value={inv.date} onChange={(e) => set("date", e.target.value)} className="flex-1 text-xs border rounded-lg px-2 py-2" style={{ borderColor: "#e5eaf0" }} />
            <select value={inv.severity} onChange={(e) => set("severity", e.target.value)} className="text-xs border rounded-lg px-2 py-2" style={{ borderColor: "#e5eaf0" }}>
              {Object.keys(SEVERITY_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 5 Whys */}
      <div className="rounded-xl border p-5" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">5 Whys Analysis</h3>
        <div className="space-y-3">
          {inv.whys.map((w, i) => (
            <div key={w.id} className="flex items-start gap-3 pl-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#0F2744" + "10", color: "#0F2744" }}>{i + 1}</div>
              <div className="flex-1 space-y-1">
                <input value={w.question} onChange={(e) => updateWhy(i, "question", e.target.value)} className="w-full text-sm font-medium border-0 outline-none bg-transparent" style={{ color: "#0F2744" }} placeholder="Why...?" />
                <input value={w.answer} onChange={(e) => updateWhy(i, "answer", e.target.value)} className="w-full text-sm border-0 border-b border-gray-100 focus:border-gray-300 outline-none bg-transparent py-1 text-gray-600" placeholder="Because..." />
              </div>
              {inv.whys.length > 1 && <button onClick={() => removeWhy(i)} className="text-gray-300 hover:text-red-400 mt-2"><X size={12} /></button>}
            </div>
          ))}
          {inv.whys.length < 7 && (
            <button onClick={addWhy} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 ml-11"><Plus size={10} /> Ask Why Again</button>
          )}
        </div>
      </div>

      {/* Root Cause */}
      <div className="rounded-xl border p-5" style={{ borderColor: "#e5eaf0", background: "#FEF3C7" }}>
        <h3 className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-2">Root Cause</h3>
        <textarea value={inv.rootCause} onChange={(e) => set("rootCause", e.target.value)} rows={2} className="w-full text-sm border rounded-lg px-3 py-2 resize-none bg-white" style={{ borderColor: "#F59E0B" + "40" }} placeholder="State the identified root cause..." />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["correctiveActions", "preventiveActions"] as const).map((type) => (
          <div key={type} className="rounded-xl border p-5" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{type === "correctiveActions" ? "Corrective Actions (Fix Now)" : "Preventive Actions (Prevent Recurrence)"}</h3>
            {inv[type].map((a: string, i: number) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-gray-300">{i + 1}.</span>
                <input value={a} onChange={(e) => updateAction(type, i, e.target.value)} className="flex-1 text-xs border-0 border-b border-gray-100 focus:border-gray-300 outline-none py-1 bg-transparent" placeholder="Action..." />
                {inv[type].length > 1 && <button onClick={() => removeAction(type, i)} className="text-gray-300 hover:text-red-400"><X size={10} /></button>}
              </div>
            ))}
            <button onClick={() => addAction(type)} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1"><Plus size={10} /> Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}
