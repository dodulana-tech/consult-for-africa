"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface Stakeholder { id: string; name: string; role: string; influence: number; interest: number; strategy: string; notes: string }

let c = 0;
function uid() { return `s-${++c}`; }

function quadrant(influence: number, interest: number): { label: string; color: string; bg: string } {
  if (influence >= 5 && interest >= 5) return { label: "Manage Closely", color: "#DC2626", bg: "#FEF2F2" };
  if (influence >= 5 && interest < 5) return { label: "Keep Satisfied", color: "#D97706", bg: "#FFFBEB" };
  if (influence < 5 && interest >= 5) return { label: "Keep Informed", color: "#2563EB", bg: "#EFF6FF" };
  return { label: "Monitor", color: "#6B7280", bg: "#F3F4F6" };
}

export default function StakeholderMapTool() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    { id: uid(), name: "", role: "", influence: 5, interest: 5, strategy: "", notes: "" },
  ]);

  function update(id: string, field: string, value: string | number) {
    setStakeholders((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }
  function add() { setStakeholders((prev) => [...prev, { id: uid(), name: "", role: "", influence: 5, interest: 5, strategy: "", notes: "" }]); }
  function remove(id: string) { setStakeholders((prev) => prev.filter((s) => s.id !== id)); }

  function exportText() {
    const text = stakeholders.filter((s) => s.name).map((s) => {
      const q = quadrant(s.influence, s.interest);
      return `${s.name} (${s.role})\n  Influence: ${s.influence}/10 | Interest: ${s.interest}/10 | Quadrant: ${q.label}\n  Strategy: ${s.strategy}\n  Notes: ${s.notes}`;
    }).join("\n\n");
    const blob = new Blob([`Stakeholder Analysis\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "stakeholder-map.txt"; a.click();
  }

  // Grid visualization
  const gridStakeholders = stakeholders.filter((s) => s.name);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between">
        <p className="text-xs text-gray-400">Map stakeholders by influence and interest to determine engagement strategy.</p>
        <div className="flex gap-2">
          <button onClick={exportText} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
          <button onClick={add} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: "#0F2744" }}><Plus size={12} /> Add</button>
        </div>
      </div>

      {/* 2x2 Grid */}
      {gridStakeholders.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          <div className="grid grid-cols-2 min-h-[300px]">
            <div className="p-4 border-r border-b" style={{ borderColor: "#e5eaf0", background: "#FFFBEB" }}>
              <p className="text-[10px] font-bold text-amber-700 mb-2">Keep Satisfied (High Influence, Low Interest)</p>
              {gridStakeholders.filter((s) => s.influence >= 5 && s.interest < 5).map((s) => (
                <span key={s.id} className="inline-block text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 mr-1 mb-1">{s.name}</span>
              ))}
            </div>
            <div className="p-4 border-b" style={{ borderColor: "#e5eaf0", background: "#FEF2F2" }}>
              <p className="text-[10px] font-bold text-red-700 mb-2">Manage Closely (High Influence, High Interest)</p>
              {gridStakeholders.filter((s) => s.influence >= 5 && s.interest >= 5).map((s) => (
                <span key={s.id} className="inline-block text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-800 mr-1 mb-1">{s.name}</span>
              ))}
            </div>
            <div className="p-4 border-r" style={{ borderColor: "#e5eaf0", background: "#F3F4F6" }}>
              <p className="text-[10px] font-bold text-gray-600 mb-2">Monitor (Low Influence, Low Interest)</p>
              {gridStakeholders.filter((s) => s.influence < 5 && s.interest < 5).map((s) => (
                <span key={s.id} className="inline-block text-[10px] px-2 py-1 rounded-full bg-gray-200 text-gray-700 mr-1 mb-1">{s.name}</span>
              ))}
            </div>
            <div className="p-4" style={{ background: "#EFF6FF" }}>
              <p className="text-[10px] font-bold text-blue-700 mb-2">Keep Informed (Low Influence, High Interest)</p>
              {gridStakeholders.filter((s) => s.influence < 5 && s.interest >= 5).map((s) => (
                <span key={s.id} className="inline-block text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-800 mr-1 mb-1">{s.name}</span>
              ))}
            </div>
          </div>
          <div className="flex justify-between px-4 py-1 text-[10px] text-gray-400" style={{ background: "#F9FAFB" }}>
            <span>Low Interest</span><span>High Interest</span>
          </div>
        </div>
      )}

      {/* Stakeholder list */}
      {stakeholders.map((s) => {
        const q = quadrant(s.influence, s.interest);
        return (
          <div key={s.id} className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input value={s.name} onChange={(e) => update(s.id, "name", e.target.value)} className="text-sm font-medium border-0 border-b border-gray-100 outline-none bg-transparent pb-1" style={{ color: "#0F2744" }} placeholder="Stakeholder name" />
                  <input value={s.role} onChange={(e) => update(s.id, "role", e.target.value)} className="text-xs border-0 border-b border-gray-100 outline-none bg-transparent pb-1 text-gray-500" placeholder="Role/Position" />
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full self-start" style={{ background: q.bg, color: q.color }}>{q.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Influence: {s.influence}/10</label>
                    <input type="range" min="1" max="10" value={s.influence} onChange={(e) => update(s.id, "influence", Number(e.target.value))} className="w-full accent-amber-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Interest: {s.interest}/10</label>
                    <input type="range" min="1" max="10" value={s.interest} onChange={(e) => update(s.id, "interest", Number(e.target.value))} className="w-full accent-blue-600" />
                  </div>
                </div>
                <input value={s.strategy} onChange={(e) => update(s.id, "strategy", e.target.value)} className="w-full text-xs border-0 border-b border-gray-100 outline-none bg-transparent py-1" placeholder="Engagement strategy..." />
              </div>
              <button onClick={() => remove(s.id)} className="text-gray-300 hover:text-red-400"><X size={14} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
