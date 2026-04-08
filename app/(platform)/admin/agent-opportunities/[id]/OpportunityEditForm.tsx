"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save, Loader2 } from "lucide-react";

interface OpportunityData {
  id: string;
  title: string;
  description: string;
  productType: string;
  serviceCategory: string | null;
  clientName: string;
  commissionType: string;
  commissionValue: number;
  commissionTiers: unknown;
  territories: string[];
  targetIndustries: string[];
  targetDescription: string | null;
  expectedDealValueMin: number | null;
  expectedDealValueMax: number | null;
  startDate: string;
  endDate: string | null;
  maxAgents: number | null;
  notes: string | null;
}

export default function OpportunityEditForm({ opportunity }: { opportunity: OpportunityData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: opportunity.title,
    description: opportunity.description,
    productType: opportunity.productType,
    serviceCategory: opportunity.serviceCategory ?? "",
    clientName: opportunity.clientName,
    commissionType: opportunity.commissionType,
    commissionValue: String(opportunity.commissionValue),
    commissionTiers: opportunity.commissionTiers ? JSON.stringify(opportunity.commissionTiers, null, 2) : "",
    territories: opportunity.territories.join(", "),
    targetIndustries: opportunity.targetIndustries.join(", "),
    targetDescription: opportunity.targetDescription ?? "",
    expectedDealValueMin: opportunity.expectedDealValueMin != null ? String(opportunity.expectedDealValueMin) : "",
    expectedDealValueMax: opportunity.expectedDealValueMax != null ? String(opportunity.expectedDealValueMax) : "",
    startDate: opportunity.startDate.slice(0, 10),
    endDate: opportunity.endDate ? opportunity.endDate.slice(0, 10) : "",
    maxAgents: opportunity.maxAgents != null ? String(opportunity.maxAgents) : "",
    notes: opportunity.notes ?? "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        productType: form.productType,
        serviceCategory: form.serviceCategory || null,
        clientName: form.clientName,
        commissionType: form.commissionType,
        commissionValue: form.commissionValue,
        commissionTiers: form.commissionTiers ? JSON.parse(form.commissionTiers) : null,
        territories: form.territories
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        targetIndustries: form.targetIndustries
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        targetDescription: form.targetDescription || null,
        expectedDealValueMin: form.expectedDealValueMin || null,
        expectedDealValueMax: form.expectedDealValueMax || null,
        startDate: form.startDate,
        endDate: form.endDate || null,
        maxAgents: form.maxAgents || null,
        notes: form.notes || null,
      };

      const res = await fetch(`/api/admin/agent-opportunities/${opportunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      setEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ color: "#0F2744" }}>
          Edit Opportunity
        </h2>
        <button
          onClick={() => setEditing(false)}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" value={form.title} onChange={(v) => update("title", v)} span={2} />
        <TextArea label="Description" value={form.description} onChange={(v) => update("description", v)} span={2} />
        <Field label="Product Type" value={form.productType} onChange={(v) => update("productType", v)} />
        <Field label="Service Category" value={form.serviceCategory} onChange={(v) => update("serviceCategory", v)} />
        <Field label="Client Name" value={form.clientName} onChange={(v) => update("clientName", v)} />

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Commission Type</label>
          <select
            value={form.commissionType}
            onChange={(e) => update("commissionType", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0F2744] focus:ring-1 focus:ring-[#0F2744]"
          >
            <option value="FIXED_PER_DEAL">Fixed Per Deal</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="TIERED">Tiered</option>
            <option value="RECURRING">Recurring</option>
          </select>
        </div>

        <Field label="Commission Value" value={form.commissionValue} onChange={(v) => update("commissionValue", v)} type="number" />

        {form.commissionType === "TIERED" && (
          <TextArea
            label="Commission Tiers (JSON)"
            value={form.commissionTiers}
            onChange={(v) => update("commissionTiers", v)}
            span={2}
            rows={4}
          />
        )}

        <Field label="Territories (comma-separated)" value={form.territories} onChange={(v) => update("territories", v)} />
        <Field label="Target Industries (comma-separated)" value={form.targetIndustries} onChange={(v) => update("targetIndustries", v)} />
        <TextArea label="Target Description" value={form.targetDescription} onChange={(v) => update("targetDescription", v)} span={2} />

        <Field label="Expected Min Deal Value" value={form.expectedDealValueMin} onChange={(v) => update("expectedDealValueMin", v)} type="number" />
        <Field label="Expected Max Deal Value" value={form.expectedDealValueMax} onChange={(v) => update("expectedDealValueMax", v)} type="number" />

        <Field label="Start Date" value={form.startDate} onChange={(v) => update("startDate", v)} type="date" />
        <Field label="End Date" value={form.endDate} onChange={(v) => update("endDate", v)} type="date" />
        <Field label="Max Agents" value={form.maxAgents} onChange={(v) => update("maxAgents", v)} type="number" />

        <TextArea label="Notes" value={form.notes} onChange={(v) => update("notes", v)} span={2} />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: "#0F2744" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  span,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  span?: number;
}) {
  return (
    <div className={`space-y-1 ${span === 2 ? "sm:col-span-2" : ""}`}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0F2744] focus:ring-1 focus:ring-[#0F2744]"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  span,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  span?: number;
  rows?: number;
}) {
  return (
    <div className={`space-y-1 ${span === 2 ? "sm:col-span-2" : ""}`}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0F2744] focus:ring-1 focus:ring-[#0F2744]"
      />
    </div>
  );
}
