"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const PARTNER_TYPES = [
  { value: "CONSULTANCY", label: "Consultancy" },
  { value: "DEVELOPMENT_AGENCY", label: "Development Agency" },
  { value: "NGO", label: "NGO" },
  { value: "MULTILATERAL", label: "Multilateral" },
  { value: "OTHER", label: "Other" },
];

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

export default function NewPartnerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "",
    website: "",
    country: "Nigeria",
    city: "",
    notes: "",
    defaultMarkupPct: "20",
    paymentTerms: "30",
    currency: "NGN",
    primaryContactName: "",
    primaryContactEmail: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to create partner.");
        return;
      }
      const { partner } = await res.json();
      setOpen(false);
      router.push(`/admin/partners/${partner.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ background: "#0F2744", color: "#fff" }}
      >
        <Plus size={15} />
        Add Partner
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,39,68,0.4)" }}>
      <div
        className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
        style={{ background: "#fff" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #e5eaf0" }}
        >
          <h2 className="text-base font-semibold text-gray-900">Add Partner Firm</h2>
          <button onClick={() => { setOpen(false); setError(""); }} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Firm name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Firm Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. McKinsey Health Institute"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Partner Type <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Select type...</option>
              {PARTNER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Website</label>
            <input
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Country + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Country</label>
              <input
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Lagos"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Primary contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Primary Contact Name</label>
              <input
                value={form.primaryContactName}
                onChange={(e) => set("primaryContactName", e.target.value)}
                placeholder="e.g. John Doe"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Primary Contact Email</label>
              <input
                type="email"
                value={form.primaryContactEmail}
                onChange={(e) => set("primaryContactEmail", e.target.value)}
                placeholder="john@firm.com"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Commercial terms */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="NGN">NGN (Naira)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Terms (days)</label>
              <input
                type="number"
                min={1}
                max={180}
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Markup %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.defaultMarkupPct}
                onChange={(e) => set("defaultMarkupPct", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Internal Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Relationship context, sourcing channel..."
              rows={3}
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); }}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ border: "1px solid #e5eaf0" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {loading ? "Creating..." : "Create Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
