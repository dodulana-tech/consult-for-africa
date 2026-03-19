"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  CheckCircle,
  AlertCircle,
  Mail,
  Pencil,
  X,
  Save,
  ShieldOff,
  ShieldCheck,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────────── */

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

interface BulkRow {
  name: string;
  email: string;
  title?: string;
  department?: string;
  clinicalBackground?: string;
  yearsInHealthcare?: number;
}

function parseCsv(text: string): BulkRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const nameIdx = headers.findIndex((h) => h === "name" || h === "fullname");
  const emailIdx = headers.findIndex((h) => h === "email" || h === "emailaddress");
  const titleIdx = headers.findIndex((h) => h === "title" || h === "jobtitle");
  const deptIdx = headers.findIndex((h) => h === "department" || h === "dept");
  const clinIdx = headers.findIndex((h) => h === "clinicalbackground" || h === "clinical");
  const yearsIdx = headers.findIndex((h) => h === "yearsinhealthcare" || h === "years");

  if (nameIdx === -1 || emailIdx === -1) return [];

  const rows: BulkRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx];
    const email = cols[emailIdx];
    if (!name || !email) continue;

    rows.push({
      name,
      email,
      title: titleIdx >= 0 ? cols[titleIdx] || undefined : undefined,
      department: deptIdx >= 0 ? cols[deptIdx] || undefined : undefined,
      clinicalBackground: clinIdx >= 0 ? cols[clinIdx] || undefined : undefined,
      yearsInHealthcare: yearsIdx >= 0 && cols[yearsIdx] ? parseInt(cols[yearsIdx], 10) || undefined : undefined,
    });
  }
  return rows;
}

