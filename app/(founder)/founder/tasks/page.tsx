"use client";

import { useState, useEffect } from "react";
import { Plus, Clock, CheckSquare, X, Loader2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  category: string;
  status: string;
  week?: number | null;
  estimatedMinutes?: number | null;
  completedAt?: string | null;
  createdAt: string;
}

const PRIORITIES = ["critical", "high", "medium", "low"];
const CATEGORIES = ["platform", "sales", "operations", "hiring", "strategy", "general"];

function priorityStyle(p: string): { bg: string; color: string } {
  switch (p.toLowerCase()) {
    case "critical": return { bg: "#FEF2F2", color: "#B91C1C" };
    case "high":     return { bg: "#FFF7ED", color: "#C2410C" };
    case "medium":   return { bg: "#FFFBEB", color: "#B45309" };
    default:         return { bg: "#F0FDF4", color: "#15803D" };
  }
}

const FILTER_TABS = ["All", "This Week", "Critical", "Completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // New task form state
  const [newTitle, setNewTitle]       = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("general");
  const [newMinutes, setNewMinutes]   = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === "pending") body.completedAt = null;
      await fetch(`/api/founder/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // Revert
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  }

  async function addTask() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/founder/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: newPriority,
          category: newCategory,
          estimatedMinutes: newMinutes ? parseInt(newMinutes) : null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setNewTitle("");
        setNewPriority("medium");
        setNewCategory("general");
        setNewMinutes("");
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  // Filter
  const filtered = tasks.filter((t) => {
    if (filter === "Completed") return t.status === "completed";
    if (filter === "Critical")  return t.priority === "critical" && t.status !== "completed";
    if (filter === "This Week") return t.week === 5 && t.status !== "completed";
    return t.status !== "completed";
  });

  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Group by priority
  const byPriority = PRIORITIES.map((p) => ({
    priority: p,
    tasks: filtered.filter((t) => t.priority === p && t.status !== "completed"),
  })).filter((g) => g.tasks.length > 0);

  return (
    <div className="p-6 max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Execution Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tasks.filter((t) => t.status !== "completed").length} tasks remaining
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium transition-opacity hover:opacity-80"
          style={{ background: "#0F2744", color: "#fff" }}
        >
          <Plus size={14} />
          Add Task
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">New Task</p>
            <button onClick={() => setShowForm(false)}>
              <X size={14} className="text-gray-400" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="w-full text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
              style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p} className="capitalize">{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Est. minutes</label>
                <input
                  type="number"
                  placeholder="30"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                />
              </div>
            </div>
            <button
              onClick={addTask}
              disabled={!newTitle.trim() || saving}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? "Adding..." : "Add Task"}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={
              filter === tab
                ? { background: "#0F2744", color: "#fff" }
                : { background: "#F3F4F6", color: "#374151" }
            }
          >
            {tab}
            {tab === "Completed" && completedTasks.length > 0 && (
              <span className="ml-1 opacity-60">({completedTasks.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      )}

      {/* Task groups */}
      {!loading && filter !== "Completed" && (
        <div className="space-y-5">
          {byPriority.length === 0 && (
            <div className="text-center py-16">
              <CheckSquare size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No tasks in this view.</p>
            </div>
          )}
          {byPriority.map(({ priority, tasks: group }) => {
            const ps = priorityStyle(priority);
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                    style={{ background: ps.bg, color: ps.color }}
                  >
                    {priority}
                  </span>
                  <span className="text-xs text-gray-400">{group.length} task{group.length !== 1 ? "s" : ""}</span>
                </div>
                <div
                  className="bg-white rounded-xl divide-y"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  {group.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() => toggleTask(task)}
                        className="mt-0.5 w-4 h-4 rounded accent-[#D4AF37] cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                            style={{ background: "#F3F4F6", color: "#6B7280" }}
                          >
                            {task.category}
                          </span>
                          {task.estimatedMinutes && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock size={9} />
                              {task.estimatedMinutes}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed section */}
      {!loading && filter === "Completed" && (
        <div>
          {completedTasks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-400">No completed tasks yet. Keep going.</p>
            </div>
          ) : (
            <div
              className="bg-white rounded-xl divide-y"
              style={{ border: "1px solid #e5eaf0" }}
            >
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleTask(task)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#D4AF37] cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 line-through">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                        style={{ background: "#F3F4F6", color: "#9CA3AF" }}
                      >
                        {task.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-300 shrink-0">Done</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
