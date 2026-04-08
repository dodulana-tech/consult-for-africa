"use client";
import { useState } from "react";

export default function JobAlertForm({ cadre, state }: { cadre: string; state?: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    await fetch("/api/cadre/job-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, cadre, state: state || undefined }),
    });
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="text-xs text-emerald-600 font-medium py-1">You will be notified when new roles are posted.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email" required placeholder="Your email" value={email}
        onChange={e => setEmail(e.target.value)}
        className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
        style={{ border: "1px solid #E8EBF0", background: "#F8F9FB" }}
      />
      <button type="submit" disabled={status === "loading"}
        className="rounded-lg px-3 py-2 text-xs font-semibold text-white shrink-0 disabled:opacity-50"
        style={{ background: "#0B3C5D" }}>
        {status === "loading" ? "..." : "Notify Me"}
      </button>
    </form>
  );
}
