"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface LogframeRow { id: string; level: string; narrative: string; indicators: string; meansOfVerification: string; assumptions: string }

const LEVELS = [
  { key: "goal", label: "Goal (Impact)", description: "Long-term change the project contributes to", color: "#0F2744" },
  { key: "purpose", label: "Purpose (Outcome)", description: "Direct benefit to the target group", color: "#2563EB" },
  { key: "output", label: "Output", description: "Deliverables produced by the project", color: "#059669" },
  { key: "activity", label: "Activity", description: "Tasks undertaken to produce outputs", color: "#D97706" },
];

let c = 0;
function uid() { return `lf-${++c}`; }

export default function LogframeTool() {
  const [projectTitle, setProjectTitle] = useState("");
  const [rows, setRows] = useState<LogframeRow[]>(
    LEVELS.map((l) => ({ id: uid(), level: l.key, narrative: "", indicators: "", meansOfVerification: "", assumptions: "" }))
  );

  function update(id: string, field: string, value: string) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }
  function addRow(level: string) {
    const levelIdx = rows.findLastIndex((r) => r.level === level);
    const newRow = { id: uid(), level, narrative: "", indicators: "", meansOfVerification: "", assumptions: "" };
    setRows((prev) => [...prev.slice(0, levelIdx + 1), newRow, ...prev.slice(levelIdx + 1)]);
  }
  function removeRow(id: string) { setRows((prev) => prev.filter((r) => r.id !== id)); }

  function exportText() {
    const text = LEVELS.map((l) => {
      const levelRows = rows.filter((r) => r.level === l.key);
      return `${l.label}\n${"-".repeat(30)}\n${levelRows.map((r, i) => `  ${i + 1}. ${r.narrative}\n     Indicators: ${r.indicators}\n     Verification: ${r.meansOfVerification}\n     Assumptions: ${r.assumptions}`).join("\n")}`;
    }).join("\n\n");
    const blob = new Blob([`Logical Framework: ${projectTitle}\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "logframe.txt"; a.click();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="text-lg font-bold border-0 border-b border-transparent focus:border-gray-200 outline-none bg-transparent" style={{ color: "#0F2744" }} placeholder="Project Title" />
        <button onClick={exportText} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#0F2744" }}>
              <th className="text-left px-3 py-2.5 text-white font-medium w-24">Level</th>
              <th className="text-left px-3 py-2.5 text-white font-medium min-w-[200px]">Narrative Summary</th>
              <th className="text-left px-3 py-2.5 text-white font-medium min-w-[180px]">Objectively Verifiable Indicators</th>
              <th className="text-left px-3 py-2.5 text-white font-medium min-w-[180px]">Means of Verification</th>
              <th className="text-left px-3 py-2.5 text-white font-medium min-w-[180px]">Assumptions & Risks</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((level) => {
              const levelRows = rows.filter((r) => r.level === level.key);
              return levelRows.map((row, rowIdx) => (
                <tr key={row.id} className="border-b hover:bg-gray-50 align-top" style={{ borderColor: "#F3F4F6" }}>
                  {rowIdx === 0 && (
                    <td rowSpan={levelRows.length} className="px-3 py-2 align-top border-r" style={{ borderColor: "#e5eaf0" }}>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: level.color }}>{level.label.split(" ")[0]}</span>
                        <span className="text-[10px] text-gray-400">{level.description}</span>
                        <button onClick={() => addRow(level.key)} className="text-[10px] text-gray-400 hover:text-gray-600 mt-1 flex items-center gap-0.5"><Plus size={8} /> Add</button>
                      </div>
                    </td>
                  )}
                  <td className="px-2 py-1"><textarea value={row.narrative} onChange={(e) => update(row.id, "narrative", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none resize-none" rows={2} placeholder={`What will be achieved at ${level.label.split(" ")[0].toLowerCase()} level?`} /></td>
                  <td className="px-2 py-1"><textarea value={row.indicators} onChange={(e) => update(row.id, "indicators", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none resize-none" rows={2} placeholder="How will it be measured?" /></td>
                  <td className="px-2 py-1"><textarea value={row.meansOfVerification} onChange={(e) => update(row.id, "meansOfVerification", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none resize-none" rows={2} placeholder="Data source / evidence" /></td>
                  <td className="px-2 py-1"><textarea value={row.assumptions} onChange={(e) => update(row.id, "assumptions", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none resize-none" rows={2} placeholder="What must hold true?" /></td>
                  <td className="px-1 py-2">
                    {levelRows.length > 1 && <button onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-400"><X size={12} /></button>}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-400 mt-3">
        The Logical Framework (LogFrame) is the standard M&E tool for health system strengthening projects, NGO programmes, and government health initiatives.
        Read bottom-up: Activities produce Outputs, Outputs achieve Purpose, Purpose contributes to Goal.
      </p>
    </div>
  );
}
