"use client";

import { useState } from "react";
import { Plus, X, CheckCircle2, AlertCircle, ChevronDown, User, Star, Shield } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  consultantProfile: {
    tier: string;
    availabilityStatus: string;
    totalProjects: number;
    averageRating: number | null;
  } | null;
};

const ROLES = [
  { value: "CONSULTANT", label: "Consultant" },
  { value: "ENGAGEMENT_MANAGER", label: "Engagement Manager" },
  { value: "DIRECTOR", label: "Director" },
  { value: "PARTNER", label: "Partner" },
  { value: "ADMIN", label: "Admin" },
];

const ROLE_COLORS: Record<string, string> = {
  CONSULTANT: "#374151",
  ENGAGEMENT_MANAGER: "#0F2744",
  DIRECTOR: "#7C3AED",
  PARTNER: "#D97706",
  ADMIN: "#DC2626",
};

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

export default function AdminUsersManager({ users: initialUsers, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "CONSULTANT" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  function setField(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError(await res.text().catch(() => "Failed to invite user."));
        return;
      }
      const data = await res.json();
      setUsers((prev) => [data.user, ...prev]);
      setSuccess(`${form.name} invited successfully. Temporary password: ${data.tempPassword}`);
      setForm({ name: "", email: "", role: "CONSULTANT" });
      setShowInvite(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(userId: string, newRole: string) {
    setChangingRole(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) return;
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      // silent fail
    } finally {
      setChangingRole(null);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch = search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = ROLES.reduce((acc, r) => {
    acc[r.value] = users.filter((u) => u.role === r.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl space-y-5">
        {success && (
          <div className="flex items-start gap-2 p-4 rounded-xl text-sm text-emerald-700 break-all" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {ROLES.map((r) => (
            <div
              key={r.value}
              className="rounded-xl bg-white p-3 text-center cursor-pointer hover:shadow-sm transition-shadow"
              style={{ border: `1px solid ${roleFilter === r.value ? "#0F2744" : "#e5eaf0"}` }}
              onClick={() => setRoleFilter(roleFilter === r.value ? "ALL" : r.value)}
            >
              <div className="text-xl font-extrabold" style={{ color: ROLE_COLORS[r.value] }}>{counts[r.value]}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{r.label.split(" ")[0]}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
            style={inputStyle}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none"
            style={inputStyle}
          >
            <option value="ALL">All roles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            onClick={() => { setShowInvite(true); setError(""); setSuccess(""); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
            style={{ background: "#0F2744" }}
          >
            <Plus size={13} /> Invite User
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <form
            onSubmit={invite}
            className="rounded-xl bg-white p-5 space-y-4"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Invite New User</h3>
              <button type="button" onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs text-red-600" style={{ background: "#FEF2F2" }}>
                <AlertCircle size={11} />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Full Name</label>
                <input value={form.name} onChange={(e) => setField("name", e.target.value)}
                  placeholder="Dr. Amina Okafor" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email Address</label>
                <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)}
                  placeholder="amina@example.com" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Role</label>
                <select value={form.role} onChange={(e) => setField("role", e.target.value)}
                  className={inputClass} style={inputStyle}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              A welcome email with a temporary password will be sent automatically.
            </p>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                {loading ? "Inviting..." : "Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600"
                style={{ background: "#F3F4F6" }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* User list */}
        <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid #e5eaf0", background: "#F9FAFB" }}>
            <span className="text-xs font-medium text-gray-500">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No users found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ background: ROLE_COLORS[u.role] ?? "#374151" }}
                  >
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{u.name}</span>
                      {u.id === currentUserId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">You</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>

                  {/* Consultant profile snippet */}
                  {u.consultantProfile && (
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                      <span>{u.consultantProfile.tier}</span>
                      {u.consultantProfile.averageRating && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-amber-400" />
                          {u.consultantProfile.averageRating.toFixed(1)}
                        </span>
                      )}
                      <span>{u.consultantProfile.totalProjects} projects</span>
                    </div>
                  )}

                  {/* Role selector */}
                  <div className="relative shrink-0">
                    <select
                      value={u.role}
                      disabled={u.id === currentUserId || changingRole === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="appearance-none pl-2 pr-6 py-1 rounded-lg text-xs font-medium border focus:outline-none disabled:opacity-60 disabled:cursor-default"
                      style={{
                        borderColor: "#e5eaf0",
                        color: ROLE_COLORS[u.role] ?? "#374151",
                        background: "#F9FAFB",
                      }}
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
