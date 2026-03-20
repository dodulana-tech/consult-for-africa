"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type Stage = "TOPIC" | "CRITERIA" | "DATA" | "ANALYSIS" | "CHANGE" | "REAUDIT";
const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: "TOPIC", label: "1. Topic Selection", color: "#7C3AED" },
  { key: "CRITERIA", label: "2. Set Standards & Criteria", color: "#2563EB" },
  { key: "DATA", label: "3. Data Collection", color: "#059669" },
  { key: "ANALYSIS", label: "4. Analysis & Comparison", color: "#D97706" },
  { key: "CHANGE", label: "5. Implement Changes", color: "#DC2626" },
  { key: "REAUDIT", label: "6. Re-audit", color: "#7C3AED" },
];

interface AuditData {
  topic: string; rationale: string; team: string;
  criteria: { standard: string; target: string; source: string }[];
  sampleSize: string; method: string; period: string; notes: string;
  findings: string; gapAnalysis: string; complianceRate: string;
  changes: { action: string; responsible: string; deadline: string; status: string }[];
  reauditDate: string; reauditNotes: string;
}

export default function ClinicalAuditTool() {
  const [stage, setStage] = useState<Stage>("TOPIC");
  const [data, setData] = useState<AuditData>({
    topic: "", rationale: "", team: "",
    criteria: [{ standard: "", target: "", source: "" }],
    sampleSize: "", method: "", period: "", notes: "",
    findings: "", gapAnalysis: "", complianceRate: "",
    changes: [{ action: "", responsible: "", deadline: "", status: "PENDING" }],
    reauditDate: "", reauditNotes: "",
  });

  function set(field: string, value: unknown) { setData((prev) => ({ ...prev, [field]: value })); }

  function exportText() {
    const text = `CLINICAL AUDIT CYCLE
${"=".repeat(40)}
Topic: ${data.topic}
Rationale: ${data.rationale}
Team: ${data.team}

CRITERIA & STANDARDS:
${data.criteria.map((c, i) => `  ${i + 1}. ${c.standard} (Target: ${c.target}, Source: ${c.source})`).join("\n")}

DATA COLLECTION:
  Sample: ${data.sampleSize} | Method: ${data.method} | Period: ${data.period}
  Notes: ${data.notes}

ANALYSIS:
  Compliance Rate: ${data.complianceRate}
  Findings: ${data.findings}
  Gap Analysis: ${data.gapAnalysis}

CHANGES:
${data.changes.map((c, i) => `  ${i + 1}. ${c.action} (${c.responsible}, by ${c.deadline}) [${c.status}]`).join("\n")}

RE-AUDIT: ${data.reauditDate}
${data.reauditNotes}`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "clinical-audit.txt"; a.click();
  }

  const stageIdx = STAGES.findIndex((s) => s.key === stage);
  const inputClass = "w-full text-sm border rounded-lg px-3 py-2";
  const inputStyle = { borderColor: "#e5eaf0" };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Stage nav */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {STAGES.map((s, i) => (
          <button key={s.key} onClick={() => setStage(s.key)} className={`text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${stage === s.key ? "text-white" : "text-gray-500 hover:bg-gray-100"}`} style={stage === s.key ? { background: s.color } : {}}>
            {s.label}
          </button>
        ))}
        <button onClick={exportText} className="ml-auto text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shrink-0" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5eaf0" }}>
        {stage === "TOPIC" && (<>
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Topic Selection</h3>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Audit Topic</label><input value={data.topic} onChange={(e) => set("topic", e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Hand Hygiene Compliance in ICU" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Rationale</label><textarea value={data.rationale} onChange={(e) => set("rationale", e.target.value)} rows={3} className={`${inputClass} resize-none`} style={inputStyle} placeholder="Why this topic? What evidence supports the need?" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Audit Team</label><input value={data.team} onChange={(e) => set("team", e.target.value)} className={inputClass} style={inputStyle} placeholder="Names and roles" /></div>
        </>)}

        {stage === "CRITERIA" && (<>
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Standards & Criteria</h3>
          {data.criteria.map((c, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <input value={c.standard} onChange={(e) => set("criteria", data.criteria.map((cr, j) => j === i ? { ...cr, standard: e.target.value } : cr))} className={inputClass} style={inputStyle} placeholder="Standard/Criterion" />
              <input value={c.target} onChange={(e) => set("criteria", data.criteria.map((cr, j) => j === i ? { ...cr, target: e.target.value } : cr))} className={inputClass} style={inputStyle} placeholder="Target (e.g. 95%)" />
              <input value={c.source} onChange={(e) => set("criteria", data.criteria.map((cr, j) => j === i ? { ...cr, source: e.target.value } : cr))} className={inputClass} style={inputStyle} placeholder="Source (WHO, COHSASA)" />
            </div>
          ))}
          <button onClick={() => set("criteria", [...data.criteria, { standard: "", target: "", source: "" }])} className="text-xs text-gray-400 hover:text-gray-600">+ Add criterion</button>
        </>)}

        {stage === "DATA" && (<>
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Data Collection</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Sample Size</label><input value={data.sampleSize} onChange={(e) => set("sampleSize", e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. 100 observations" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Method</label><input value={data.method} onChange={(e) => set("method", e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. Direct observation" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Period</label><input value={data.period} onChange={(e) => set("period", e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. 1-31 March 2026" /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Collection Notes</label><textarea value={data.notes} onChange={(e) => set("notes", e.target.value)} rows={4} className={`${inputClass} resize-none`} style={inputStyle} placeholder="Data collection observations and notes..." /></div>
        </>)}

        {stage === "ANALYSIS" && (<>
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Analysis & Comparison</h3>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Overall Compliance Rate</label><input value={data.complianceRate} onChange={(e) => set("complianceRate", e.target.value)} className={inputClass} style={inputStyle} placeholder="e.g. 72%" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Key Findings</label><textarea value={data.findings} onChange={(e) => set("findings", e.target.value)} rows={4} className={`${inputClass} resize-none`} style={inputStyle} placeholder="What did the data show?" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Gap Analysis</label><textarea value={data.gapAnalysis} onChange={(e) => set("gapAnalysis", e.target.value)} rows={3} className={`${inputClass} resize-none`} style={inputStyle} placeholder="Where are we falling short of the standard? Why?" /></div>
        </>)}

        {stage === "CHANGE" && (<>
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Implement Changes</h3>
          <table className="w-full text-xs"><thead><tr className="text-left text-[10px] font-semibold text-gray-500 border-b" style={{ borderColor: "#e5eaf0" }}><th className="pb-2 pr-2">Action</th><th className="pb-2 pr-2">Responsible</th><th className="pb-2 pr-2">Deadline</th><th className="pb-2">Status</th></tr></thead>
            <tbody>{data.changes.map((c, i) => (
              <tr key={i} className="border-b" style={{ borderColor: "#F3F4F6" }}>
                <td className="py-1 pr-1"><input value={c.action} onChange={(e) => set("changes", data.changes.map((ch, j) => j === i ? { ...ch, action: e.target.value } : ch))} className="w-full border-0 outline-none bg-transparent py-1" placeholder="Change action..." /></td>
                <td className="py-1 pr-1"><input value={c.responsible} onChange={(e) => set("changes", data.changes.map((ch, j) => j === i ? { ...ch, responsible: e.target.value } : ch))} className="w-full border-0 outline-none bg-transparent py-1" placeholder="Who" /></td>
                <td className="py-1 pr-1"><input type="date" value={c.deadline} onChange={(e) => set("changes", data.changes.map((ch, j) => j === i ? { ...ch, deadline: e.target.value } : ch))} className="border rounded px-1.5 py-1" style={{ borderColor: "#e5eaf0" }} /></td>
                <td className="py-1"><select value={c.status} onChange={(e) => set("changes", data.changes.map((ch, j) => j === i ? { ...ch, status: e.target.value } : ch))} className="border rounded px-1.5 py-1" style={{ borderColor: "#e5eaf0" }}><option>PENDING</option><option>IN_PROGRESS</option><option>DONE</option></select></td>
              </tr>
            ))}</tbody>
          </table>
          <button onClick={() => set("changes", [...data.changes, { action: "", responsible: "", deadline: "", status: "PENDING" }])} className="text-xs text-gray-400 hover:text-gray-600">+ Add action</button>
        </>)}

        {stage === "REAUDIT" && (<>
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Re-audit Planning</h3>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Re-audit Date</label><input type="date" value={data.reauditDate} onChange={(e) => set("reauditDate", e.target.value)} className={inputClass} style={inputStyle} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Re-audit Plan & Notes</label><textarea value={data.reauditNotes} onChange={(e) => set("reauditNotes", e.target.value)} rows={4} className={`${inputClass} resize-none`} style={inputStyle} placeholder="What will be measured in the re-audit? Same criteria? Any changes to methodology?" /></div>
        </>)}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#e5eaf0" }}>
          <button onClick={() => setStage(STAGES[Math.max(0, stageIdx - 1)].key)} disabled={stageIdx === 0} className="text-xs text-gray-500 disabled:opacity-30">Previous</button>
          <button onClick={() => setStage(STAGES[Math.min(STAGES.length - 1, stageIdx + 1)].key)} disabled={stageIdx === STAGES.length - 1} className="text-xs px-4 py-2 rounded-lg text-white" style={{ background: "#0F2744" }}>Next Step</button>
        </div>
      </div>
    </div>
  );
}
