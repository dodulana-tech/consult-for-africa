"use client";

import { useState, useTransition } from "react";

const STATUSES = [
  { value: "MATCHED", label: "Matched", bg: "rgba(107,114,128,0.08)", color: "#6B7280" },
  { value: "CONTACTED", label: "Contacted", bg: "rgba(59,130,246,0.08)", color: "#2563EB" },
  { value: "INTERESTED", label: "Interested", bg: "rgba(16,185,129,0.08)", color: "#059669" },
  { value: "INTERVIEWING", label: "Interviewing", bg: "rgba(245,158,11,0.08)", color: "#D97706" },
  { value: "OFFERED", label: "Offered", bg: "rgba(16,185,129,0.08)", color: "#059669" },
  { value: "PLACED", label: "Placed", bg: "rgba(99,102,241,0.08)", color: "#4F46E5" },
  { value: "DECLINED", label: "Declined", bg: "rgba(239,68,68,0.08)", color: "#DC2626" },
  { value: "WITHDRAWN", label: "Withdrawn", bg: "rgba(107,114,128,0.08)", color: "#6B7280" },
];

export default function ApplicantActions({
  mandateId,
  matchId,
  currentStatus,
}: {
  mandateId: string;
  matchId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/cadre/employer/applications/${mandateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId, status: newStatus }),
        });
        if (res.ok) {
          setStatus(newStatus);
        }
      } catch {
        // Silent fail - keep current status
      }
    });
  };

  const current = STATUSES.find((s) => s.value === status) || STATUSES[0];

  return (
    <div className="relative">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isPending}
        className="appearance-none rounded-lg px-3 py-1.5 pr-7 text-[11px] font-semibold cursor-pointer transition disabled:opacity-50"
        style={{
          background: current.bg,
          color: current.color,
          border: "1px solid transparent",
        }}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none"
        style={{ color: current.color }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
