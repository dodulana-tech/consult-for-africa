"use client";

import { useState, useEffect } from "react";
import { Plus, X, Sparkles, Loader2, Trash2 } from "lucide-react";

interface Idea {
  id: string;
  title: string;
  content: string;
  category: string | null;
  priority: string;
  status: string;
  nuruNotes: string | null;
  tags: string[];
  createdAt: string;
}

const CATEGORIES = ["PRODUCT", "REVENUE", "PARTNERSHIP", "GROWTH", "OPERATIONS", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["CAPTURED", "EXPLORING", "IN_PROGRESS", "PARKED", "DONE"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  CAPTURED: { bg: "#EFF6FF", color: "#1D4ED8" },
  EXPLORING: { bg: "#FEF9E7", color: "#92400E" },
  IN_PROGRESS: { bg: "#D1FAE5", color: "#065F46" },
  PARKED: { bg: "#F3F4F6", color: "#6B7280" },
  DONE: { bg: "#F0FDF4", color: "#15803D" },
};

export default function IdeationPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "PRODUCT", priority: "MEDIUM" });
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [nuruLoading, setNuruLoading] = useState<string | null>(null);

  useEffect(() => {
    loadIdeas();
  }, []);

  async function loadIdeas() {
    const res = await fetch("/api/founder/ideas");
    if (res.ok) setIdeas(await res.json());
    setLoading(false);
  }

  async function createIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/founder/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const idea = await res.json();
      setIdeas([idea, ...ideas]);
      setForm({ title: "", content: "", category: "PRODUCT", priority: "MEDIUM" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/founder/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setIdeas(ideas.map(i => i.id === id ? { ...i, status } : i));
  }

  async function deleteIdea(id: string) {
    await fetch("/api/founder/ideas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setIdeas(ideas.filter(i => i.id !== id));
    if (selectedIdea?.id === id) setSelectedIdea(null);
  }

  async function askNuru(idea: Idea) {
    setNuruLoading(idea.id);
    try {
      const res = await fetch("/api/founder/ideas/nuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, title: idea.title, content: idea.content, category: idea.category }),
      });
      if (res.ok) {
        const { nuruNotes } = await res.json();
        setIdeas(ideas.map(i => i.id === idea.id ? { ...i, nuruNotes } : i));
        if (selectedIdea?.id === idea.id) setSelectedIdea({ ...idea, nuruNotes });
      }
    } finally {
      setNuruLoading(null);
    }
  }

  const grouped = {
    active: ideas.filter(i => ["CAPTURED", "EXPLORING", "IN_PROGRESS"].includes(i.status)),
    parked: ideas.filter(i => i.status === "PARKED"),
    done: ideas.filter(i => i.status === "DONE"),
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>Ideation Pad</h1>
          <p className="text-sm text-gray-500 mt-0.5">Capture ideas, explore with Nuru, track progress</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
          style={{ background: "#0F2744" }}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New Idea"}
        </button>
      </div>

      {/* New idea form */}
      {showForm && (
        <form onSubmit={createIdea} className="rounded-2xl bg-white p-6 shadow-sm mb-6" style={{ border: "1px solid #E8EBF0" }}>
          <div className="space-y-4">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="What's the idea?"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
            />
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Flesh it out... context, why now, potential impact"
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
            />
            <div className="flex gap-3">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="submit" disabled={saving} className="ml-auto rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>
                {saving ? "Saving..." : "Capture Idea"}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading ideas...</div>
      ) : ideas.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <Sparkles className="h-10 w-10 mx-auto mb-4" style={{ color: "#D4AF37" }} />
          <p className="text-lg font-bold" style={{ color: "#0F2744" }}>Your ideation pad is empty</p>
          <p className="text-sm text-gray-500 mt-1">Capture your first idea and let Nuru help you develop it.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active ideas */}
          {grouped.active.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Active ({grouped.active.length})</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.active.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onSelect={() => setSelectedIdea(idea)}
                    onStatusChange={updateStatus}
                    onDelete={deleteIdea}
                    onAskNuru={askNuru}
                    nuruLoading={nuruLoading === idea.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Parked */}
          {grouped.parked.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Parked ({grouped.parked.length})</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.parked.map(idea => (
                  <IdeaCard key={idea.id} idea={idea} onSelect={() => setSelectedIdea(idea)} onStatusChange={updateStatus} onDelete={deleteIdea} onAskNuru={askNuru} nuruLoading={nuruLoading === idea.id} />
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {grouped.done.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Done ({grouped.done.length})</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.done.map(idea => (
                  <IdeaCard key={idea.id} idea={idea} onSelect={() => setSelectedIdea(idea)} onStatusChange={updateStatus} onDelete={deleteIdea} onAskNuru={askNuru} nuruLoading={nuruLoading === idea.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedIdea(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "#0F2744" }}>{selectedIdea.title}</h2>
              <button onClick={() => setSelectedIdea(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedIdea.content}</p>
            {selectedIdea.nuruNotes && (
              <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(212,175,55,0.08)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
                  <p className="text-xs font-semibold" style={{ color: "#D4AF37" }}>Nuru&apos;s Take</p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedIdea.nuruNotes}</p>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <select
                value={selectedIdea.status}
                onChange={e => { updateStatus(selectedIdea.id, e.target.value); setSelectedIdea({ ...selectedIdea, status: e.target.value }); }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              <span className="text-[10px] text-gray-400">{selectedIdea.category}</span>
              <span className="text-[10px] text-gray-400">{selectedIdea.priority}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onSelect, onStatusChange, onDelete, onAskNuru, nuruLoading }: {
  idea: Idea;
  onSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onAskNuru: (idea: Idea) => void;
  nuruLoading: boolean;
}) {
  const sc = STATUS_COLORS[idea.status] ?? STATUS_COLORS.CAPTURED;

  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm cursor-pointer transition hover:shadow-md"
      style={{ border: "1px solid #E8EBF0" }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold leading-tight" style={{ color: "#0F2744" }}>{idea.title}</h3>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: sc.bg, color: sc.color }}>
          {idea.status.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{idea.content}</p>
      {idea.nuruNotes && (
        <div className="mt-2 rounded-lg p-2" style={{ background: "rgba(212,175,55,0.06)" }}>
          <p className="text-[10px] text-gray-600 line-clamp-2">{idea.nuruNotes}</p>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {idea.category && <span className="text-[9px] font-medium text-gray-400">{idea.category}</span>}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onAskNuru(idea)}
            disabled={nuruLoading}
            className="rounded-lg p-1.5 transition hover:bg-gray-100"
            title="Ask Nuru"
          >
            {nuruLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" /> : <Sparkles className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />}
          </button>
          <button onClick={() => onDelete(idea.id)} className="rounded-lg p-1.5 transition hover:bg-red-50" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-gray-300 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
