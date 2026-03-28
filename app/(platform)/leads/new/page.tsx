"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SOURCES = [
  { value: "COLD_OUTREACH", label: "Cold Outreach", description: "We're reaching out to them" },
  { value: "EVENT", label: "Event / Business Card", description: "Met at a conference, seminar, or meeting" },
  { value: "EXISTING_CLIENT", label: "Existing Client Expansion", description: "Current client wants additional services" },
  { value: "REFERRAL", label: "Referral", description: "Introduced by someone in the network" },
];

const ORG_TYPES = [
  { value: "private_hospital", label: "Private Hospital" },
  { value: "hospital_group", label: "Hospital Group" },
  { value: "government", label: "Government / Public Sector" },
  { value: "ngo", label: "NGO / Development Partner" },
  { value: "startup", label: "HealthTech Startup" },
  { value: "sme", label: "SME" },
];

const SERVICE_LINES = [
  "Hospital Turnaround & Financial Recovery",
  "Strategy, Growth & Commercial Performance",
  "Clinical Governance & Accreditation",
  "Digital Health & Technology Leadership",
  "Fractional Leadership & Executive Secondments",
  "Health Systems & Public Sector Advisory",
  "Healthcare HR Management (Maarova)",
];

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none";
const inputStyle = { borderColor: "#e5eaf0" };

export default function NewLeadPage() {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [form, setForm] = useState({
    organizationName: "", contactName: "", contactEmail: "", contactPhone: "",
    contactRole: "", organizationType: "", country: "Nigeria", city: "",
    serviceLineHook: "", estimatedSize: "", outreachStrategy: "",
    knownPainPoints: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source,
          knownPainPoints: form.knownPainPoints.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/leads/${data.lead.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F2744" }}>New Lead</h1>
        <p className="text-sm text-gray-500 mb-6">Add a potential client to the pipeline. Nuru will help qualify and research them.</p>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

        {/* Source selection */}
        {!source ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>How did this lead come in?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSource(s.value)}
                  className="text-left rounded-xl border p-4 hover:shadow-md transition-all"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{s.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.description}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-2">Website enquiries and Maarova demo requests are automatically captured as leads.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {SOURCES.find((s) => s.value === source)?.label}
              </span>
              <button type="button" onClick={() => setSource("")} className="text-xs text-gray-400 hover:text-gray-600">Change</button>
            </div>

            {/* Organisation details */}
            <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: "#e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input required value={form.organizationName} onChange={(e) => setForm((p) => ({ ...p, organizationName: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. Priscilla Specialist Hospital" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.organizationType} onChange={(e) => setForm((p) => ({ ...p, organizationType: e.target.value }))} className={inputClass} style={inputStyle}>
                    <option value="">Select...</option>
                    {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                  <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. Lagos" />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: "#e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} className={inputClass} style={inputStyle} placeholder="Decision maker or first point of contact" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role/Title</label>
                  <input value={form.contactRole} onChange={(e) => setForm((p) => ({ ...p, contactRole: e.target.value }))} className={inputClass} style={inputStyle} placeholder="e.g. CEO, Medical Director, COO" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} className={inputClass} style={inputStyle} placeholder="+234..." />
                </div>
              </div>
            </div>

            {/* Strategy */}
            <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: "#e5eaf0" }}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {source === "COLD_OUTREACH" ? "Outreach Strategy" : "Initial Assessment"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service Line Hook</label>
                  <select value={form.serviceLineHook} onChange={(e) => setForm((p) => ({ ...p, serviceLineHook: e.target.value }))} className={inputClass} style={inputStyle}>
                    <option value="">Which C4A service fits?</option>
                    {SERVICE_LINES.map((sl) => <option key={sl} value={sl}>{sl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Size</label>
                  <select value={form.estimatedSize} onChange={(e) => setForm((p) => ({ ...p, estimatedSize: e.target.value }))} className={inputClass} style={inputStyle}>
                    <option value="">Unknown</option>
                    <option value="SMALL">Small (under N5M)</option>
                    <option value="MEDIUM">Medium (N5M-20M)</option>
                    <option value="LARGE">Large (N20M+)</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Known Pain Points (one per line)</label>
                <textarea value={form.knownPainPoints} onChange={(e) => setForm((p) => ({ ...p, knownPainPoints: e.target.value }))} rows={3} className={`${inputClass} resize-none`} style={inputStyle} placeholder={"Revenue leakage in pharmacy\nNo clinical governance framework\nHigh staff turnover"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {source === "COLD_OUTREACH" ? "Outreach Angle" : source === "EVENT" ? "Conversation Context" : "Notes"}
                </label>
                <textarea value={form.outreachStrategy} onChange={(e) => setForm((p) => ({ ...p, outreachStrategy: e.target.value }))} rows={3} className={`${inputClass} resize-none`} style={inputStyle}
                  placeholder={
                    source === "COLD_OUTREACH"
                      ? "How will we approach them? What's the opening hook? Any mutual connections?"
                      : source === "EVENT"
                        ? "What was discussed? What interested them? Any follow-up promised?"
                        : "Any additional context about this lead..."
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
                {saving ? "Creating..." : "Create Lead"}
              </button>
              <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border" style={{ borderColor: "#e5eaf0" }}>
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-300">After creating, Nuru will help qualify this lead and suggest an outreach strategy.</p>
          </form>
        )}
      </div>
    </div>
  );
}
