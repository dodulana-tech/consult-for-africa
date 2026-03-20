"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

const QUADRANTS = [
  { key: "eliminate", label: "Eliminate", description: "Factors the industry takes for granted that should be eliminated", color: "#DC2626", bg: "#FEF2F2" },
  { key: "reduce", label: "Reduce", description: "Factors that should be reduced well below the industry standard", color: "#D97706", bg: "#FFFBEB" },
  { key: "raise", label: "Raise", description: "Factors that should be raised well above the industry standard", color: "#2563EB", bg: "#EFF6FF" },
  { key: "create", label: "Create", description: "Factors the industry has never offered that should be created", color: "#059669", bg: "#F0FDF4" },
];

export default function ERRCGridTool() {
  const [title, setTitle] = useState("Healthcare Service Redesign");
  const [items, setItems] = useState<Record<string, string[]>>({
    eliminate: [""],
    reduce: [""],
    raise: [""],
    create: [""],
  });

  function setItem(quadrant: string, idx: number, value: string) {
    setItems((prev) => ({ ...prev, [quadrant]: prev[quadrant].map((v, i) => i === idx ? value : v) }));
  }
  function addItem(quadrant: string) {
    setItems((prev) => ({ ...prev, [quadrant]: [...prev[quadrant], ""] }));
  }
  function removeItem(quadrant: string, idx: number) {
    setItems((prev) => ({ ...prev, [quadrant]: prev[quadrant].filter((_, i) => i !== idx) }));
  }

  function exportText() {
    const text = QUADRANTS.map((q) => `${q.label.toUpperCase()}\n${items[q.key].filter(Boolean).map((v, i) => `  ${i + 1}. ${v}`).join("\n") || "  (none)"}`).join("\n\n");
    const blob = new Blob([`ERRC Grid: ${title}\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "errc-grid.txt"; a.click();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-bold border-0 border-b border-transparent focus:border-gray-200 outline-none bg-transparent" style={{ color: "#0F2744" }} />
        <button onClick={exportText} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => (
          <div key={q.key} className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
            <div className="px-4 py-3" style={{ background: q.bg }}>
              <h3 className="text-sm font-bold" style={{ color: q.color }}>{q.label}</h3>
              <p className="text-[10px]" style={{ color: q.color + "99" }}>{q.description}</p>
            </div>
            <div className="bg-white p-4 space-y-2">
              {items[q.key].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-300 w-4">{idx + 1}.</span>
                  <input value={item} onChange={(e) => setItem(q.key, idx, e.target.value)} className="flex-1 text-sm border-0 border-b border-gray-100 focus:border-gray-300 outline-none py-1 bg-transparent" placeholder={`What to ${q.label.toLowerCase()}...`} />
                  {items[q.key].length > 1 && <button onClick={() => removeItem(q.key, idx)} className="text-gray-300 hover:text-red-400"><X size={12} /></button>}
                </div>
              ))}
              <button onClick={() => addItem(q.key)} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-2"><Plus size={10} /> Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
