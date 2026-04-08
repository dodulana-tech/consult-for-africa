"use client";

import { useState } from "react";
import type { Project } from "./types";

export default function CallsTab({ project, isEM }: { project: Project; isEM: boolean }) {
  const [interactions, setInteractions] = useState(project.interactions);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "CALL", summary: "", sentiment: "NEUTRAL", conductedAt: "", nextActionDate: "", nextActionNote: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setInteractions((prev) => [data.interaction, ...prev]);
      setForm({ type: "CALL", summary: "", sentiment: "NEUTRAL", conductedAt: "", nextActionDate: "", nextActionNote: "" });
      setShowForm(false);
    } catch {}
    finally { setSaving(false); }
  }

  const SENTIMENT_STYLES: Record<string, { bg: string; text: string }> = {
    POSITIVE: { bg: "bg-green-50", text: "text-green-700" },
    NEUTRAL: { bg: "bg-gray-100", text: "text-gray-600" },
    CONCERNED: { bg: "bg-amber-50", text: "text-amber-700" },
    NEGATIVE: { bg: "bg-red-50", text: "text-red-700" },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
          Client Interactions ({interactions.length})
        </h2>
        {isEM && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ background: "#0F2744" }}
          >
            {showForm ? "Cancel" : "Record Interaction"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: "#e5eaf0" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }}>
                <option value="CALL">Call</option>
                <option value="MEETING">Meeting</option>
                <option value="EMAIL">Email</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="SITE_VISIT">Site Visit</option>
                <option value="REPORT_DELIVERY">Report Delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sentiment</label>
              <select value={form.sentiment} onChange={(e) => setForm((p) => ({ ...p, sentiment: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }}>
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="CONCERNED">Concerned</option>
                <option value="NEGATIVE">Negative</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="datetime-local" value={form.conductedAt} onChange={(e) => setForm((p) => ({ ...p, conductedAt: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Summary *</label>
            <textarea required value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "#e5eaf0" }} placeholder="Key discussion points, decisions made, client feedback..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Next Action Date</label>
              <input type="date" value={form.nextActionDate} onChange={(e) => setForm((p) => ({ ...p, nextActionDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Next Action</label>
              <input value={form.nextActionNote} onChange={(e) => setForm((p) => ({ ...p, nextActionNote: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} placeholder="Follow-up action..." />
            </div>
          </div>
          <button type="submit" disabled={saving} className="text-sm px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "#0F2744" }}>
            {saving ? "Saving..." : "Record"}
          </button>
        </form>
      )}

      {interactions.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "#e5eaf0" }}>
          <p className="text-gray-400">No client interactions recorded yet.</p>
          {isEM && <p className="text-xs text-gray-300 mt-1">Record calls, meetings, and emails to track the client relationship.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((i) => {
            const sentStyle = SENTIMENT_STYLES[i.sentiment] ?? SENTIMENT_STYLES.NEUTRAL;
            const hasNextAction = i.nextActionDate || i.nextActionNote;
            const isOverdue = i.nextActionDate && new Date(i.nextActionDate) < new Date();

            return (
              <div key={i.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: "#0F2744" + "08", color: "#0F2744" }}>
                      {i.type.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${sentStyle.bg} ${sentStyle.text}`}>
                      {i.sentiment}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(i.conductedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{i.summary}</p>

                {hasNextAction && (
                  <div className={`mt-3 pt-3 border-t flex items-start gap-2 ${isOverdue ? "text-red-600" : "text-gray-500"}`} style={{ borderColor: "#e5eaf0" }}>
                    <span className="text-xs font-semibold">Next:</span>
                    <div className="text-xs">
                      {i.nextActionNote && <span>{i.nextActionNote}</span>}
                      {i.nextActionDate && (
                        <span className="ml-1">
                          (by {new Date(i.nextActionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          {isOverdue && " - overdue"})
                        </span>
                      )}
                    </div>
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
