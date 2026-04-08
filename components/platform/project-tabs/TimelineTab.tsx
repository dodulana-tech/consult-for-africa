"use client";

import { useState } from "react";
import {
  Flag,
  FileCheck,
  Layers,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";
import StatusBadge from "../StatusBadge";
import type { Project } from "./types";
import { formatDate, timelineProgress } from "@/lib/utils";

export default function TimelineTab({ project, isEM }: { project: Project; isEM: boolean }) {
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const [milestones, setMilestones] = useState(project.milestones);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", description: "", dueDate: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const { milestone } = await res.json();
        setMilestones((prev) => [...prev, milestone].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
        setAddForm({ name: "", description: "", dueDate: "" });
        setShowAdd(false);
      }
    } catch {}
    finally { setAddSaving(false); }
  }

  async function cycleStatus(milestoneId: string, currentStatus: string) {
    const next: Record<string, string> = { PENDING: "IN_PROGRESS", IN_PROGRESS: "COMPLETED", COMPLETED: "PENDING", DELAYED: "COMPLETED", SKIPPED: "PENDING" };
    const newStatus = next[currentStatus] ?? "PENDING";
    setUpdatingId(milestoneId);
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const { milestone } = await res.json();
        setMilestones((prev) => prev.map((m) => m.id === milestoneId ? milestone : m));
      }
    } catch {}
    finally { setUpdatingId(null); }
  }

  async function deleteMilestone(milestoneId: string) {
    if (!confirm("Delete this milestone?")) return;
    try {
      await fetch(`/api/projects/${project.id}/milestones/${milestoneId}`, { method: "DELETE" });
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    } catch {}
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Progress bar */}
      <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>{formatDate(startDate)}</span>
          <span className="font-medium text-gray-700">Today</span>
          <span>{formatDate(endDate)}</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full">
          {(() => {
            const pct = timelineProgress(startDate, endDate);
            return (
              <>
                <div className="absolute h-full rounded-full" style={{ width: `${pct}%`, background: "#0F2744" }} />
                <div className="absolute w-3 h-3 rounded-full -mt-0.5 border-2 border-white shadow-sm" style={{ left: `calc(${pct}% - 6px)`, background: "#D4AF37" }} />
              </>
            );
          })()}
        </div>
      </div>

      {/* Add milestone */}
      {isEM && (
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(!showAdd)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F2744" }}>
            {showAdd ? "Cancel" : "Add Milestone"}
          </button>
        </div>
      )}

      {showAdd && (
        <form onSubmit={addMilestone} className="rounded-xl p-5 space-y-3" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input required value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} placeholder="e.g. Phase 1 Complete" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
              <input required type="date" value={addForm.dueDate} onChange={(e) => setAddForm((p) => ({ ...p, dueDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input value={addForm.description} onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} placeholder="Brief description" />
          </div>
          <button type="submit" disabled={addSaving} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "#D4AF37" }}>
            {addSaving ? "Adding..." : "Add"}
          </button>
        </form>
      )}

      {/* Unified Timeline: Milestones + Tracks + Deliverables */}
      {(() => {
        type TimelineEntry =
          | { kind: "milestone"; date: Date; data: (typeof milestones)[number] }
          | { kind: "track"; date: Date; data: (typeof project.tracks)[number] }
          | { kind: "deliverable"; date: Date; data: (typeof project.deliverables)[number] };

        const entries: TimelineEntry[] = [];

        milestones.forEach((m) =>
          entries.push({ kind: "milestone", date: new Date(m.dueDate), data: m })
        );
        project.tracks.forEach((t) => {
          const d = t.endDate ?? t.startDate;
          if (d) entries.push({ kind: "track", date: new Date(d), data: t });
        });
        project.deliverables.forEach((d) => {
          if (d.dueDate) entries.push({ kind: "deliverable", date: new Date(d.dueDate), data: d });
        });

        entries.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (entries.length === 0) {
          return (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
              <div className="bg-white p-10 text-center">
                <Flag size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No milestones, tracks, or deliverables defined yet.</p>
              </div>
            </div>
          );
        }

        return (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
            <div className="divide-y divide-gray-50 bg-white">
              {entries.map((entry, i) => {
                const now = new Date();

                if (entry.kind === "milestone") {
                  const m = entry.data;
                  const due = new Date(m.dueDate);
                  const overdue = due < now && m.status !== "COMPLETED" && m.status !== "SKIPPED";

                  const iconMap: Record<string, typeof CheckCircle2> = {
                    COMPLETED: CheckCircle2,
                    DELAYED: XCircle,
                    SKIPPED: XCircle,
                    IN_PROGRESS: Circle,
                    PENDING: Circle,
                  };
                  const MIcon = iconMap[m.status] ?? Circle;
                  const iconColor =
                    m.status === "COMPLETED"
                      ? "#10B981"
                      : m.status === "DELAYED" || overdue
                      ? "#EF4444"
                      : m.status === "IN_PROGRESS"
                      ? "#3B82F6"
                      : "#D1D5DB";

                  return (
                    <div key={`ms-${m.id}`} className="flex items-start gap-4 px-5 py-4 group">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        {isEM ? (
                          <button
                            onClick={() => cycleStatus(m.id, m.status)}
                            disabled={updatingId === m.id}
                            className="transition-transform hover:scale-110 disabled:opacity-50"
                            title="Click to cycle status"
                          >
                            <MIcon size={18} style={{ color: iconColor }} />
                          </button>
                        ) : (
                          <MIcon size={18} style={{ color: iconColor }} />
                        )}
                        {i < entries.length - 1 && (
                          <div className="w-0.5 h-6 bg-gray-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Flag size={14} style={{ color: "#D4AF37" }} />
                            <p className="text-sm font-medium text-gray-900">{m.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#FEF9E7", color: "#92711F" }}>Milestone</span>
                            <StatusBadge status={m.status} />
                            {isEM && <button onClick={() => deleteMilestone(m.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">x</button>}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className={overdue ? "text-red-500 font-medium" : ""}>
                            Due {formatDate(due)}
                          </span>
                          {m.completionDate && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-600">
                                Completed {formatDate(new Date(m.completionDate))}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (entry.kind === "track") {
                  const t = entry.data;
                  const trackIconColor =
                    t.status === "COMPLETED"
                      ? "#10B981"
                      : t.status === "ACTIVE" || t.status === "IN_PROGRESS"
                      ? "#3B82F6"
                      : "#D1D5DB";

                  return (
                    <div key={`tr-${t.id}`} className="flex items-start gap-4 px-5 py-4">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-[18px] h-[18px] flex items-center justify-center">
                          <Layers size={16} style={{ color: trackIconColor }} />
                        </div>
                        {i < entries.length - 1 && (
                          <div className="w-0.5 h-6 bg-gray-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Layers size={14} style={{ color: "#0F2744" }} />
                            <p className="text-sm font-medium text-gray-900">{t.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#EEF2FF", color: "#4338CA" }}>Track</span>
                            <StatusBadge status={t.status} />
                          </div>
                        </div>
                        {t.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          {t.startDate && <span>{formatDate(new Date(t.startDate))}</span>}
                          {t.startDate && t.endDate && <span>-</span>}
                          {t.endDate && <span>{formatDate(new Date(t.endDate))}</span>}
                          {t.team.length > 0 && (
                            <>
                              <span>·</span>
                              <span>{t.team.length} member{t.team.length !== 1 ? "s" : ""}</span>
                            </>
                          )}
                          {t.deliverables.length > 0 && (
                            <>
                              <span>·</span>
                              <span>{t.deliverables.length} deliverable{t.deliverables.length !== 1 ? "s" : ""}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // deliverable
                const d = entry.data;
                const due = d.dueDate ? new Date(d.dueDate) : null;
                const overdue = due && due < now && d.status !== "COMPLETED" && d.status !== "APPROVED";
                const delivIconColor =
                  d.status === "COMPLETED" || d.status === "APPROVED"
                    ? "#10B981"
                    : d.status === "IN_PROGRESS" || d.status === "SUBMITTED"
                    ? "#3B82F6"
                    : overdue
                    ? "#EF4444"
                    : "#D1D5DB";

                return (
                  <div key={`dl-${d.id}`} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-[18px] h-[18px] flex items-center justify-center">
                        <FileCheck size={16} style={{ color: delivIconColor }} />
                      </div>
                      {i < entries.length - 1 && (
                        <div className="w-0.5 h-6 bg-gray-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileCheck size={14} style={{ color: "#0F2744" }} />
                          <p className="text-sm font-medium text-gray-900">{d.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#F0FDF4", color: "#15803D" }}>Deliverable</span>
                          <StatusBadge status={d.status} />
                        </div>
                      </div>
                      {d.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{d.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        {due && (
                          <span className={overdue ? "text-red-500 font-medium" : ""}>
                            Due {formatDate(due)}
                          </span>
                        )}
                        {d.assignment?.consultant?.name && (
                          <>
                            <span>·</span>
                            <span>{d.assignment.consultant.name}</span>
                          </>
                        )}
                        {d.submittedAt && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600">
                              Submitted {formatDate(new Date(d.submittedAt))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
