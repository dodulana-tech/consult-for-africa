"use client";

import { useState, useEffect } from "react";
import { Plus, X, Sparkles, Loader2, CheckCircle2, Circle, Clock, Trash2, Calendar } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  category: string;
  status: string;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  impact?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

interface NuruTask {
  title: string;
  description: string;
  priority: string;
  category: string;
  estimatedMinutes: number;
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  critical: { bg: "#FEF2F2", color: "#B91C1C" },
  high: { bg: "#FFF7ED", color: "#C2410C" },
  medium: { bg: "#FFFBEB", color: "#B45309" },
  low: { bg: "#F0FDF4", color: "#15803D" },
};

const CATEGORIES = ["revenue", "delivery", "cadrehealth", "agents", "operations", "strategy", "personal", "general"];

export default function ExecutionPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuruSuggesting, setNuruSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<NuruTask[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "general", dueDate: "", estimatedMinutes: "" });

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const res = await fetch("/api/founder/tasks");
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/founder/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null,
        dueDate: form.dueDate || null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks([task, ...tasks]);
      setForm({ title: "", description: "", priority: "medium", category: "general", dueDate: "", estimatedMinutes: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function addSuggestion(s: NuruTask) {
    const res = await fetch("/api/founder/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks([task, ...tasks]);
      setSuggestions(suggestions.filter(sg => sg.title !== s.title));
    }
  }

  async function toggleTask(id: string, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const res = await fetch(`/api/founder/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : null }),
    });
    if (res.ok) {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus, completedAt: newStatus === "completed" ? new Date().toISOString() : null } : t));
    }
  }

  async function deleteTask(id: string) {
    await fetch(`/api/founder/tasks/${id}`, { method: "DELETE" });
    setTasks(tasks.filter(t => t.id !== id));
  }

  async function askNuru() {
    setNuruSuggesting(true);
    try {
      const res = await fetch("/api/founder/tasks/nuru-suggest", { method: "POST" });
      if (res.ok) setSuggestions(await res.json());
    } finally {
      setNuruSuggesting(false);
    }
  }

  const filtered = tasks.filter(t => filter === "all" ? true : t.status === filter);
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  const overdue = tasks.filter(t => t.status === "pending" && t.dueDate && new Date(t.dueDate) < new Date());

  return (
    <div className="p-4 sm:p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>Execution</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pendingCount} pending, {completedCount} completed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={askNuru} disabled={nuruSuggesting}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#D4AF37]/10 disabled:opacity-50"
            style={{ color: "#D4AF37" }}>
            {nuruSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Nuru Suggest
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ background: "#0F2744" }}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Task"}
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700 font-medium" style={{ border: "1px solid rgba(220,38,38,0.2)" }}>
          {overdue.length} overdue task{overdue.length !== 1 ? "s" : ""}: {overdue.map(t => t.title).join(", ")}
        </div>
      )}

      {/* Nuru suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" style={{ color: "#D4AF37" }} />
            <p className="text-sm font-bold" style={{ color: "#D4AF37" }}>Nuru suggests for this week</p>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const ps = PRIORITY_STYLES[s.priority] ?? PRIORITY_STYLES.medium;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-3" style={{ border: "1px solid #E8EBF0" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize" style={{ background: ps.bg, color: ps.color }}>{s.priority}</span>
                      <span className="text-[10px] text-gray-400">{s.category}</span>
                      {s.estimatedMinutes && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.estimatedMinutes}m</span>}
                    </div>
                  </div>
                  <button onClick={() => addSuggestion(s)} className="shrink-0 rounded-lg bg-[#0F2744] px-3 py-1.5 text-xs font-semibold text-white">
                    Add
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={() => setSuggestions([])} className="mt-2 text-[10px] text-gray-400 hover:text-gray-600">Dismiss all</button>
        </div>
      )}

      {/* New task form */}
      {showForm && (
        <form onSubmit={createTask} className="rounded-2xl bg-white p-5 shadow-sm space-y-3" style={{ border: "1px solid #E8EBF0" }}>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="What needs to get done?"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Details, context, what done looks like (optional)"
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
          <div className="flex gap-2 flex-wrap">
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-xs">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-gray-200 px-3 py-2 text-xs">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs" />
            <input type="number" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: e.target.value })}
              placeholder="Minutes" className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-xs" />
            <button type="submit" disabled={saving} className="ml-auto rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>
              {saving ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1" style={{ width: "fit-content" }}>
        {(["pending", "completed", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition ${filter === f ? "bg-white shadow-sm" : "text-gray-500"}`}
            style={filter === f ? { color: "#0F2744" } : {}}>
            {f === "pending" ? `Pending (${pendingCount})` : f === "completed" ? `Done (${completedCount})` : "All"}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-sm text-gray-400">
            {filter === "pending" ? "No pending tasks. Click \"Nuru Suggest\" to get started." : "No tasks found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const ps = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium;
            const isDone = task.status === "completed";
            const isOverdue = !isDone && task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <div key={task.id}
                className={`flex items-start gap-3 rounded-xl bg-white p-4 transition ${isDone ? "opacity-60" : ""}`}
                style={{ border: isOverdue ? "1px solid rgba(220,38,38,0.3)" : "1px solid #E8EBF0" }}>
                <button onClick={() => toggleTask(task.id, task.status)} className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 hover:text-gray-500 transition" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>{task.title}</p>
                  {task.description && !isDone && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize" style={{ background: ps.bg, color: ps.color }}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-gray-400">{task.category}</span>
                    {task.dueDate && (
                      <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(task.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        {isOverdue && " (overdue)"}
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{task.estimatedMinutes}m</span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="shrink-0 rounded-lg p-1.5 transition hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5 text-gray-300 hover:text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
