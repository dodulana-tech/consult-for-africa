"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  totalUsers: number;
  portalEnabled: number;
  assessment: { completed: number; inProgress: number; notStarted: number };
  coaching: { active: number; matched: number; completed: number };
  goals: { total: number; completed: number; avgProgress: number };
}

export default function OrgDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/maarova/org/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-16">Could not load dashboard data.</p>;
  }

  const stats = [
    { label: "Total Users", value: data.totalUsers, sub: `${data.portalEnabled} portal enabled` },
    { label: "Assessments Completed", value: data.assessment.completed, sub: `${data.assessment.inProgress} in progress` },
    { label: "Active Coaching", value: data.coaching.active, sub: `${data.coaching.matched} matched, ${data.coaching.completed} completed` },
    { label: "Development Goals", value: data.goals.total, sub: `${data.goals.completed} completed, ${data.goals.avgProgress}% avg progress` },
  ];

  const assessmentTotal = data.assessment.completed + data.assessment.inProgress + data.assessment.notStarted;
  const assessmentPct = assessmentTotal > 0 ? Math.round((data.assessment.completed / assessmentTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#0F2744" }}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Assessment funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>Assessment Completion</h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${assessmentPct}%`, background: "#D4A574" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>{assessmentPct}%</span>
        </div>
        <div className="flex gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#D4A574" }} />
            Completed ({data.assessment.completed})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            In Progress ({data.assessment.inProgress})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            Not Started ({data.assessment.notStarted})
          </span>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/maarova/portal/org/users"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
        >
          <h3 className="text-sm font-semibold group-hover:underline" style={{ color: "#0F2744" }}>Manage People</h3>
          <p className="text-xs text-gray-500 mt-1">View users, assign managers, set roles</p>
        </Link>
        <Link
          href="/maarova/portal/org/goals"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
        >
          <h3 className="text-sm font-semibold group-hover:underline" style={{ color: "#0F2744" }}>Organisation Goals</h3>
          <p className="text-xs text-gray-500 mt-1">View and assign development goals across your team</p>
        </Link>
      </div>
    </div>
  );
}
