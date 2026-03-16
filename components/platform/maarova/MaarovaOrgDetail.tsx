"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle, AlertCircle, Mail } from "lucide-react";

interface Org {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  stream: string;
  maxAssessments: number;
  usedAssessments: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

interface OrgUser {
  id: string;
  name: string;
  email: string;
  title: string | null;
  department: string | null;
  isPortalEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  latestSessionStatus: string | null;
}

interface Props {
  org: Org;
  users: OrgUser[];
}

export default function MaarovaOrgDetail({ org, users }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabling, setEnabling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    department: "",
    clinicalBackground: "",
    yearsInHealthcare: "",
  });

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/maarova/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: org.id,
          name: form.name.trim(),
          email: form.email.trim(),
          title: form.title.trim() || undefined,
          department: form.department.trim() || undefined,
          clinicalBackground: form.clinicalBackground.trim() || undefined,
          yearsInHealthcare: form.yearsInHealthcare
            ? parseInt(form.yearsInHealthcare, 10)
            : undefined,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create user");
      }

      setSuccess(`User ${form.name} created and invite sent.`);
      setForm({ name: "", email: "", title: "", department: "", clinicalBackground: "", yearsInHealthcare: "" });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleEnablePortal(userId: string) {
    setEnabling(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/maarova/admin/users/${userId}/enable`, {
        method: "POST",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to enable portal");
      }

      setSuccess("Portal enabled and invite sent.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setEnabling(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Feedback */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{ background: "#D1FAE5", color: "#065F46" }}
        >
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Org Info Card */}
      <div
        className="rounded-xl p-6"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
          Organisation Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <InfoField label="Name" value={org.name} />
          <InfoField label="Type" value={org.type} />
          <InfoField label="Country" value={org.city ? `${org.city}, ${org.country}` : org.country} />
          <InfoField label="Stream" value={org.stream} />
          <InfoField label="Contact" value={`${org.contactName} (${org.contactEmail})`} />
          <InfoField label="Phone" value={org.contactPhone ?? "Not provided"} />
          <InfoField
            label="Assessments"
            value={`${org.usedAssessments} used of ${org.maxAssessments}`}
          />
          <InfoField label="Status" value={org.isActive ? "Active" : "Inactive"} />
          <InfoField
            label="Created"
            value={new Date(org.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
        </div>
        {org.notes && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5eaf0" }}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{org.notes}</p>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #e5eaf0" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
            Users ({users.length})
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            <UserPlus size={14} />
            Add User
          </button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <form
            onSubmit={handleAddUser}
            className="px-5 py-4 space-y-4"
            style={{ background: "#F9FAFB", borderBottom: "1px solid #e5eaf0" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormInput
                label="Full Name *"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
              />
              <FormInput
                label="Email *"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
              />
              <FormInput
                label="Title"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
                placeholder="e.g. Medical Director"
              />
              <FormInput
                label="Department"
                value={form.department}
                onChange={(v) => setForm({ ...form, department: v })}
                placeholder="e.g. Surgery"
              />
              <FormInput
                label="Clinical Background"
                value={form.clinicalBackground}
                onChange={(v) => setForm({ ...form, clinicalBackground: v })}
                placeholder="e.g. MBBS, FWACS"
              />
              <FormInput
                label="Years in Healthcare"
                type="number"
                value={form.yearsInHealthcare}
                onChange={(v) => setForm({ ...form, yearsInHealthcare: v })}
                placeholder="e.g. 15"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "#D4AF37", color: "#06090f" }}
              >
                {saving ? "Creating..." : "Create User and Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Portal
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Last Login
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Assessment
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: "#0F2744" }}>
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3 text-gray-600">{u.title ?? "-"}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        background: u.isPortalEnabled ? "#D1FAE5" : "#FEE2E2",
                        color: u.isPortalEnabled ? "#065F46" : "#991B1B",
                      }}
                    >
                      {u.isPortalEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    <AssessmentBadge status={u.latestSessionStatus} />
                  </td>
                  <td className="px-5 py-3">
                    {!u.isPortalEnabled && (
                      <button
                        onClick={() => handleEnablePortal(u.id)}
                        disabled={enabling === u.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        style={{ background: "#EFF6FF", color: "#1E40AF" }}
                      >
                        <Mail size={12} />
                        {enabling === u.id ? "Sending..." : "Enable Portal"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No users yet. Click &quot;Add User&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────────── */

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-gray-700">{value}</p>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200"
        style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
      />
    </div>
  );
}

function AssessmentBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-xs text-gray-400">No assessment</span>;
  }

  const styles: Record<string, { bg: string; color: string; label: string }> = {
    NOT_STARTED: { bg: "#F3F4F6", color: "#6B7280", label: "Not Started" },
    IN_PROGRESS: { bg: "#FEF3C7", color: "#92400E", label: "In Progress" },
    COMPLETED: { bg: "#D1FAE5", color: "#065F46", label: "Completed" },
    EXPIRED: { bg: "#FEE2E2", color: "#991B1B", label: "Expired" },
  };

  const s = styles[status] ?? { bg: "#F3F4F6", color: "#6B7280", label: status };

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
