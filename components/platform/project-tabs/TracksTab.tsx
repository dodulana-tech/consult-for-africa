"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  CheckCircle2,
  Clock,
  Circle,
  Trash2,
} from "lucide-react";
import type { Project } from "./types";
import { formatDate } from "@/lib/utils";

export default function TracksTab({ project, isEM }: { project: Project; isEM: boolean }) {
  const router = useRouter();
  const [tracks, setTracks] = useState(project.tracks);

  // Sync with server props when they change (e.g. after router.refresh)
  useEffect(() => { setTracks(project.tracks); }, [project.tracks]);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; description: string; suggestedRole: string; suggestedSkills: string[]; suggestedDeliverables: string[]; estimatedWeeks: number }[]>([]);

  async function refresh() {
    const res = await fetch(`/api/projects/${project.id}/tracks`);
    if (res.ok) {
      const data = await res.json();
      setTracks(data.tracks);
    }
    // Also refresh server component data so tab switches show fresh data
    router.refresh();
  }

  async function createTrack(name: string, description: string) {
    setSaving(true);
    try {
      await fetch(`/api/projects/${project.id}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      await refresh();
      setAddName("");
      setAddDesc("");
      setShowAdd(false);
    } catch {} finally { setSaving(false); }
  }

  async function updateTrackStatus(trackId: string, status: string) {
    await fetch(`/api/projects/${project.id}/tracks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, status }),
    });
    await refresh();
  }

  async function deleteTrack(trackId: string, name: string) {
    if (!confirm(`Delete track "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/projects/${project.id}/tracks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    });
    if (res.ok) {
      await refresh();
    } else {
      alert("Could not delete this track. Please try again.");
    }
  }

  async function askNuru() {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/ai/suggest-tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.tracks ?? []);
      }
    } catch {} finally { setSuggesting(false); }
  }

  async function addSuggestion(s: typeof suggestions[0], idx: number) {
    await createTrack(s.name, s.description);
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  }

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    OPEN: { bg: "#F3F4F6", color: "#6B7280" },
    ACTIVE: { bg: "#D1FAE5", color: "#065F46" },
    PAUSED: { bg: "#FEF3C7", color: "#92400E" },
    COMPLETED: { bg: "#EFF6FF", color: "#1D4ED8" },
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {isEM && (
          <>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: "#0F2744" }}
            >
              {showAdd ? "Cancel" : "+ Add Track"}
            </button>
            <button
              onClick={askNuru}
              disabled={suggesting}
              className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
              style={{ background: "#D4AF37" + "15", color: "#92400E", border: "1px solid " + "#D4AF37" + "40" }}
            >
              {suggesting ? "Thinking..." : "Nuru: Suggest Tracks"}
            </button>
          </>
        )}
      </div>

      {/* Nuru suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#D4AF37" + "40", background: "#D4AF37" + "05" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "#0F2744" }}>Nuru suggests {suggestions.length} tracks</p>
            <button onClick={() => setSuggestions([])} className="text-[10px] text-gray-400">Dismiss</button>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start justify-between bg-white rounded-lg border p-3" style={{ borderColor: "#e5eaf0" }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {s.suggestedSkills.map((sk) => (
                      <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{sk}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Role: {s.suggestedRole} | ~{s.estimatedWeeks} weeks</p>
                  {s.suggestedDeliverables.length > 0 && (
                    <p className="text-[10px] text-gray-400">Deliverables: {s.suggestedDeliverables.join(", ")}</p>
                  )}
                </div>
                <button
                  onClick={() => addSuggestion(s, i)}
                  className="text-[10px] px-2.5 py-1 rounded-lg text-white shrink-0 ml-3"
                  style={{ background: "#0F2744" }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (addName.trim()) createTrack(addName, addDesc); }}
          className="bg-white rounded-xl border p-4 space-y-3"
          style={{ borderColor: "#e5eaf0" }}
        >
          <input
            required
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: "#e5eaf0" }}
            placeholder="Track name (e.g. Clinical Operations)"
          />
          <textarea
            value={addDesc}
            onChange={(e) => setAddDesc(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: "#e5eaf0" }}
            rows={2}
            placeholder="Description (optional)"
          />
          <button
            type="submit"
            disabled={saving || !addName.trim()}
            className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ background: "#D4AF37" }}
          >
            {saving ? "Creating..." : "Create Track"}
          </button>
        </form>
      )}

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5eaf0" }}>
          <Layers size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No tracks yet. Add workstreams to organize your team and deliverables.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => {
            const sc = STATUS_COLORS[track.status] ?? STATUS_COLORS.OPEN;
            const completedDel = track.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT").length;
            const totalDel = track.deliverables.length;
            const progressPct = totalDel > 0 ? Math.round((completedDel / totalDel) * 100) : 0;

            return (
              <div key={track.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
                {/* Track header */}
                <div className="px-5 py-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold" style={{ color: "#0F2744" }}>{track.name}</h3>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                        {track.status}
                      </span>
                    </div>
                    {track.description && <p className="text-xs text-gray-500">{track.description}</p>}
                  </div>
                  {isEM && (
                    <div className="flex gap-1.5 shrink-0">
                      {track.status === "OPEN" && (
                        <button onClick={() => updateTrackStatus(track.id, "ACTIVE")} className="text-[10px] px-2 py-1 rounded text-green-700 bg-green-50 hover:bg-green-100">Activate</button>
                      )}
                      {track.status === "ACTIVE" && (
                        <button onClick={() => updateTrackStatus(track.id, "COMPLETED")} className="text-[10px] px-2 py-1 rounded text-blue-700 bg-blue-50 hover:bg-blue-100">Complete</button>
                      )}
                      {track.status === "ACTIVE" && (
                        <button onClick={() => updateTrackStatus(track.id, "PAUSED")} className="text-[10px] px-2 py-1 rounded text-amber-700 bg-amber-50 hover:bg-amber-100">Pause</button>
                      )}
                      {track.status === "PAUSED" && (
                        <button onClick={() => updateTrackStatus(track.id, "ACTIVE")} className="text-[10px] px-2 py-1 rounded text-green-700 bg-green-50 hover:bg-green-100">Resume</button>
                      )}
                      <button onClick={() => deleteTrack(track.id, track.name)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50" title="Delete track">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {totalDel > 0 && (
                  <div className="px-5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%`, background: "#10B981" }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{completedDel}/{totalDel}</span>
                    </div>
                  </div>
                )}

                {/* Team */}
                {track.team.length > 0 && (
                  <div className="px-5 pb-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Team</p>
                    <div className="flex flex-wrap gap-2">
                      {track.team.map((m) => (
                        <div key={m.assignmentId} className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white" style={{ background: "#0F2744" }}>
                            {m.consultantName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-700">{m.consultantName}</span>
                          {m.trackRole && <span className="text-[10px] text-gray-400">{m.trackRole}</span>}
                          {m.allocationPct < 100 && <span className="text-[10px] text-blue-500">{m.allocationPct}%</span>}
                          {!m.isBillable && <span className="text-[10px] text-amber-500">(non-billable)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {track.deliverables.length > 0 && (
                  <div className="px-5 pb-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Deliverables</p>
                    <div className="space-y-1">
                      {track.deliverables.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-xs py-1">
                          <div className="flex items-center gap-1.5">
                            {d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT" ? (
                              <CheckCircle2 size={12} className="text-green-500" />
                            ) : d.status === "SUBMITTED" || d.status === "IN_REVIEW" ? (
                              <Clock size={12} className="text-blue-500" />
                            ) : (
                              <Circle size={12} className="text-gray-300" />
                            )}
                            <span className="text-gray-700">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {d.dueDate && <span className="text-[10px] text-gray-400">{formatDate(new Date(d.dueDate))}</span>}
                            {!d.assigned && <span className="text-[10px] text-amber-500">Unassigned</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state for unstaffed tracks */}
                {track.team.length === 0 && track.deliverables.length === 0 && (
                  <div className="px-5 pb-4 text-center">
                    <p className="text-xs text-gray-400">No team or deliverables assigned yet</p>
                  </div>
                )}

                {/* Open staffing requests */}
                {track.openStaffingRequests > 0 && (
                  <div className="px-5 pb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      {track.openStaffingRequests} open staffing {track.openStaffingRequests === 1 ? "request" : "requests"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
