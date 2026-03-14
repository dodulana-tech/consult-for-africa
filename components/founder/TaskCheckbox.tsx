"use client";

import { useState } from "react";

interface TaskCheckboxProps {
  taskId: string;
  initialStatus: string;
  title: string;
}

export default function TaskCheckbox({ taskId, initialStatus, title }: TaskCheckboxProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const isCompleted = status === "completed";

  async function handleToggle() {
    if (loading) return;
    const newStatus = isCompleted ? "pending" : "completed";
    // Optimistic update
    setStatus(newStatus);
    setLoading(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === "pending") body.completedAt = null;
      await fetch(`/api/founder/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // Revert on error
      setStatus(isCompleted ? "completed" : "pending");
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleToggle}
        disabled={loading}
        className="mt-0.5 w-4 h-4 rounded accent-[#D4AF37] cursor-pointer shrink-0"
      />
      <span
        className={`text-sm leading-snug transition-all ${
          isCompleted ? "line-through text-gray-400" : "text-gray-700"
        }`}
      >
        {title}
      </span>
    </label>
  );
}
