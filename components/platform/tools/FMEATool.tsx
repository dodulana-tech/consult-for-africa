"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface FMEARow { id: string; process: string; failureMode: string; effect: string; cause: string; severity: number; occurrence: number; detection: number; action: string }

let c = 0;
function uid() { return `f-${++c}`; }

export default function FMEATool() {
  const [rows, setRows] = useState<FMEARow[]>([
    { id: uid(), process: "", failureMode: "", effect: "", cause: "", severity: 1, occurrence: 1, detection: 1, action: "" },
  ]);

  function update(id: string, field: string, value: string | number) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }
  function add() { setRows((prev) => [...prev, { id: uid(), process: "", failureMode: "", effect: "", cause: "", severity: 1, occurrence: 1, detection: 1, action: "" }]); }
  function remove(id: string) { setRows((prev) => prev.filter((r) => r.id !== id)); }

  function rpn(r: FMEARow) { return r.severity * r.occurrence * r.detection; }

  function rpnColor(v: number): { bg: string; color: string } {
    if (v >= 200) return { bg: "#FEE2E2", color: "#991B1B" };
    if (v >= 100) return { bg: "#FEF3C7", color: "#92400E" };
    return { bg: "#DCFCE7", color: "#166534" };
  }

  function exportCSV() {
    const header = "Process Step,Failure Mode,Effect,Cause,Severity,Occurrence,Detection,RPN,Recommended Action";
    const data = rows.map((r) => [r.process, r.failureMode, r.effect, r.cause, r.severity, r.occurrence, r.detection, rpn(r), r.action].join(","));
    const blob = new Blob([header + "\n" + data.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fmea-worksheet.csv"; a.click();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">Failure Mode and Effects Analysis: Rate each factor 1-10. RPN = Severity x Occurrence x Detection. Higher RPN = higher priority.</p>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
          <button onClick={add} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: "#0F2744" }}><Plus size={12} /> Add Row</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#0F2744" }}>
              <th className="text-left px-3 py-2 text-white font-medium min-w-0">Process Step</th>
              <th className="text-left px-3 py-2 text-white font-medium min-w-0">Failure Mode</th>
              <th className="text-left px-3 py-2 text-white font-medium min-w-0">Effect</th>
              <th className="text-left px-3 py-2 text-white font-medium min-w-0">Cause</th>
              <th className="text-center px-2 py-2 text-white font-medium w-14">S</th>
              <th className="text-center px-2 py-2 text-white font-medium w-14">O</th>
              <th className="text-center px-2 py-2 text-white font-medium w-14">D</th>
              <th className="text-center px-2 py-2 text-white font-medium w-16">RPN</th>
              <th className="text-left px-3 py-2 text-white font-medium min-w-0">Action</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.sort((a, b) => rpn(b) - rpn(a)).map((r) => {
              const rpnVal = rpn(r);
              const rpnSt = rpnColor(rpnVal);
              return (
                <tr key={r.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-2 py-1"><input value={r.process} onChange={(e) => update(r.id, "process", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none" placeholder="e.g. Medication dispensing" /></td>
                  <td className="px-2 py-1"><input value={r.failureMode} onChange={(e) => update(r.id, "failureMode", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none" placeholder="What could go wrong" /></td>
                  <td className="px-2 py-1"><input value={r.effect} onChange={(e) => update(r.id, "effect", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none" placeholder="Impact" /></td>
                  <td className="px-2 py-1"><input value={r.cause} onChange={(e) => update(r.id, "cause", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none" placeholder="Root cause" /></td>
                  <td className="px-1 py-1"><select value={r.severity} onChange={(e) => update(r.id, "severity", Number(e.target.value))} className="w-full text-center border rounded px-1 py-1" style={{ borderColor: "#e5eaf0" }}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></td>
                  <td className="px-1 py-1"><select value={r.occurrence} onChange={(e) => update(r.id, "occurrence", Number(e.target.value))} className="w-full text-center border rounded px-1 py-1" style={{ borderColor: "#e5eaf0" }}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></td>
                  <td className="px-1 py-1"><select value={r.detection} onChange={(e) => update(r.id, "detection", Number(e.target.value))} className="w-full text-center border rounded px-1 py-1" style={{ borderColor: "#e5eaf0" }}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></td>
                  <td className="px-2 py-1 text-center"><span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: rpnSt.bg, color: rpnSt.color }}>{rpnVal}</span></td>
                  <td className="px-2 py-1"><input value={r.action} onChange={(e) => update(r.id, "action", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none" placeholder="Corrective action" /></td>
                  <td className="px-1"><button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-400"><X size={12} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-4 text-[10px] text-gray-400">
        <span>S = Severity (1-10)</span><span>O = Occurrence likelihood (1-10)</span><span>D = Detection difficulty (1-10, higher = harder to detect)</span>
        <span className="ml-auto">RPN 200+ = Critical | 100-199 = Moderate | &lt;100 = Low</span>
      </div>
    </div>
  );
}
