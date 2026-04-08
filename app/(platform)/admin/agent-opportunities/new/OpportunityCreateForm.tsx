"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TERRITORIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Benin City", "Calabar", "Nationwide"];
const INDUSTRIES = ["Healthcare", "Corporate Wellness", "Pharmaceuticals", "Oil & Gas", "Financial Services", "Government", "Telecoms", "Diplomatic", "Hospitality"];
const COMMISSION_TYPES = [
  { value: "FIXED_PER_DEAL", label: "Fixed per Deal" },
  { value: "PERCENTAGE", label: "Percentage of Deal Value" },
  { value: "TIERED", label: "Tiered (Volume-Based)" },
  { value: "RECURRING", label: "Recurring" },
];

export default function OpportunityCreateForm({
  clients,
  engagements,
}: {
  clients: Array<{ id: string; name: string }>;
  engagements: Array<{ id: string; name: string; clientId: string }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", productType: "", clientId: "", clientName: "",
    engagementId: "", commissionType: "PERCENTAGE", commissionValue: "",
    startDate: "", endDate: "", maxAgents: "",
    expectedDealValueMin: "", expectedDealValueMax: "", notes: "",
  });
  const [territories, setTerritories] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "clientId") {
        const client = clients.find((c) => c.id === value);
        if (client) next.clientName = client.name;
      }
      return next;
    });
  }

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/agent-opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          territories,
          targetIndustries,
          status: "DRAFT",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create opportunity");
        return;
      }

      router.push("/admin/agent-opportunities");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const filteredEngagements = form.clientId
    ? engagements.filter((e) => e.clientId === form.clientId)
    : engagements;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Basic info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Opportunity Details</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Title *</label>
            <input required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Corporate BD Outreach for Paras Orthocare" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description *</label>
            <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What are agents selling? Who is the target?" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Product Type *</label>
              <input required value={form.productType} onChange={(e) => update("productType", e.target.value)} placeholder="e.g. Corporate Wellness Package" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Max Agents</label>
              <input type="number" value={form.maxAgents} onChange={(e) => update("maxAgents", e.target.value)} placeholder="Unlimited" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Client & Engagement */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Client & Engagement</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Client</label>
              <select value={form.clientId} onChange={(e) => update("clientId", e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20">
                <option value="">Select client (or type name below)</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Client Name *</label>
              <input required value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="e.g. Dr. Kumar / Paras Orthocare" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Linked Engagement</label>
            <select value={form.engagementId} onChange={(e) => update("engagementId", e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20">
              <option value="">None</option>
              {filteredEngagements.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Commission */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Commission Structure</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Commission Type *</label>
              <select value={form.commissionType} onChange={(e) => update("commissionType", e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20">
                {COMMISSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                {form.commissionType === "PERCENTAGE" ? "Commission %" : "Commission Amount (NGN)"} *
              </label>
              <input required type="number" step="0.01" value={form.commissionValue} onChange={(e) => update("commissionValue", e.target.value)} placeholder={form.commissionType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500000"} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Expected Min Deal Value</label>
              <input type="number" value={form.expectedDealValueMin} onChange={(e) => update("expectedDealValueMin", e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Expected Max Deal Value</label>
              <input type="number" value={form.expectedDealValueMax} onChange={(e) => update("expectedDealValueMax", e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Targeting */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Targeting</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Territories</label>
            <div className="flex flex-wrap gap-2">
              {TERRITORIES.map((t) => (
                <button key={t} type="button" onClick={() => toggle(territories, setTerritories, t)} className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${territories.includes(t) ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`} style={territories.includes(t) ? { background: "#0F2744" } : {}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Target Industries</label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <button key={ind} type="button" onClick={() => toggle(targetIndustries, setTargetIndustries, ind)} className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${targetIndustries.includes(ind) ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`} style={targetIndustries.includes(ind) ? { background: "#0F2744" } : {}}>
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Timeline</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Start Date *</label>
            <input required type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">End Date</label>
            <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-50" style={{ background: "#0F2744" }}>
          {loading ? "Creating..." : "Create Opportunity"}
        </button>
      </div>
    </form>
  );
}
