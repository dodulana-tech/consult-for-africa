"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CLIENT_TYPES = [
  { value: "private_hospital", label: "Private Hospital" },
  { value: "hospital_group", label: "Hospital Group" },
  { value: "government", label: "Government / Public Sector" },
  { value: "ngo", label: "NGO / Development Partner" },
  { value: "startup", label: "HealthTech Startup" },
  { value: "sme", label: "SME" },
];

function NewDiscoveryCallForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");

  const [form, setForm] = useState({
    organizationName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    organizationType: "",
    scheduledAt: "",
    leadId: leadId || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [leadLoaded, setLeadLoaded] = useState(false);
  const [leadName, setLeadName] = useState("");

  // Pre-populate from lead if leadId is provided
  useEffect(() => {
    if (!leadId) return;
    fetch(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.lead) {
          const lead = data.lead;
          setForm((f) => ({
            ...f,
            organizationName: lead.organizationName || f.organizationName,
            contactName: lead.contactName || f.contactName,
            contactEmail: lead.contactEmail || f.contactEmail,
            contactPhone: lead.contactPhone || f.contactPhone,
            organizationType: lead.organizationType || f.organizationType,
            leadId: lead.id,
          }));
          setLeadName(lead.organizationName);
          setLeadLoaded(true);
        }
      })
      .catch(() => {});
  }, [leadId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/discovery-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");

      // Update lead status if linked
      if (form.leadId) {
        fetch(`/api/leads/${form.leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "DISCOVERY_SCHEDULED" }),
        }).catch(() => {});
      }

      router.push(`/discovery-calls/${data.call.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none";
  const inputStyle = { borderColor: "#e5eaf0" };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F2744" }}>New Discovery Call</h1>
        <p className="text-sm text-gray-500 mb-6">Record a new or upcoming client discovery call. Nuru will help you analyze the conversation.</p>

        {leadLoaded && (
          <div className="p-3 rounded-lg mb-4 flex items-center gap-2" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-blue-700">Pre-populated from lead: <span className="font-semibold">{leadName}</span></p>
          </div>
        )}

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5eaf0" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Organisation Name *</label>
              <input
                required
                value={form.organizationName}
                onChange={(e) => setForm((p) => ({ ...p, organizationName: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. Cedarcrest Hospitals"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Organisation Type</label>
              <select
                value={form.organizationType}
                onChange={(e) => setForm((p) => ({ ...p, organizationType: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">Select type...</option>
                {CLIENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name *</label>
              <input
                required
                value={form.contactName}
                onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                placeholder="Primary contact person"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                placeholder="contact@hospital.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
              <input
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                className={inputClass}
                style={inputStyle}
                placeholder="+234..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Date/Time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              {saving ? "Creating..." : "Create Discovery Call"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border"
              style={{ borderColor: "#e5eaf0" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewDiscoveryCallPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>}>
      <NewDiscoveryCallForm />
    </Suspense>
  );
}
