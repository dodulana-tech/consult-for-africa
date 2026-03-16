"use client";

import { useState } from "react";
import { Plus, X, Download, Trash2 } from "lucide-react";

const DEFAULT_CATEGORIES = [
  "People",
  "Process",
  "Equipment",
  "Environment",
  "Materials",
  "Management",
];

type Cause = { id: string; text: string };

export default function FishboneTool() {
  const [problem, setProblem] = useState("Problem Statement");
  const [categories, setCategories] = useState<Record<string, Cause[]>>(
    Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c, []]))
  );

  function addCause(category: string) {
    setCategories((prev) => ({
      ...prev,
      [category]: [...prev[category], { id: Math.random().toString(36).slice(2, 9), text: "" }],
    }));
  }

  function updateCause(category: string, id: string, text: string) {
    setCategories((prev) => ({
      ...prev,
      [category]: prev[category].map((c) => (c.id === id ? { ...c, text } : c)),
    }));
  }

  function removeCause(category: string, id: string) {
    setCategories((prev) => ({
      ...prev,
      [category]: prev[category].filter((c) => c.id !== id),
    }));
  }

  function handleExport() {
    let text = `FISHBONE DIAGRAM (Ishikawa)\n${"=".repeat(40)}\n\nPROBLEM: ${problem}\n\n`;
    for (const [cat, causes] of Object.entries(categories)) {
      text += `${cat.toUpperCase()}\n`;
      if (causes.length === 0) text += "  (no causes identified)\n";
      for (const c of causes) text += `  - ${c.text || "(empty)"}\n`;
      text += "\n";
    }
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fishbone-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const categoryColors = ["#0F2744", "#D97706", "#059669", "#7C3AED", "#DC2626", "#0891B2"];

  return (
    <div className="p-6">
      <div className="max-w-4xl space-y-4">
        {/* Instructions */}
        <div
          className="rounded-xl p-4 text-xs text-gray-500 flex items-start gap-3"
          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
        >
          <div className="space-y-1 flex-1">
            <p className="font-medium text-gray-700">How to use</p>
            <p>Define the problem on the right (the fish head). Add root causes under each category. In healthcare settings, focus on systemic causes rather than blaming individuals. Click + to add causes, hover to remove them.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#0F2744" }}>
              <Download size={11} /> Export
            </button>
            <button
              onClick={() => { setProblem(""); setCategories(Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c, []]))); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
        </div>

        {/* Problem statement */}
        <div className="rounded-xl p-4" style={{ background: "#DC262610", border: "1.5px solid #DC262630" }}>
          <label className="block text-xs font-medium text-red-700 mb-1.5">Problem (Effect)</label>
          <input
            type="text"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="w-full text-sm font-semibold bg-transparent border-none outline-none text-red-900"
            placeholder="What is the problem?"
          />
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(categories).map(([category, causes], idx) => {
            const color = categoryColors[idx % categoryColors.length];
            return (
              <div
                key={category}
                className="rounded-xl p-4 space-y-2"
                style={{ background: "#fff", border: `1.5px solid ${color}25` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    {category}
                  </h3>
                  <button
                    onClick={() => addCause(category)}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={11} style={{ color }} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {causes.map((cause) => (
                    <div key={cause.id} className="flex items-center gap-1.5 group">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                      <input
                        type="text"
                        value={cause.text}
                        onChange={(e) => updateCause(category, cause.id, e.target.value)}
                        className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700"
                        placeholder="Root cause..."
                        autoFocus
                      />
                      <button
                        onClick={() => removeCause(category, cause.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                  {causes.length === 0 && (
                    <p className="text-[10px] text-gray-300 italic">Click + to add causes</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
