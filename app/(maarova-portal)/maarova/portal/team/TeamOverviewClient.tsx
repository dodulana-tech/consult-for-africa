"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Report {
  id: string;
  name: string;
  email: string;
  title: string | null;
  department: string | null;
  assessmentStatus: string;
  coachingStatus: string | null;
  goalCount: number;
  goalsCompleted: number;
  goalsValidated: number;
  avgGoalProgress: number;
}

const COACHING_LABELS: Record<string, string> = {
  PENDING_MATCH: "Chemistry call pending",
  MATCHED: "Ready to begin",
  ACTIVE: "In coaching",
};

export default function TeamOverviewClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/maarova/manager/reports")
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-gray-500">No direct reports assigned to you yet.</p>
        <p className="text-xs text-gray-400 mt-1">Your organisation's HR admin can assign reporting lines.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {reports.map((r) => (
        <Link
          key={r.id}
          href={`/maarova/portal/team/${r.id}`}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #0F2744, #1a3a5c)" }}
            >
              {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold group-hover:underline" style={{ color: "#0F2744" }}>{r.name}</h3>
              <p className="text-xs text-gray-400">{r.title ?? r.email}</p>
              {r.department && <p className="text-[10px] text-gray-300">{r.department}</p>}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {/* Goal progress */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Goals</span>
              <span className="text-gray-600 font-medium">{r.goalsCompleted}/{r.goalCount} completed</span>
            </div>
            {r.goalCount > 0 && (
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${r.avgGoalProgress}%`, background: "#D4A574" }}
                />
              </div>
            )}

            {/* Status badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {r.assessmentStatus === "COMPLETED" ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Assessment done</span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Assessment {r.assessmentStatus.toLowerCase().replace("_", " ")}</span>
              )}
              {r.coachingStatus && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {COACHING_LABELS[r.coachingStatus] ?? r.coachingStatus}
                </span>
              )}
              {r.goalsValidated > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  {r.goalsValidated} validated
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
