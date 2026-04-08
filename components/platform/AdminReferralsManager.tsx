"use client";

import { useState } from "react";
import {
  Building2, UserPlus, Users, Clock,
  Pencil, Trash2, X, Loader2, Plus, AlertCircle,
  CheckCircle, Phone, XCircle, RotateCcw, Send,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

type ReferralStatus = "PENDING" | "CONTACTED" | "CONVERTED" | "REJECTED";
type ReferralType = "CLIENT" | "CONSULTANT" | "STAFF";

interface Referral {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  suggestedRole: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  referrer: { id: string; name: string; email: string; role: string } | null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#F3F4F6", color: "#6B7280", label: "Pending" },
  CONTACTED: { bg: "#EFF6FF", color: "#1D4ED8", label: "Contacted" },
  CONVERTED: { bg: "#D1FAE5", color: "#065F46", label: "Converted" },
  REJECTED:  { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  CLIENT: Building2,
  CONSULTANT: UserPlus,
  STAFF: Users,
};

const TYPE_LABELS: Record<string, string> = {
  CLIENT: "Client",
  CONSULTANT: "Consultant",
  STAFF: "Staff",
};

/* Status options kept for reference but actions now use explicit buttons */

const STAFF_ROLES = ["Engagement Manager", "Director", "Partner", "Other"];

interface FormState {
  type: ReferralType;
  name: string;
  email: string;
  phone: string;
  organisation: string;
  suggestedRole: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  type: "CONSULTANT",
  name: "",
  email: "",
  phone: "",
  organisation: "",
  suggestedRole: "",
  notes: "",
};

export default function AdminReferralsManager({
  referrals: initial,
  counts: initialCounts,
}: {
  referrals: Referral[];
  counts: { total: number; pending: number; contacted: number; converted: number };
}) {
  const [referrals, setReferrals] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertLevel, setConvertLevel] = useState("STANDARD");
  const [convertError, setConvertError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const counts = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === "PENDING").length,
    contacted: referrals.filter((r) => r.status === "CONTACTED").length,
    converted: referrals.filter((r) => r.status === "CONVERTED").length,
  };

  const filtered = filter === "all" ? referrals : referrals.filter((r) => r.status === filter.toUpperCase());

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalError("");
    setModalOpen(true);
  }

  function openEdit(r: Referral) {
    setEditingId(r.id);
    setForm({
      type: r.type as ReferralType,
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      organisation: r.organisation || "",
      suggestedRole: r.suggestedRole || "",
      notes: r.notes || "",
    });
    setModalError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalError("");
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      setModalError("Name and email are required.");
      return;
    }
    setSaving(true);
    setModalError("");

    try {
      if (editingId) {
        // Update existing referral
        const res = await fetch(`/api/referrals/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: referrals.find((r) => r.id === editingId)?.status || "PENDING",
            type: form.type,
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            organisation: form.organisation || undefined,
            suggestedRole: form.suggestedRole || undefined,
            notes: form.notes || undefined,
          }),
        });
        if (!res.ok) {
          setModalError(await res.text().catch(() => "Failed to update"));
          return;
        }
        setReferrals((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  type: form.type,
                  name: form.name.trim(),
                  email: form.email.trim().toLowerCase(),
                  phone: form.phone.trim() || null,
                  organisation: form.organisation.trim() || null,
                  suggestedRole: form.suggestedRole.trim() || null,
                  notes: form.notes.trim() || null,
                }
              : r
          )
        );
      } else {
        // Create new referral
        const res = await fetch("/api/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: form.type,
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            organisation: form.organisation || undefined,
            suggestedRole: form.suggestedRole || undefined,
            notes: form.notes || undefined,
          }),
        });
        if (!res.ok) {
          setModalError(await res.text().catch(() => "Failed to create"));
          return;
        }
        const data = await res.json();
        setReferrals((prev) => [
          {
            id: data.referral.id,
            type: data.referral.type,
            name: data.referral.name,
            email: data.referral.email,
            phone: data.referral.phone,
            organisation: data.referral.organisation,
            suggestedRole: data.referral.suggestedRole,
            notes: data.referral.notes,
            status: data.referral.status,
            createdAt: data.referral.createdAt,
            referrer: data.referral.referrer || { id: "", name: "You", email: "", role: "" },
          },
          ...prev,
        ]);
      }
      closeModal();
    } catch {
      setModalError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/referrals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to delete");
        alert(msg);
        return;
      }
      setReferrals((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  }

  async function updateStatus(id: string, status: ReferralStatus, assessmentLevel?: string) {
    setUpdating(id);
    setConvertError("");
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assessmentLevel }),
      });
      if (res.ok) {
        setReferrals((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
        setConvertingId(null);
      } else {
        const msg = await res.text().catch(() => "Failed");
        setConvertError(msg);
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: counts.total, color: "#6B7280" },
            { label: "Pending", value: counts.pending, color: "#F59E0B" },
            { label: "Contacted", value: counts.contacted, color: "#3B82F6" },
            { label: "Converted", value: counts.converted, color: "#10B981" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {/* Filter tabs + Create button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "contacted", label: "Contacted" },
              { key: "converted", label: "Converted" },
              { key: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filter === f.key ? "#0F2744" : "#fff",
                  color: filter === f.key ? "#fff" : "#6B7280",
                  border: filter === f.key ? "1px solid #0F2744" : "1px solid #e5eaf0",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#0F2744" }}
          >
            <Plus size={13} />
            Add Referral
          </button>
        </div>

        {/* Referral cards */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl p-12 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <UserPlus size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No referrals in this category.</p>
            </div>
          )}
          {filtered.map((r) => {
            const Icon = TYPE_ICONS[r.type] ?? UserPlus;
            const statusStyle = STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING;
            const isConverted = r.status === "CONVERTED";
            return (
              <div
                key={r.id}
                className="rounded-xl p-5 bg-white"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#F0F4FF" }}
                  >
                    <Icon size={16} style={{ color: "#0F2744" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "#F0F4FF", color: "#0F2744" }}
                          >
                            {TYPE_LABELS[r.type] ?? r.type}
                          </span>
                          {r.suggestedRole && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {r.suggestedRole}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{r.email}</p>
                        {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                        {r.organisation && (
                          <p className="text-xs text-gray-500 mt-0.5">{r.organisation}</p>
                        )}
                      </div>

                      {/* Status badge */}
                      <span
                        className="text-[11px] font-semibold rounded-full px-3 py-1 shrink-0"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {r.notes && (
                      <p className="mt-3 text-xs text-gray-600 leading-relaxed p-3 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                        {r.notes}
                      </p>
                    )}

                    {/* Accept & Invite confirmation for consultant referrals */}
                    {convertingId === r.id && (
                      <div className="mt-3 p-3 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                        <p className="text-xs font-semibold text-emerald-800 mb-2">Accept & Invite as C4A Consultant</p>
                        <p className="text-[11px] text-emerald-700 mb-3">
                          This will create a platform account for {r.name}, send them an invite email with login credentials, and start onboarding.
                        </p>
                        <label className="text-[11px] text-emerald-700 block mb-1">Assessment Level</label>
                        <select
                          value={convertLevel}
                          onChange={(e) => setConvertLevel(e.target.value)}
                          className="w-full rounded-lg border px-2 py-1.5 text-xs mb-3 focus:outline-none"
                          style={{ borderColor: "#BBF7D0" }}
                        >
                          <option value="LIGHT">Light (profile only)</option>
                          <option value="STANDARD">Standard (profile + proctored assessment)</option>
                          <option value="MAAROVA">Maarova assessment only</option>
                          <option value="FULL">Full (profile + assessment + Maarova)</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(r.id, "CONVERTED", convertLevel)}
                            disabled={updating === r.id}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                            style={{ background: "#059669" }}
                          >
                            {updating === r.id ? (
                              <><Loader2 size={12} className="animate-spin" /> Creating account...</>
                            ) : (
                              <><Send size={12} /> Confirm and Send Invite</>
                            )}
                          </button>
                          <button
                            onClick={() => { setConvertingId(null); setConvertError(""); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-white"
                            style={{ border: "1px solid #e5eaf0" }}
                          >
                            Cancel
                          </button>
                        </div>
                        {convertError && (
                          <p className="text-xs text-red-600 mt-2">{convertError}</p>
                        )}
                      </div>
                    )}

                    {/* Meta line */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {timeAgo(new Date(r.createdAt))}
                      </span>
                      <span>Referred by {r.referrer?.name ?? "Unknown"}</span>
                      <span className="capitalize">{r.referrer?.role?.toLowerCase().replace(/_/g, " ") ?? ""}</span>
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #f0f0f0" }}>
                      {(r.status === "PENDING" || r.status === "CONTACTED") && (
                        <>
                          <button
                            onClick={() => {
                              if (r.type === "CONSULTANT") {
                                setConvertingId(r.id);
                              } else {
                                updateStatus(r.id, "CONVERTED");
                              }
                            }}
                            disabled={updating === r.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
                            style={{ background: "#059669" }}
                          >
                            <CheckCircle size={12} />
                            {updating === r.id ? "Processing..." : "Accept & Invite"}
                          </button>

                          {r.status === "PENDING" && (
                            <button
                              onClick={() => updateStatus(r.id, "CONTACTED")}
                              disabled={updating === r.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 disabled:opacity-50 transition-colors hover:bg-blue-50"
                              style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}
                            >
                              <Phone size={11} />
                              Mark Contacted
                            </button>
                          )}

                          <button
                            onClick={() => updateStatus(r.id, "REJECTED")}
                            disabled={updating === r.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 disabled:opacity-50 transition-colors hover:bg-red-50"
                            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                          >
                            <XCircle size={11} />
                            Reject
                          </button>
                        </>
                      )}

                      {r.status === "REJECTED" && (
                        <button
                          onClick={() => updateStatus(r.id, "PENDING")}
                          disabled={updating === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-50 transition-colors hover:bg-gray-50"
                          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
                        >
                          <RotateCcw size={11} />
                          Reopen
                        </button>
                      )}

                      {r.status === "CONVERTED" && (
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle size={11} />
                          Invited and onboarding
                        </p>
                      )}

                      {/* Edit / Delete always available on the right */}
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                          title="Edit referral"
                        >
                          <Pencil size={13} />
                        </button>
                        {!isConverted && (
                          deleteConfirm === r.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(r.id)}
                                disabled={deletingId === r.id}
                                className="px-2 py-1 rounded text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                              >
                                {deletingId === r.id ? "..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded text-[10px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(r.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete referral"
                            >
                              <Trash2 size={13} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
              <h3 className="text-sm font-semibold text-gray-900">
                {editingId ? "Edit Referral" : "Add Referral"}
              </h3>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                <div className="flex gap-2">
                  {(["CLIENT", "CONSULTANT", "STAFF"] as ReferralType[]).map((t) => {
                    const TIcon = TYPE_ICONS[t] ?? UserPlus;
                    return (
                      <button
                        key={t}
                        onClick={() => setForm((p) => ({ ...p, type: t }))}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: form.type === t ? "#0F2744" : "#fff",
                          color: form.type === t ? "#fff" : "#6B7280",
                          border: form.type === t ? "1px solid #0F2744" : "1px solid #e5eaf0",
                        }}
                      >
                        <TIcon size={12} />
                        {TYPE_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+234 80x xxx xxxx"
                  className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                />
              </div>

              {(form.type === "CLIENT" || form.type === "CONSULTANT") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {form.type === "CLIENT" ? "Organisation" : "Current Organisation"}
                  </label>
                  <input
                    type="text"
                    value={form.organisation}
                    onChange={(e) => setForm((p) => ({ ...p, organisation: e.target.value }))}
                    placeholder={form.type === "CLIENT" ? "e.g. Eko Hospital" : "e.g. LUTH"}
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                  />
                </div>
              )}

              {form.type === "STAFF" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Suggested Role</label>
                  <select
                    value={form.suggestedRole}
                    onChange={(e) => setForm((p) => ({ ...p, suggestedRole: e.target.value }))}
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB", color: form.suggestedRole ? "#111" : "#9CA3AF" }}
                  >
                    <option value="">Select a role</option>
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Why are you recommending them?"
                  rows={3}
                  className="w-full text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle size={13} />
                  {modalError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: "1px solid #e5eaf0" }}>
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 bg-white hover:bg-gray-50"
                style={{ border: "1px solid #e5eaf0" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.email.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
                style={{ background: "#0F2744" }}
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                {editingId ? "Save Changes" : "Add Referral"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