const ORG_TYPES = [
  { value: "private_hospital", label: "Private Hospital" },
  { value: "hospital_group", label: "Hospital Group" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
];

const STREAMS = [
  { value: "RECRUITMENT", label: "Recruitment" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "INTELLIGENCE", label: "Intelligence" },
];

/* ── Main Component ───────────────────────────────────────────────────────────── */

export default function MaarovaOrgDetail({ org, users }: Props) {
  const router = useRouter();

  // Global feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Org editing
  const [editingOrg, setEditingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: org.name,
    type: org.type,
    country: org.country,
    city: org.city ?? "",
    contactName: org.contactName,
    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone ?? "",
    stream: org.stream,
    maxAssessments: String(org.maxAssessments),
    notes: org.notes ?? "",
    isActive: org.isActive,
  });
  const [savingOrg, setSavingOrg] = useState(false);

  // Add user
  const [showAddUser, setShowAddUser] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    title: "",
    department: "",
    clinicalBackground: "",
    yearsInHealthcare: "",
  });

  // Edit user
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    title: "",
    department: "",
    clinicalBackground: "",
    yearsInHealthcare: "",
  });
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Portal actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Bulk upload
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkErrors, setBulkErrors] = useState<{ row: number; error: string }[]>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  function clearFeedback() {
    setError(null);
    setSuccess(null);
  }

  /* ── Org CRUD ─────────────────────────────────────────────────────────────── */

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    setSavingOrg(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/organisations/${org.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgForm.name.trim(),
          type: orgForm.type,
          country: orgForm.country.trim() || "Nigeria",
          city: orgForm.city.trim() || null,
          contactName: orgForm.contactName.trim(),
          contactEmail: orgForm.contactEmail.trim(),
          contactPhone: orgForm.contactPhone.trim() || null,
          stream: orgForm.stream,
          maxAssessments: parseInt(orgForm.maxAssessments, 10) || 1,
          notes: orgForm.notes.trim() || null,
          isActive: orgForm.isActive,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update organisation");
      }

      setSuccess("Organisation updated.");
      setEditingOrg(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingOrg(false);
    }
  }

  async function handleToggleActive() {
    setActionLoading("toggle-org");
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/organisations/${org.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !org.isActive }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update status");
      }

      setSuccess(`Organisation ${org.isActive ? "deactivated" : "activated"}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  /* ── Add User ─────────────────────────────────────────────────────────────── */

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSavingUser(true);
    clearFeedback();

    try {
      const res = await fetch("/api/maarova/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: org.id,
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          title: userForm.title.trim() || undefined,
          department: userForm.department.trim() || undefined,
          clinicalBackground: userForm.clinicalBackground.trim() || undefined,
          yearsInHealthcare: userForm.yearsInHealthcare
            ? parseInt(userForm.yearsInHealthcare, 10)
            : undefined,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create user");
      }

      setSuccess(`User ${userForm.name} created and invite sent.`);
      setUserForm({ name: "", email: "", title: "", department: "", clinicalBackground: "", yearsInHealthcare: "" });
      setShowAddUser(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingUser(false);
    }
  }

  /* ── Edit User ────────────────────────────────────────────────────────────── */

  function startEditUser(u: OrgUser) {
    setEditingUserId(u.id);
    setEditUserForm({
      name: u.name,
      email: u.email,
      title: u.title ?? "",
      department: u.department ?? "",
      clinicalBackground: "",
      yearsInHealthcare: "",
    });
    clearFeedback();
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId) return;
    setSavingEditUser(true);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/users/${editingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUserForm.name.trim(),
          email: editUserForm.email.trim(),
          title: editUserForm.title.trim() || null,
          department: editUserForm.department.trim() || null,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update user");
      }

      setSuccess("User updated.");
      setEditingUserId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingEditUser(false);
    }
  }

  /* ── Portal Enable / Disable / Resend ─────────────────────────────────────── */

  async function handleEnablePortal(userId: string) {
    setActionLoading(`enable-${userId}`);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/users/${userId}/enable`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text() || "Failed to enable portal");

      setSuccess("Portal enabled and invite sent.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisablePortal(userId: string) {
    setActionLoading(`disable-${userId}`);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/users/${userId}/disable`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text() || "Failed to disable portal");

      setSuccess("Portal access disabled.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResendInvite(userId: string) {
    setActionLoading(`resend-${userId}`);
    clearFeedback();

    try {
      const res = await fetch(`/api/maarova/admin/users/${userId}/enable`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text() || "Failed to resend invite");

      setSuccess("Invite resent with new credentials.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  /* ── Bulk Upload ───────────────────────────────────────────────────────── */

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    clearFeedback();
    setBulkErrors([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setBulkRows(rows);
      if (rows.length === 0) {
        setError("No valid rows found in CSV. Ensure headers: name, email");
      }
    };
    reader.readAsText(file);
    // Reset input so re-selecting same file works
    e.target.value = "";
  }

  function removeBulkRow(idx: number) {
    setBulkRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleBulkSubmit() {
    if (bulkRows.length === 0) return;
    setUploadingBulk(true);
    clearFeedback();
    setBulkErrors([]);

    try {
      const res = await fetch("/api/maarova/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: org.id,
          users: bulkRows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setBulkErrors(data.errors);
          setError(`${data.errors.length} row(s) have errors. Fix and retry.`);
        } else {
          throw new Error(data.error || "Bulk upload failed");
        }
        return;
      }

      setSuccess(`${data.created} user(s) created and invites sent.`);
      setBulkRows([]);
      setShowBulkUpload(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploadingBulk(false);
    }
  }

  function downloadTemplate() {
    const header = "name,email,title,department,clinicalBackground,yearsInHealthcare";
    const example = "Dr. Jane Doe,jane.doe@hospital.com,Medical Director,Surgery,MBBS FWACS,15";
    const csv = `${header}\n${example}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maarova-users-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Render ───────────────────────────────────────────────────────────────── */

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Global Feedback */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
        >
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{ background: "#D1FAE5", color: "#065F46" }}
        >
          <CheckCircle size={16} />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Organisation Details Card ──────────────────────────────────────── */}
      <div
        className="rounded-xl"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #e5eaf0" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
            Organisation Details
          </h2>
          <div className="flex items-center gap-2">
            {!editingOrg && (
              <>
                <button
                  onClick={() => setEditingOrg(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
                  style={{ color: "#0F2744" }}
                >
                  <Pencil size={13} />
                  Edit
                </button>
                <button
                  onClick={handleToggleActive}
                  disabled={actionLoading === "toggle-org"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: org.isActive ? "#FEE2E2" : "#D1FAE5",
                    color: org.isActive ? "#991B1B" : "#065F46",
                  }}
                >
                  {org.isActive ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                  {actionLoading === "toggle-org"
                    ? "Saving..."
                    : org.isActive
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </>
            )}
          </div>
        </div>

        {editingOrg ? (
          <form onSubmit={handleSaveOrg} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormInput
                label="Organisation Name *"
                value={orgForm.name}
                onChange={(v) => setOrgForm({ ...orgForm, name: v })}
                required
              />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type *</label>
                <select
                  value={orgForm.type}
                  onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <FormInput
                label="Country"
                value={orgForm.country}
                onChange={(v) => setOrgForm({ ...orgForm, country: v })}
                placeholder="Nigeria"
              />
              <FormInput
                label="City"
                value={orgForm.city}
                onChange={(v) => setOrgForm({ ...orgForm, city: v })}
                placeholder="Lagos"
              />
              <FormInput
                label="Contact Name *"
                value={orgForm.contactName}
                onChange={(v) => setOrgForm({ ...orgForm, contactName: v })}
                required
              />
              <FormInput
                label="Contact Email *"
                value={orgForm.contactEmail}
                onChange={(v) => setOrgForm({ ...orgForm, contactEmail: v })}
                type="email"
                required
              />
              <FormInput
                label="Contact Phone"
                value={orgForm.contactPhone}
                onChange={(v) => setOrgForm({ ...orgForm, contactPhone: v })}
                placeholder="+234..."
              />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stream *</label>
                <select
                  value={orgForm.stream}
                  onChange={(e) => setOrgForm({ ...orgForm, stream: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
                >
                  {STREAMS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <FormInput
                label="Max Assessments"
                value={orgForm.maxAssessments}
                onChange={(v) => setOrgForm({ ...orgForm, maxAssessments: v })}
                type="number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                value={orgForm.notes}
                onChange={(e) => setOrgForm({ ...orgForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
                placeholder="Internal notes about this organisation..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={savingOrg}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "#D4AF37", color: "#06090f" }}
              >
                <Save size={14} />
                {savingOrg ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingOrg(false);
                  setOrgForm({
                    name: org.name,
                    type: org.type,
                    country: org.country,
                    city: org.city ?? "",
                    contactName: org.contactName,
                    contactEmail: org.contactEmail,
                    contactPhone: org.contactPhone ?? "",
                    stream: org.stream,
                    maxAssessments: String(org.maxAssessments),
                    notes: org.notes ?? "",
                    isActive: org.isActive,
                  });
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <InfoField label="Name" value={org.name} />
              <InfoField label="Type" value={ORG_TYPES.find((t) => t.value === org.type)?.label ?? org.type} />
              <InfoField label="Location" value={org.city ? `${org.city}, ${org.country}` : org.country} />
              <InfoField label="Stream" value={STREAMS.find((s) => s.value === org.stream)?.label ?? org.stream} />
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
        )}
      </div>

      {/* ── Users Section ──────────────────────────────────────────────────── */}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowBulkUpload(!showBulkUpload);
                setShowAddUser(false);
                clearFeedback();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: showBulkUpload ? "#F3F4F6" : "#fff", color: "#0F2744", border: "1px solid #e5eaf0" }}
            >
              <Upload size={13} />
              {showBulkUpload ? "Close" : "Bulk Upload"}
            </button>
            <button
              onClick={() => {
                setShowAddUser(!showAddUser);
                setShowBulkUpload(false);
                clearFeedback();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              <UserPlus size={14} />
              Add User
            </button>
          </div>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <form
            onSubmit={handleAddUser}
            className="px-5 py-4 space-y-4"
            style={{ background: "#F9FAFB", borderBottom: "1px solid #e5eaf0" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormInput label="Full Name *" value={userForm.name} onChange={(v) => setUserForm({ ...userForm, name: v })} required />
              <FormInput label="Email *" type="email" value={userForm.email} onChange={(v) => setUserForm({ ...userForm, email: v })} required />
              <FormInput label="Title" value={userForm.title} onChange={(v) => setUserForm({ ...userForm, title: v })} placeholder="e.g. Medical Director" />
              <FormInput label="Department" value={userForm.department} onChange={(v) => setUserForm({ ...userForm, department: v })} placeholder="e.g. Surgery" />
              <FormInput label="Clinical Background" value={userForm.clinicalBackground} onChange={(v) => setUserForm({ ...userForm, clinicalBackground: v })} placeholder="e.g. MBBS, FWACS" />
              <FormInput label="Years in Healthcare" type="number" value={userForm.yearsInHealthcare} onChange={(v) => setUserForm({ ...userForm, yearsInHealthcare: v })} placeholder="e.g. 15" />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={savingUser}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "#D4AF37", color: "#06090f" }}
              >
                {savingUser ? "Creating..." : "Create User and Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Bulk Upload */}
        {showBulkUpload && (
          <div
            className="px-5 py-4 space-y-4"
            style={{ background: "#F9FAFB", borderBottom: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                  Bulk Upload Users via CSV
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Required columns: <strong>name</strong>, <strong>email</strong>. Optional: title, department, clinicalBackground, yearsInHealthcare
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100"
                style={{ color: "#0F2744", border: "1px solid #e5eaf0" }}
              >
                <Download size={13} />
                Download Template
              </button>
            </div>

            {/* File picker */}
            {bulkRows.length === 0 && (
              <label
                className="flex flex-col items-center gap-2 rounded-lg px-4 py-6 text-center cursor-pointer transition-colors hover:bg-white"
                style={{ border: "2px dashed #d1d5db" }}
              >
                <FileSpreadsheet size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  <span className="font-semibold" style={{ color: "#0F2744" }}>Click to select CSV file</span>
                </span>
                <span className="text-[11px] text-gray-400">.csv files only</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFile}
                  className="hidden"
                />
              </label>
            )}

            {/* Preview table */}
            {bulkRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600">
                    {bulkRows.length} user(s) ready to upload
                  </p>
                  <button
                    onClick={() => { setBulkRows([]); setBulkErrors([]); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                {bulkErrors.length > 0 && (
                  <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "#FEE2E2" }}>
                    {bulkErrors.map((e, i) => (
                      <p key={i} style={{ color: "#991B1B" }}>
                        Row {e.row}: {e.error}
                      </p>
                    ))}
                  </div>
                )}

                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "#fff" }}>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">#</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">Name</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">Email</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">Title</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-500">Dept</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((r, i) => {
                          const rowError = bulkErrors.find((e) => e.row === i + 1);
                          return (
                            <tr
                              key={i}
                              style={{
                                borderBottom: "1px solid #F3F4F6",
                                background: rowError ? "#FEF2F2" : "#fff",
                              }}
                            >
                              <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                              <td className="px-3 py-2 text-gray-700">{r.name}</td>
                              <td className="px-3 py-2 text-gray-600">{r.email}</td>
                              <td className="px-3 py-2 text-gray-500">{r.title ?? "-"}</td>
                              <td className="px-3 py-2 text-gray-500">{r.department ?? "-"}</td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => removeBulkRow(i)}
                                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBulkSubmit}
                    disabled={uploadingBulk || bulkRows.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{ background: "#D4AF37", color: "#06090f" }}
                  >
                    <Upload size={14} />
                    {uploadingBulk ? `Creating ${bulkRows.length} users...` : `Upload ${bulkRows.length} User(s)`}
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
                    <FileSpreadsheet size={14} />
                    Replace CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Portal</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Login</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Assessment</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                editingUserId === u.id ? (
                  <tr key={u.id} style={{ background: "#FFFBEB", borderBottom: "1px solid #F3F4F6" }}>
                    <td colSpan={7} className="px-5 py-4">
                      <form onSubmit={handleSaveUser} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <FormInput label="Name *" value={editUserForm.name} onChange={(v) => setEditUserForm({ ...editUserForm, name: v })} required />
                          <FormInput label="Email *" type="email" value={editUserForm.email} onChange={(v) => setEditUserForm({ ...editUserForm, email: v })} required />
                          <FormInput label="Title" value={editUserForm.title} onChange={(v) => setEditUserForm({ ...editUserForm, title: v })} />
                          <FormInput label="Department" value={editUserForm.department} onChange={(v) => setEditUserForm({ ...editUserForm, department: v })} />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={savingEditUser}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                            style={{ background: "#D4AF37", color: "#06090f" }}
                          >
                            <Save size={12} />
                            {savingEditUser ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: "#0F2744" }}>{u.name}</td>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Edit */}
                        <button
                          onClick={() => startEditUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors hover:bg-gray-100"
                          style={{ color: "#0F2744" }}
                        >
                          <Pencil size={11} />
                          Edit
                        </button>

                        {/* Portal toggle */}
                        {u.isPortalEnabled ? (
                          <>
                            <button
                              onClick={() => handleDisablePortal(u.id)}
                              disabled={actionLoading === `disable-${u.id}`}
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                              style={{ background: "#FEE2E2", color: "#991B1B" }}
                            >
                              <ShieldOff size={11} />
                              {actionLoading === `disable-${u.id}` ? "..." : "Disable"}
                            </button>
                            <button
                              onClick={() => handleResendInvite(u.id)}
                              disabled={actionLoading === `resend-${u.id}`}
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                              style={{ background: "#EFF6FF", color: "#1E40AF" }}
                            >
                              <Mail size={11} />
                              {actionLoading === `resend-${u.id}` ? "..." : "Resend Invite"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEnablePortal(u.id)}
                            disabled={actionLoading === `enable-${u.id}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ background: "#D1FAE5", color: "#065F46" }}
                          >
                            <ShieldCheck size={11} />
                            {actionLoading === `enable-${u.id}` ? "..." : "Enable"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
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

/* ── Shared Helpers ───────────────────────────────────────────────────────────── */

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
