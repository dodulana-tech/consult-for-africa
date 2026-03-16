"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

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

const INITIAL = {
  name: "",
  type: "private_hospital",
  country: "Nigeria",
  city: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  stream: "RECRUITMENT",
  maxAssessments: "10",
};

export default function MaarovaOrgCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/maarova/admin/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          country: form.country.trim() || "Nigeria",
          city: form.city.trim() || undefined,
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim() || undefined,
          stream: form.stream,
          maxAssessments: parseInt(form.maxAssessments, 10) || 10,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create organisation");
      }

      const data = await res.json();
      setSuccess(`Organisation "${data.name}" created successfully.`);
      setForm(INITIAL);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      {/* Feedback */}
      {error && (
        <div
          className="flex items-center gap-2 px-5 py-3 text-sm"
          style={{ background: "#FEE2E2", color: "#991B1B" }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 px-5 py-3 text-sm"
          style={{ background: "#D1FAE5", color: "#065F46" }}
        >
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold transition-colors hover:bg-gray-50"
        style={{ color: "#0F2744" }}
      >
        <span className="flex items-center gap-2">
          <Plus size={16} />
          Create Organisation
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Form */}
      {open && (
        <form
          onSubmit={handleSubmit}
          className="px-5 pb-5 space-y-4"
          style={{ borderTop: "1px solid #e5eaf0" }}
        >
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field
              label="Organisation Name *"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
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
            <Field
              label="Country"
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v })}
              placeholder="Nigeria"
            />
            <Field
              label="City"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              placeholder="Lagos"
            />
            <Field
              label="Contact Name *"
              value={form.contactName}
              onChange={(v) => setForm({ ...form, contactName: v })}
              required
            />
            <Field
              label="Contact Email *"
              value={form.contactEmail}
              onChange={(v) => setForm({ ...form, contactEmail: v })}
              type="email"
              required
            />
            <Field
              label="Contact Phone"
              value={form.contactPhone}
              onChange={(v) => setForm({ ...form, contactPhone: v })}
              placeholder="+234..."
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Stream *
              </label>
              <select
                value={form.stream}
                onChange={(e) => setForm({ ...form, stream: e.target.value })}
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
            <Field
              label="Max Assessments"
              value={form.maxAssessments}
              onChange={(v) => setForm({ ...form, maxAssessments: v })}
              type="number"
              placeholder="10"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: "#D4AF37", color: "#06090f" }}
            >
              {saving ? "Creating..." : "Create Organisation"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setForm(INITIAL);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
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
