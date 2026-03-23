"use client";

import { useState } from "react";
import { Users, Shield, CheckCircle, Mail, Phone, Plus, X, Pencil, Send } from "lucide-react";
import EnablePortalModal from "./EnablePortalModal";

interface Contact {
  id: string;
  name: string;
  email: string;
  title: string | null;
  phone: string | null;
  isPrimary: boolean;
  isPortalEnabled: boolean;
  lastLoginAt: Date | null;
}

interface ClientAccount {
  email: string;
  primaryContact: string;
  phone: string;
}

interface Props {
  clientId: string;
  contacts: Contact[];
  canEnablePortal: boolean;
  canAdd?: boolean;
  clientAccount?: ClientAccount;
}

const emptyForm = { name: "", email: "", title: "", phone: "", isPrimary: false };

export default function ClientContactsSection({
  clientId,
  contacts: initialContacts,
  canEnablePortal,
  canAdd = false,
  clientAccount,
}: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [modalContact, setModalContact] = useState<Contact | null>(null);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(
    new Set(initialContacts.filter((c) => c.isPortalEnabled).map((c) => c.id))
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [resending, setResending] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  // Check if the client account owner has a contact entry
  const ownerHasContact = !clientAccount || contacts.some(
    (c) => c.email.toLowerCase() === clientAccount.email.toLowerCase()
  );

  async function provisionOwner() {
    if (!clientAccount) return;
    setProvisioning(true);
    try {
      // Create contact for account owner
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientAccount.primaryContact,
          email: clientAccount.email,
          phone: clientAccount.phone,
          isPrimary: true,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setFormError(text || "Failed to create contact.");
        setProvisioning(false);
        return;
      }
      const { contact } = await res.json();
      setContacts((prev) => [contact, ...prev.map((c) => ({ ...c, isPrimary: false }))]);

      // Now send portal invite (resend-invite auto-creates password + enables portal)
      const inviteRes = await fetch("/api/client-portal/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id }),
      });
      if (inviteRes.ok) {
        setEnabledIds((prev) => new Set([...prev, contact.id]));
        setProvisionSuccess(true);
      }
    } catch {}
    setProvisioning(false);
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      email: contact.email,
      title: contact.title ?? "",
      phone: contact.phone ?? "",
      isPrimary: contact.isPrimary,
    });
    setShowForm(false);
    setFormError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  async function saveEdit() {
    if (!editingId || !form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: editingId, ...form }),
      });
      if (!res.ok) {
        const text = await res.text();
        setFormError(text || "Failed to update contact.");
        return;
      }
      const { contact } = await res.json();
      setContacts((prev) => {
        const updated = form.isPrimary
          ? prev.map((c) => ({ ...c, isPrimary: c.id === editingId }))
          : prev;
        return updated.map((c) => (c.id === editingId ? { ...c, ...contact } : c));
      });
      setEditingId(null);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  async function addContact() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await res.text();
        setFormError(text || "Failed to add contact.");
        return;
      }
      const { contact } = await res.json();
      setContacts((prev) => {
        const updated = form.isPrimary ? prev.map((c) => ({ ...c, isPrimary: false })) : prev;
        return [...updated, contact];
      });
      setForm(emptyForm);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function resendInvite(contactId: string) {
    setResending(contactId);
    setResendSuccess(null);
    try {
      const res = await fetch("/api/client-portal/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      if (res.ok) {
        setResendSuccess(contactId);
        // Also mark as portal enabled in UI
        setEnabledIds((prev) => new Set([...prev, contactId]));
        setTimeout(() => setResendSuccess(null), 3000);
      }
    } catch {}
    setResending(null);
  }

  function formatDate(date: Date | null): string {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users size={15} />
            Contacts ({contacts.length})
          </h2>
          {canAdd && (
            <button
              onClick={() => { setShowForm((v) => !v); setEditingId(null); setForm(emptyForm); setFormError(""); }}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
              style={{ background: showForm ? "#F3F4F6" : "#0F2744", color: showForm ? "#374151" : "#fff" }}
            >
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? "Cancel" : "Add Contact"}
            </button>
          )}
        </div>

        {/* Banner for legacy clients without a portal contact */}
        {!ownerHasContact && canEnablePortal && !provisionSuccess && clientAccount && (
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3 mb-3"
            style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={14} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                <span className="font-medium">{clientAccount.primaryContact}</span> ({clientAccount.email}) does not have portal access yet.
              </p>
            </div>
            <button
              onClick={provisionOwner}
              disabled={provisioning}
              className="shrink-0 ml-3 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {provisioning ? "Setting up..." : "Send portal invite"}
            </button>
          </div>
        )}

        {provisionSuccess && !ownerHasContact && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 mb-3"
            style={{ background: "#D1FAE5", border: "1px solid #A7F3D0" }}
          >
            <CheckCircle size={14} className="text-emerald-600" />
            <p className="text-xs text-emerald-800">Portal invite sent to {clientAccount?.email}. They will receive login credentials by email.</p>
          </div>
        )}

        {showForm && (
          <div className="rounded-lg p-4 space-y-2 mb-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name *"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email *"
                type="email"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Job title"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                className="rounded"
              />
              Set as primary contact
            </label>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <button
              onClick={addContact}
              disabled={!form.name.trim() || !form.email.trim() || saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {saving ? "Adding..." : "Add Contact"}
            </button>
          </div>
        )}

        {contacts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No contacts yet
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact) => {
              const portalEnabled = enabledIds.has(contact.id);
              const isEditing = editingId === contact.id;

              if (isEditing) {
                return (
                  <div
                    key={contact.id}
                    className="rounded-xl px-4 py-3"
                    style={{ border: "1px solid #0F2744", background: "#F9FAFB" }}
                  >
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Full name *"
                        className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                        style={{ border: "1px solid #e5eaf0", background: "#fff" }}
                      />
                      <input
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="Email *"
                        type="email"
                        className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                        style={{ border: "1px solid #e5eaf0", background: "#fff" }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Job title"
                        className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                        style={{ border: "1px solid #e5eaf0", background: "#fff" }}
                      />
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="Phone"
                        className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                        style={{ border: "1px solid #e5eaf0", background: "#fff" }}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={form.isPrimary}
                        onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                        className="rounded"
                      />
                      Set as primary contact
                    </label>
                    {formError && <p className="text-xs text-red-500 mb-2">{formError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={!form.name.trim() || !form.email.trim() || saving}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                        style={{ background: "#0F2744", color: "#fff" }}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "#F3F4F6", color: "#374151" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={contact.id}
                  className="flex items-center gap-4 rounded-xl px-4 py-3 bg-white"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ background: "#0F2744" }}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">
                        {contact.name}
                      </p>
                      {contact.isPrimary && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                          }}
                        >
                          Primary
                        </span>
                      )}
                      {portalEnabled && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                          style={{
                            background: "#D1FAE5",
                            color: "#065F46",
                          }}
                        >
                          <CheckCircle size={9} />
                          Portal enabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {contact.title && (
                        <span className="text-xs text-gray-500">
                          {contact.title}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail size={10} />
                        {contact.email}
                      </span>
                      {contact.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={10} />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                    {portalEnabled && contact.lastLoginAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Last login: {formatDate(contact.lastLoginAt)}
                      </p>
                    )}
                  </div>

                  {/* Edit button */}
                  {canAdd && (
                    <>
                      <button
                        onClick={() => startEdit(contact)}
                        className="shrink-0 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        style={{ border: "1px solid #e5eaf0", color: "#6B7280", background: "#fff" }}
                        title="Edit contact"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Remove ${contact.name}?`)) return;
                          try {
                            await fetch(`/api/clients/${clientId}/contacts/${contact.id}`, { method: "DELETE" });
                            setContacts((prev) => prev.filter((c) => c.id !== contact.id));
                          } catch {}
                        }}
                        className="shrink-0 text-xs px-2 py-1.5 rounded-lg transition-colors text-gray-300 hover:text-red-500"
                        title="Remove contact"
                      >
                        <X size={11} />
                      </button>
                    </>
                  )}

                  {/* Portal actions */}
                  {canEnablePortal && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {portalEnabled && (
                        <button
                          onClick={() => resendInvite(contact.id)}
                          disabled={resending === contact.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          style={{
                            border: "1px solid #e5eaf0",
                            color: resendSuccess === contact.id ? "#065F46" : "#6B7280",
                            background: resendSuccess === contact.id ? "#D1FAE5" : "#fff",
                          }}
                          title="Resend login credentials"
                        >
                          <Send size={11} />
                          {resending === contact.id ? "Sending..." : resendSuccess === contact.id ? "Sent!" : "Resend invite"}
                        </button>
                      )}
                      <button
                        onClick={() => setModalContact(contact)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        style={{
                          border: "1px solid #e5eaf0",
                          color: portalEnabled ? "#6B7280" : "#0F2744",
                          background: "#fff",
                        }}
                      >
                        <Shield size={11} />
                        {portalEnabled ? "Reset password" : "Enable portal"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalContact && (
        <EnablePortalModal
          contactId={modalContact.id}
          contactName={modalContact.name}
          onClose={() => setModalContact(null)}
          onSuccess={() => {
            setEnabledIds((prev) => new Set([...prev, modalContact.id]));
          }}
        />
      )}
    </>
  );
}
