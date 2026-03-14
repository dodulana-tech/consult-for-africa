"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type Project = { id: string; name: string };

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            size={18}
            className={
              n <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }
          />
        </button>
      ))}
    </div>
  );
}

const CRITERIA = [
  { key: "technicalQuality", label: "Technical Quality" },
  { key: "communication", label: "Communication" },
  { key: "timeliness", label: "Timeliness" },
  { key: "professionalism", label: "Professionalism" },
] as const;

export default function RateConsultantForm({
  consultantUserId,
  projects,
}: {
  consultantUserId: string;
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [scores, setScores] = useState({ technicalQuality: 0, communication: 0, timeliness: 0, professionalism: 0 });
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (projects.length === 0) return null;

  const allScored = Object.values(scores).every((s) => s > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allScored || !projectId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/consultant-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantUserId, projectId, ...scores, feedback }),
      });
      if (res.status === 409) { setError("You already rated this consultant on the selected project."); return; }
      if (!res.ok) { setError("Something went wrong. Please try again."); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
        <p className="text-sm text-emerald-600 font-medium">Rating submitted. Thank you.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-gray-900">Rate This Consultant</span>
        </div>
        <span className="text-xs text-gray-400">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: "#e5eaf0" }}>
          {/* Project selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none"
              style={{ borderColor: "#e5eaf0" }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Score sliders */}
          <div className="space-y-3">
            {CRITERIA.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-40">{label}</span>
                <StarPicker
                  value={scores[key]}
                  onChange={(n) => setScores((s) => ({ ...s, [key]: n }))}
                />
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Feedback <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Specific observations for this consultant..."
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ borderColor: "#e5eaf0" }}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!allScored || loading}
            className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "#0F2744" }}
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>
        </form>
      )}
    </div>
  );
}
