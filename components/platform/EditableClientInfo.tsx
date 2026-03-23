"use client";

import { useState } from "react";
import { Pencil, X, Check, Loader2, Mail, Phone, MapPin, CreditCard } from "lucide-react";

type ClientInfo = {
  id: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: number;
  currency: string;
  notes: string | null;
};

const inputClass = "w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

export default function EditableClientInfo({ client }: { client: ClientInfo }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(client);
  const [form, setForm] = useState(client);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
          address: form.address,
          paymentTerms: form.paymentTerms,
          currency: form.currency,
          notes: form.notes,
        }),
      });
      if (res.ok) {
        const { client: updated } = await res.json();
        setData({ ...data, ...updated });
        setEditing(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setForm(data);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Contact Information</h2>
          <div className="flex items-center gap-1">
            <button onClick={save} disabled={saving} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={cancel} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass} style={inputStyle} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Payment Terms (days)</label>
              <input type="number" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: parseInt(e.target.value) || 30 })}
                className={inputClass} style={inputStyle} />
            </div>
            <div className="w-24">
              <label className="text-xs text-gray-500 mb-1 block">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className={inputClass} style={inputStyle}>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2} className={inputClass} style={inputStyle} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 bg-white" style={{ border: "1px solid #e5eaf0" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Contact Information</h2>
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <Pencil size={13} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
        <span className="flex items-center gap-2">
          <Mail size={13} className="text-gray-400" />
          {data.email}
        </span>
        <span className="flex items-center gap-2">
          <Phone size={13} className="text-gray-400" />
          {data.phone}
        </span>
        <span className="flex items-center gap-2">
          <MapPin size={13} className="text-gray-400" />
          {data.address}
        </span>
        <span className="flex items-center gap-2">
          <CreditCard size={13} className="text-gray-400" />
          {data.paymentTerms}-day payment terms &middot; {data.currency}
        </span>
      </div>
      {data.notes && (
        <p className="mt-3 text-xs text-gray-500 border-t pt-3" style={{ borderColor: "#e5eaf0" }}>
          {data.notes}
        </p>
      )}
    </div>
  );
}
