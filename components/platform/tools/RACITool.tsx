"use client";

import { useState } from "react";
import { Plus, X, Download, Trash2 } from "lucide-react";

type Cell = "R" | "A" | "C" | "I" | "";

const RACI_COLORS: Record<string, { bg: string; color: string }> = {
  R: { bg: "#0F274415", color: "#0F2744" },
  A: { bg: "#DC262615", color: "#DC2626" },
  C: { bg: "#D9770615", color: "#D97706" },
  I: { bg: "#05966915", color: "#059669" },
  "": { bg: "transparent", color: "#D1D5DB" },
};

export default function RACITool() {
  const [tasks, setTasks] = useState(["Define scope", "Conduct assessment", "Draft report", "Client presentation"]);
  const [roles, setRoles] = useState(["Engagement Manager", "Lead Consultant", "Analyst", "Client Sponsor"]);
  const [matrix, setMatrix] = useState<Cell[][]>(
    Array(4).fill(null).map(() => Array(4).fill(""))
  );

  function setCell(taskIdx: number, roleIdx: number) {
    setMatrix((prev) => {
      const next = prev.map((r) => [...r]);
      const current = next[taskIdx][roleIdx];
      const cycle: Cell[] = ["", "R", "A", "C", "I"];
      const nextVal = cycle[(cycle.indexOf(current) + 1) % cycle.length];
      next[taskIdx][roleIdx] = nextVal;
      return next;
    });
  }

  function addTask() {
    setTasks((prev) => [...prev, ""]);
    setMatrix((prev) => [...prev, Array(roles.length).fill("")]);
  }

  function addRole() {
    setRoles((prev) => [...prev, ""]);
    setMatrix((prev) => prev.map((row) => [...row, ""]));
  }

  function removeTask(idx: number) {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
    setMatrix((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeRole(idx: number) {
    setRoles((prev) => prev.filter((_, i) => i !== idx));
    setMatrix((prev) => prev.map((row) => row.filter((_, i) => i !== idx)));
  }

  function handleExport() {
    const header = ["Task", ...roles].join("\t");
    const rows = tasks.map((t, i) => [t, ...matrix[i]].join("\t"));
    const text = `RACI MATRIX\n${"=".repeat(40)}\n\n${header}\n${rows.join("\n")}\n\nLegend: R=Responsible, A=Accountable, C=Consulted, I=Informed`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raci-matrix-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Validation
  const warnings: string[] = [];
  tasks.forEach((task, i) => {
    const row = matrix[i];
    const hasR = row.includes("R");
    const hasA = row.includes("A");
    const aCount = row.filter((c) => c === "A").length;
    if (!hasR && task) warnings.push(`"${task}" has no Responsible (R)`);
    if (!hasA && task) warnings.push(`"${task}" has no Accountable (A)`);
    if (aCount > 1 && task) warnings.push(`"${task}" has ${aCount} Accountable roles (should be 1)`);
  });

  return (
    <div className="p-6">
      <div className="max-w-5xl space-y-4">
        {/* Instructions */}
        <div className="rounded-xl p-4 text-xs text-gray-500 flex items-start gap-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <div className="space-y-1 flex-1">
            <p className="font-medium text-gray-700">How to use</p>
            <p>Click cells to cycle through R (Responsible), A (Accountable), C (Consulted), I (Informed). Each task should have exactly one A and at least one R. Add tasks and roles as needed.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#0F2744" }}>
              <Download size={11} /> Export
            </button>
            <button
              onClick={() => { setTasks([""]); setRoles([""]); setMatrix([[""]]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          {[
            { letter: "R", label: "Responsible (does the work)" },
            { letter: "A", label: "Accountable (owns the outcome)" },
            { letter: "C", label: "Consulted (provides input)" },
            { letter: "I", label: "Informed (kept in the loop)" },
          ].map(({ letter, label }) => (
            <div key={letter} className="flex items-center gap-1.5">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={RACI_COLORS[letter]}
              >
                {letter}
              </span>
              <span className="text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Matrix */}
        <div className="rounded-xl overflow-auto scrollbar-thin" style={{ border: "1px solid #e5eaf0", WebkitOverflowScrolling: "touch" }}>
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="text-left px-2 sm:px-3 py-2 text-xs font-semibold text-gray-500" style={{ borderBottom: "1px solid #e5eaf0" }}>
                  Task / Activity
                </th>
                {roles.map((role, ri) => (
                  <th key={ri} className="px-1 sm:px-2 py-2 text-center" style={{ borderBottom: "1px solid #e5eaf0" }}>
                    <div className="flex items-center gap-1 justify-center group">
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRoles((prev) => prev.map((r, i) => (i === ri ? e.target.value : r)))}
                        className="text-xs font-semibold text-gray-700 bg-transparent border-none outline-none text-center w-full"
                        placeholder="Role..."
                      />
                      {roles.length > 1 && (
                        <button onClick={() => removeRole(ri)} className="opacity-0 group-hover:opacity-100 shrink-0">
                          <X size={10} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-2 py-2" style={{ borderBottom: "1px solid #e5eaf0" }}>
                  <button onClick={addRole} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 mx-auto">
                    <Plus size={11} className="text-gray-400" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, ti) => (
                <tr key={ti} className="group" style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={task}
                        onChange={(e) => setTasks((prev) => prev.map((t, i) => (i === ti ? e.target.value : t)))}
                        className="text-xs sm:text-sm text-gray-800 bg-transparent border-none outline-none w-full"
                        placeholder="Task description..."
                      />
                      {tasks.length > 1 && (
                        <button onClick={() => removeTask(ti)} className="opacity-0 group-hover:opacity-100 shrink-0">
                          <X size={10} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                  {roles.map((_, ri) => {
                    const val = matrix[ti]?.[ri] ?? "";
                    const style = RACI_COLORS[val] || RACI_COLORS[""];
                    return (
                      <td key={ri} className="px-1 sm:px-2 py-1.5 sm:py-2 text-center">
                        <button
                          onClick={() => setCell(ti, ri)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mx-auto text-xs font-bold transition-all hover:scale-110"
                          style={{ background: style.bg, color: style.color, border: val ? `1.5px solid ${style.color}30` : "1.5px solid #E5E7EB" }}
                        >
                          {val || "-"}
                        </button>
                      </td>
                    );
                  })}
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2" style={{ background: "#F9FAFB", borderTop: "1px solid #e5eaf0" }}>
            <button onClick={addTask} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
              <Plus size={11} /> Add task
            </button>
          </div>
        </div>

        {/* Validation */}
        {warnings.length > 0 && (
          <div className="rounded-xl p-4 text-xs" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            <p className="font-medium text-amber-700 mb-1">Validation Warnings</p>
            <ul className="space-y-0.5 text-amber-600">
              {warnings.map((w, i) => (
                <li key={i}>- {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
