"use client";

import { useState, useEffect } from "react";

interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  department: string | null;
  managerId: string | null;
  managerName: string | null;
  isPortalEnabled: boolean;
  lastLoginAt: string | null;
  assessmentStatus: string;
  coachingStatus: string | null;
  goalCount: number;
  goalsCompleted: number;
  avgGoalProgress: number;
}

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  USER: { label: "User", bg: "bg-gray-100", text: "text-gray-700" },
  MANAGER: { label: "Manager", bg: "bg-blue-50", text: "text-blue-700" },
  HR_ADMIN: { label: "HR Admin", bg: "bg-purple-50", text: "text-purple-700" },
};

const ASSESSMENT_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  NOT_STARTED: { label: "Not started", bg: "bg-gray-100", text: "text-gray-600" },
  IN_PROGRESS: { label: "In progress", bg: "bg-blue-50", text: "text-blue-700" },
  COMPLETED: { label: "Completed", bg: "bg-green-50", text: "text-green-700" },
  EXPIRED: { label: "Expired", bg: "bg-red-50", text: "text-red-700" },
};

export default function OrgUsersClient() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/maarova/org/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setError("Could not load users"))
      .finally(() => setLoading(false));
  }, []);

  const managers = users.filter((u) => u.role === "MANAGER" || u.role === "HR_ADMIN");

  async function handleUpdate(userId: string, updates: { role?: string; managerId?: string | null }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/maarova/org/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      // Refresh
      const refreshRes = await fetch("/api/maarova/org/users");
      const refreshData = await refreshRes.json();
      setUsers(refreshData.users ?? []);
      setEditingId(null);
      setSuccess("Updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-4">&times;</button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Assessment</th>
              <th className="px-4 py-3">Goals</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const roleCfg = ROLE_LABELS[user.role] ?? ROLE_LABELS.USER;
              const assessmentCfg = ASSESSMENT_LABELS[user.assessmentStatus] ?? ASSESSMENT_LABELS.NOT_STARTED;
              const isEditing = editingId === user.id;

              return (
                <tr key={user.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{user.name}</p>
                      <p className="text-xs text-gray-400">{user.title ?? user.email}</p>
                      {user.department && <p className="text-[10px] text-gray-300">{user.department}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        defaultValue={user.role}
                        onChange={(e) => handleUpdate(user.id, { role: e.target.value })}
                        disabled={saving}
                        className="text-xs border rounded px-2 py-1"
                        style={{ borderColor: "#e5eaf0" }}
                      >
                        <option value="USER">User</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HR_ADMIN">HR Admin</option>
                      </select>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.text}`}>
                        {roleCfg.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        defaultValue={user.managerId ?? ""}
                        onChange={(e) => handleUpdate(user.id, { managerId: e.target.value || null })}
                        disabled={saving}
                        className="text-xs border rounded px-2 py-1"
                        style={{ borderColor: "#e5eaf0" }}
                      >
                        <option value="">No manager</option>
                        {managers
                          .filter((m) => m.id !== user.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {user.managerName ?? <span className="text-gray-300">None</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${assessmentCfg.bg} ${assessmentCfg.text}`}>
                      {assessmentCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.goalCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${user.avgGoalProgress}%`, background: "#D4A574" }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {user.goalsCompleted}/{user.goalCount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300">No goals</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingId(isEditing ? null : user.id)}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">No users in this organisation.</p>
        )}
      </div>
    </div>
  );
}
