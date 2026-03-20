"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface KeyResult { id: string; text: string; target: string; current: string; unit: string }
interface Objective { id: string; text: string; owner: string; keyResults: KeyResult[] }

let c = 0;
function uid() { return `okr-${++c}`; }

export default function OKRPlannerTool() {
  const [period, setPeriod] = useState("Q2 2026");
  const [objectives, setObjectives] = useState<Objective[]>([
    { id: uid(), text: "", owner: "", keyResults: [{ id: uid(), text: "", target: "", current: "0", unit: "" }] },
  ]);

  function updateObj(oIdx: number, field: string, value: string) {
    setObjectives((prev) => prev.map((o, i) => i === oIdx ? { ...o, [field]: value } : o));
  }
  function addObjective() {
    setObjectives((prev) => [...prev, { id: uid(), text: "", owner: "", keyResults: [{ id: uid(), text: "", target: "", current: "0", unit: "" }] }]);
  }
  function removeObjective(oIdx: number) {
    setObjectives((prev) => prev.filter((_, i) => i !== oIdx));
  }
  function updateKR(oIdx: number, krIdx: number, field: string, value: string) {
    setObjectives((prev) => prev.map((o, i) => i === oIdx ? { ...o, keyResults: o.keyResults.map((kr, j) => j === krIdx ? { ...kr, [field]: value } : kr) } : o));
  }
  function addKR(oIdx: number) {
    setObjectives((prev) => prev.map((o, i) => i === oIdx ? { ...o, keyResults: [...o.keyResults, { id: uid(), text: "", target: "", current: "0", unit: "" }] } : o));
  }
  function removeKR(oIdx: number, krIdx: number) {
    setObjectives((prev) => prev.map((o, i) => i === oIdx ? { ...o, keyResults: o.keyResults.filter((_, j) => j !== krIdx) } : o));
  }

  function progress(kr: KeyResult): number {
    const t = parseFloat(kr.target); const c = parseFloat(kr.current);
    if (!t || isNaN(t) || isNaN(c)) return 0;
    return Math.min(100, Math.round((c / t) * 100));
  }

  function objProgress(obj: Objective): number {
    if (obj.keyResults.length === 0) return 0;
    return Math.round(obj.keyResults.reduce((s, kr) => s + progress(kr), 0) / obj.keyResults.length);
  }

  function exportText() {
    const text = objectives.map((o, i) => {
      const krs = o.keyResults.map((kr, j) => `    KR${j + 1}: ${kr.text} (${kr.current}/${kr.target} ${kr.unit}) - ${progress(kr)}%`).join("\n");
      return `O${i + 1}: ${o.text} [${o.owner}] - ${objProgress(o)}% complete\n${krs}`;
    }).join("\n\n");
    const blob = new Blob([`OKRs: ${period}\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "okr-plan.txt"; a.click();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Period:</label>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} className="text-sm font-semibold border rounded-lg px-2 py-1" style={{ borderColor: "#e5eaf0", color: "#0F2744" }} />
        </div>
        <div className="flex gap-2">
          <button onClick={exportText} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
          <button onClick={addObjective} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: "#0F2744" }}><Plus size={12} /> Objective</button>
        </div>
      </div>

      {objectives.map((obj, oIdx) => {
        const pct = objProgress(obj);
        return (
          <div key={obj.id} className="rounded-xl border" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{ background: pct >= 70 ? "#DCFCE7" : pct >= 30 ? "#FEF3C7" : "#F3F4F6", color: pct >= 70 ? "#166534" : pct >= 30 ? "#92400E" : "#6B7280" }}>
                  {pct}%
                </div>
                <div className="flex-1">
                  <input value={obj.text} onChange={(e) => updateObj(oIdx, "text", e.target.value)} className="w-full text-sm font-semibold border-0 outline-none bg-transparent" style={{ color: "#0F2744" }} placeholder="Define your objective..." />
                  <input value={obj.owner} onChange={(e) => updateObj(oIdx, "owner", e.target.value)} className="text-xs text-gray-400 border-0 outline-none bg-transparent mt-0.5" placeholder="Owner" />
                </div>
                <button onClick={() => removeObjective(oIdx)} className="text-gray-300 hover:text-red-400"><X size={14} /></button>
              </div>

              <div className="mt-4 space-y-2 pl-1">
                {obj.keyResults.map((kr, krIdx) => (
                  <div key={kr.id} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-300 w-8 shrink-0">KR{krIdx + 1}</span>
                    <input value={kr.text} onChange={(e) => updateKR(oIdx, krIdx, "text", e.target.value)} className="flex-1 border-0 border-b border-gray-100 focus:border-gray-300 outline-none py-1 bg-transparent" placeholder="Key result..." />
                    <input value={kr.current} onChange={(e) => updateKR(oIdx, krIdx, "current", e.target.value)} className="w-14 text-right border rounded px-1.5 py-1" style={{ borderColor: "#e5eaf0" }} placeholder="0" />
                    <span className="text-gray-400">/</span>
                    <input value={kr.target} onChange={(e) => updateKR(oIdx, krIdx, "target", e.target.value)} className="w-14 text-right border rounded px-1.5 py-1" style={{ borderColor: "#e5eaf0" }} placeholder="100" />
                    <input value={kr.unit} onChange={(e) => updateKR(oIdx, krIdx, "unit", e.target.value)} className="w-12 border rounded px-1.5 py-1 text-gray-400" style={{ borderColor: "#e5eaf0" }} placeholder="%" />
                    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${progress(kr)}%`, background: "#D4AF37" }} />
                    </div>
                    <button onClick={() => removeKR(oIdx, krIdx)} className="text-gray-300 hover:text-red-400"><X size={10} /></button>
                  </div>
                ))}
                <button onClick={() => addKR(oIdx)} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-1"><Plus size={10} /> Key Result</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
