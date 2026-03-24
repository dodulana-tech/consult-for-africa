"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  Target,
  Repeat,
  TrendingUp,
  Layers,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Milestone {
  key: string;
  name: string;
  amount: string;
  dueDate: string;
}

interface BillingScheduleData {
  id?: string;
  feeStructure: string;
  billingCycle: string;
  totalContractValue: string;
  currency: string;
  mobilizationPct: string;
  mobilizationFixed: string;
  holdbackPct: string;
  successFeePct: string;
  successFeeTrigger: string;
  retainerAmount: string;
  paymentTermsDays: string;
  taxRatePct: string;
  whtRatePct: string;
  notes: string;
  milestones: Milestone[];
}

interface Props {
  engagementId: string;
  existingSchedule?: BillingScheduleData | null;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const FEE_STRUCTURES = [
  {
    value: "FIXED_FEE",
    label: "Fixed Fee",
    description: "Agreed total fee for the engagement, invoiced per schedule",
    icon: DollarSign,
  },
  {
    value: "TIME_AND_MATERIALS",
    label: "Time & Materials",
    description: "Billed based on actual time spent at agreed rates",
    icon: Clock,
  },
  {
    value: "RETAINER",
    label: "Retainer",
    description: "Monthly recurring fee with hours pool",
    icon: Repeat,
  },
  {
    value: "SUCCESS_FEE",
    label: "Success Fee",
    description: "Fee contingent on achieving defined outcomes",
    icon: Target,
  },
  {
    value: "MILESTONE_BASED",
    label: "Milestone Based",
    description: "Payments tied to project milestone completion",
    icon: TrendingUp,
  },
  {
    value: "HYBRID",
    label: "Hybrid",
    description: "Combination of fee structures",
    icon: Layers,
  },
];

const BILLING_CYCLES = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ON_MILESTONE", label: "On Milestone" },
  { value: "ON_COMPLETION", label: "On Completion" },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function genKey() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultForm(): BillingScheduleData {
  return {
    feeStructure: "FIXED_FEE",
    billingCycle: "ONE_TIME",
    totalContractValue: "",
    currency: "NGN",
    mobilizationPct: "",
    mobilizationFixed: "",
    holdbackPct: "",
    successFeePct: "",
    successFeeTrigger: "",
    retainerAmount: "",
    paymentTermsDays: "30",
    taxRatePct: "0",
    whtRatePct: "0",
    notes: "",
    milestones: [],
  };
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function BillingScheduleConfig({ engagementId, existingSchedule }: Props) {
  const [form, setForm] = useState<BillingScheduleData>(existingSchedule ?? defaultForm());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateField(field: keyof BillingScheduleData, value: string) {
    setForm({ ...form, [field]: value });
    setSaved(false);
  }

  function addMilestone() {
    setForm({
      ...form,
      milestones: [...form.milestones, { key: genKey(), name: "", amount: "", dueDate: "" }],
    });
  }

  function updateMilestone(key: string, field: keyof Milestone, value: string) {
    setForm({
      ...form,
      milestones: form.milestones.map((m) => m.key === key ? { ...m, [field]: value } : m),
    });
    setSaved(false);
  }

  function removeMilestone(key: string) {
    setForm({ ...form, milestones: form.milestones.filter((m) => m.key !== key) });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        engagementId,
        ...form,
        totalContractValue: parseFloat(form.totalContractValue) || 0,
        mobilizationPct: form.mobilizationPct ? parseFloat(form.mobilizationPct) : null,
        mobilizationFixed: form.mobilizationFixed ? parseFloat(form.mobilizationFixed) : null,
        holdbackPct: form.holdbackPct ? parseFloat(form.holdbackPct) : null,
        successFeePct: form.successFeePct ? parseFloat(form.successFeePct) : null,
        retainerAmount: form.retainerAmount ? parseFloat(form.retainerAmount) : null,
        paymentTermsDays: parseInt(form.paymentTermsDays) || 30,
        taxRatePct: parseFloat(form.taxRatePct) || 0,
        whtRatePct: parseFloat(form.whtRatePct) || 0,
        milestones: form.milestones.map((m) => ({
          name: m.name,
          amount: parseFloat(m.amount) || 0,
          dueDate: m.dueDate || null,
        })),
      };

      const url = form.id
        ? `/api/finance/billing-schedules/${form.id}`
        : "/api/finance/billing-schedules";

      const res = await fetch(url, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, id: data.id }));
        setSaved(true);
      }
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  const structure = form.feeStructure;

  return (
    <div className="space-y-6">
      {/* ─── Fee Structure Selector ───────────────────────────────────── */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Fee Structure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEE_STRUCTURES.map((fs) => {
            const active = form.feeStructure === fs.value;
            return (
              <button
                key={fs.value}
                onClick={() => updateField("feeStructure", fs.value)}
                className="flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  border: `2px solid ${active ? "#D4AF37" : "#e5eaf0"}`,
                  background: active ? "#FFFBEB" : "#fff",
                }}
              >
                <fs.icon
                  size={18}
                  className="shrink-0 mt-0.5"
                  style={{ color: active ? "#D4AF37" : "#94A3B8" }}
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: active ? "#0F2744" : "#374151" }}>{fs.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fs.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Dynamic Form ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Total Contract Value (always shown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Contract Value</label>
            <input
              type="number"
              step="0.01"
              value={form.totalContractValue}
              onChange={(e) => updateField("totalContractValue", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="0.00"
            />
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
            <select
              value={form.billingCycle}
              onChange={(e) => updateField("billingCycle", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {BILLING_CYCLES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* FIXED_FEE fields */}
          {(structure === "FIXED_FEE" || structure === "HYBRID") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobilization (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.mobilizationPct}
                  onChange={(e) => updateField("mobilizationPct", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holdback (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.holdbackPct}
                  onChange={(e) => updateField("holdbackPct", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 10"
                />
              </div>
            </>
          )}

          {/* TIME_AND_MATERIALS fields */}
          {(structure === "TIME_AND_MATERIALS" || structure === "HYBRID") && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 italic">Rates are configured at the consultant assignment level. Billing cycle above determines invoicing frequency.</p>
            </div>
          )}

          {/* RETAINER fields */}
          {(structure === "RETAINER" || structure === "HYBRID") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Retainer Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.retainerAmount}
                onChange={(e) => updateField("retainerAmount", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="0.00"
              />
            </div>
          )}

          {/* SUCCESS_FEE fields */}
          {(structure === "SUCCESS_FEE" || structure === "HYBRID") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Success Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.successFeePct}
                  onChange={(e) => updateField("successFeePct", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Success Fee Trigger</label>
                <input
                  type="text"
                  value={form.successFeeTrigger}
                  onChange={(e) => updateField("successFeeTrigger", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Describe the trigger condition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upfront Retainer (Mobilization %)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.mobilizationPct}
                  onChange={(e) => updateField("mobilizationPct", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 20"
                />
              </div>
            </>
          )}
        </div>

        {/* MILESTONE_BASED builder */}
        {(structure === "MILESTONE_BASED" || structure === "HYBRID") && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Milestones</label>
              <button
                onClick={addMilestone}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                <Plus size={14} />
                Add Milestone
              </button>
            </div>
            {form.milestones.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">No milestones added. Click "Add Milestone" to define payment milestones.</p>
            ) : (
              <div className="space-y-3">
                {form.milestones.map((m, i) => (
                  <div key={m.key} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="sm:col-span-5">
                      <label className="sm:hidden text-xs text-gray-500 mb-0.5 block">Milestone Name</label>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => updateMilestone(m.key, "name", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none"
                        placeholder={`Milestone ${i + 1}`}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="sm:hidden text-xs text-gray-500 mb-0.5 block">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={m.amount}
                        onChange={(e) => updateMilestone(m.key, "amount", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none text-right"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="sm:hidden text-xs text-gray-500 mb-0.5 block">Due Date</label>
                      <input
                        type="date"
                        value={m.dueDate}
                        onChange={(e) => updateMilestone(m.key, "dueDate", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-center justify-end">
                      <button
                        onClick={() => removeMilestone(m.key)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Terms ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment Terms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
            <input
              type="number"
              value={form.paymentTermsDays}
              onChange={(e) => updateField("paymentTermsDays", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (% VAT)</label>
            <input
              type="number"
              step="0.01"
              value={form.taxRatePct}
              onChange={(e) => updateField("taxRatePct", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WHT Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.whtRatePct}
              onChange={(e) => updateField("whtRatePct", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={2}
            placeholder="Additional billing notes..."
          />
        </div>
      </div>

      {/* ─── Save ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        {saved && <span className="text-sm text-green-600 self-center">Saved successfully</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: "#0F2744" }}
        >
          <Save size={15} />
          {saving ? "Saving..." : form.id ? "Update Schedule" : "Create Schedule"}
        </button>
      </div>
    </div>
  );
}
