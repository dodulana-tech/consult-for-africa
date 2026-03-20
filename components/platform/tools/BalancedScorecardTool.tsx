"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface Objective { id: string; text: string; measure: string; target: string; initiative: string }
interface Perspective { name: string; color: string; objectives: Objective[] }

let idC = 0;
function uid() { return `o-${++idC}`; }

const DEFAULT_PERSPECTIVES: Perspective[] = [
  { name: "Financial", color: "#059669", objectives: [{ id: uid(), text: "", measure: "", target: "", initiative: "" }] },
  { name: "Patient/Customer", color: "#2563EB", objectives: [{ id: uid(), text: "", measure: "", target: "", initiative: "" }] },
  { name: "Internal Processes", color: "#D97706", objectives: [{ id: uid(), text: "", measure: "", target: "", initiative: "" }] },
  { name: "Learning & Growth", color: "#7C3AED", objectives: [{ id: uid(), text: "", measure: "", target: "", initiative: "" }] },
];

export default function BalancedScorecardTool() {
  const [perspectives, setPerspectives] = useState<Perspective[]>(DEFAULT_PERSPECTIVES);

  function updateObjective(pIdx: number, oIdx: number, field: string, value: string) {
    setPerspectives((prev) => prev.map((p, i) => i === pIdx ? { ...p, objectives: p.objectives.map((o, j) => j === oIdx ? { ...o, [field]: value } : o) } : p));
  }
  function addObjective(pIdx: number) {
    setPerspectives((prev) => prev.map((p, i) => i === pIdx ? { ...p, objectives: [...p.objectives, { id: uid(), text: "", measure: "", target: "", initiative: "" }] } : p));
  }
  function removeObjective(pIdx: number, oIdx: number) {
    setPerspectives((prev) => prev.map((p, i) => i === pIdx ? { ...p, objectives: p.objectives.filter((_, j) => j !== oIdx) } : p));
  }
  function exportText() {
    const text = perspectives.map((p) => `${p.name}\n${"-".repeat(30)}\n${p.objectives.map((o, i) => `  ${i + 1}. Objective: ${o.text}\n     Measure: ${o.measure}\n     Target: ${o.target}\n     Initiative: ${o.initiative}`).join("\n")}`).join("\n\n");
    const blob = new Blob([`Balanced Scorecard\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "balanced-scorecard.txt"; a.click();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-end">
        <button onClick={exportText} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
      </div>
      {perspectives.map((p, pIdx) => (
        <div key={p.name} className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: p.color + "10" }}>
            <h3 className="text-sm font-semibold" style={{ color: p.color }}>{p.name}</h3>
            <button onClick={() => addObjective(pIdx)} className="text-[10px] px-2 py-1 rounded-lg flex items-center gap-1" style={{ color: p.color }}><Plus size={10} /> Add</button>
          </div>
          <div className="bg-white">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[10px] font-semibold text-gray-500 border-b" style={{ borderColor: "#e5eaf0" }}>
                <th className="px-4 py-2 w-1/4">Objective</th><th className="px-4 py-2 w-1/4">Measure / KPI</th><th className="px-4 py-2 w-1/4">Target</th><th className="px-4 py-2 w-1/4">Strategic Initiative</th><th className="px-2 py-2 w-8"></th>
              </tr></thead>
              <tbody>
                {p.objectives.map((o, oIdx) => (
                  <tr key={o.id} className="border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-3 py-1"><input value={o.text} onChange={(e) => updateObjective(pIdx, oIdx, "text", e.target.value)} className="w-full border-0 bg-transparent py-1 focus:ring-0 outline-none" placeholder="What we must achieve" /></td>
                    <td className="px-3 py-1"><input value={o.measure} onChange={(e) => updateObjective(pIdx, oIdx, "measure", e.target.value)} className="w-full border-0 bg-transparent py-1 focus:ring-0 outline-none" placeholder="How we measure" /></td>
                    <td className="px-3 py-1"><input value={o.target} onChange={(e) => updateObjective(pIdx, oIdx, "target", e.target.value)} className="w-full border-0 bg-transparent py-1 focus:ring-0 outline-none" placeholder="Target value" /></td>
                    <td className="px-3 py-1"><input value={o.initiative} onChange={(e) => updateObjective(pIdx, oIdx, "initiative", e.target.value)} className="w-full border-0 bg-transparent py-1 focus:ring-0 outline-none" placeholder="Key initiative" /></td>
                    <td className="px-2 py-1"><button onClick={() => removeObjective(pIdx, oIdx)} className="text-gray-300 hover:text-red-400"><X size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
