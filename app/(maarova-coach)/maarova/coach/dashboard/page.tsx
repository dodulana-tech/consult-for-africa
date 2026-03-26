"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Client {
  matchId: string;
  status: string;
  programme: string;
  sessionsCompleted: number;
  sessionsScheduled: number;
  startDate: string | null;
  user: { id: string; name: string; title: string | null; department: string | null; organisation: string };
  nextSession: string | null;
  goalCount: number;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  PENDING_MATCH: { label: "Chemistry call pending", bg: "bg-amber-50", text: "text-amber-700" },
  MATCHED: { label: "Ready to start", bg: "bg-blue-50", text: "text-blue-700" },
  ACTIVE: { label: "Active", bg: "bg-green-50", text: "text-green-700" },
};

export default function CoachDashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadClients() {
    setLoading(true);
    setError(null);
    fetch("/api/maarova/coach/clients")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((data) => setClients(data.clients ?? []))
      .catch(() => setError("Could not load clients. Please try refreshing."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Clients</h1>
        <p className="text-gray-500 text-sm mt-1">Active coaching engagements</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={loadClients} className="text-sm font-medium text-red-700 hover:text-red-900 ml-3 whitespace-nowrap">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 text-center">
          <p className="text-gray-500">No active clients at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clients.map((c) => {
            const statusCfg = STATUS_LABELS[c.status] ?? STATUS_LABELS.ACTIVE;
            const progressPct = c.sessionsScheduled > 0
              ? Math.round((c.sessionsCompleted / c.sessionsScheduled) * 100) : 0;

            return (
              <Link
                key={c.matchId}
                href={`/maarova/coach/clients/${c.matchId}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold group-hover:underline" style={{ color: "#0F2744" }}>{c.user.name}</h3>
                    <p className="text-xs text-gray-400">{c.user.title ?? c.user.organisation}</p>
                    {c.user.department && <p className="text-[11px] text-gray-300">{c.user.department}</p>}
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Session progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Sessions</span>
                    <span>{c.sessionsCompleted}/{c.sessionsScheduled}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: "#D4A574" }} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>{c.goalCount} goals</span>
                  <span>{c.programme.replace(/_/g, " ")}</span>
                  {c.nextSession && (
                    <span>
                      Next: {new Date(c.nextSession).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
