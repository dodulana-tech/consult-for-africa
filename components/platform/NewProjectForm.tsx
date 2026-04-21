"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronDown, Library } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

type Client = { id: string; name: string; currency: string };
type EM = { id: string; name: string };
type Methodology = { id: string; name: string; category: string; estimatedWeeks: number; phases: { name: string }[] };

interface Props {
  clients: Client[];
  engagementManagers: EM[];
  userRole: string;
  userId: string;
}

const SERVICE_TYPES = [
  { value: "HOSPITAL_OPERATIONS", label: "Hospital Operations" },
  { value: "TURNAROUND", label: "Turnaround & Recovery" },
  { value: "EMBEDDED_LEADERSHIP", label: "Embedded Leadership" },
  { value: "CLINICAL_GOVERNANCE", label: "Clinical Governance" },
  { value: "DIGITAL_HEALTH", label: "Digital Health" },
  { value: "HEALTH_SYSTEMS", label: "Health Systems" },
  { value: "DIASPORA_EXPERTISE", label: "Diaspora Expertise" },
  { value: "EM_AS_SERVICE", label: "EM as a Service" },
];

const ENGAGEMENT_TYPES = [
  { value: "PROJECT", label: "Project", color: "#3B82F6", desc: "Defined scope, fixed fee, clear deliverables" },
  { value: "RETAINER", label: "Retainer", color: "#8B5CF6", desc: "Rolling monthly advisory, hours pool" },
  { value: "SECONDMENT", label: "Secondment", color: "#14B8A6", desc: "Named individual placed inside client org" },
  { value: "FRACTIONAL", label: "Fractional", color: "#F97316", desc: "External executive placement, broker arrangement" },
  { value: "TRANSFORMATION", label: "Transformation", color: "#22C55E", desc: "Equity-based hospital turnaround" },
  { value: "TRANSACTION", label: "Transaction", color: "#EAB308", desc: "M&A mandate or fundraise advisory" },
];

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

export default function NewProjectForm({ clients, engagementManagers, userRole, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(userRole);

  const [form, setForm] = useState({
    engagementType: "PROJECT",
    clientId: "",
    engagementManagerId: isElevated ? "" : userId,
    name: "",
    description: "",
    serviceType: "",
    budgetAmount: "",
    budgetCurrency: "NGN",
    startDate: "",
    endDate: "",
    methodologyId: "",
    budgetSensitivity: "STANDARD",
    consultantTierMin: "STANDARD",
    consultantTierMax: "EXPERIENCED",
    internEligible: false,
    pricingNotes: "",
    // RETAINER
    retainerMonthlyFee: "",
    retainerHoursPool: "",
    retainerAutoRenew: false,
    retainerNoticePeriodDays: "",
    // SECONDMENT
    secondeeMonthlyFee: "",
    secondeeClientLineManager: "",
    secondeeRecallClauseDays: "30",
    // FRACTIONAL
    fractionalPlacedName: "",
    fractionalRoleTitle: "",
    fractionalCommissionPct: "",
    fractionalArrangementFee: "",
    // TRANSFORMATION
    transformEquityPct: "",
    transformDealStructure: "",
    transformEntryValuation: "",
    transformBoardSeat: false,
    transformStepInTrigger: "2",
    transformExitMonths: "",
    // TRANSACTION
    transactionMandateType: "",
    transactionTargetCompany: "",
    transactionDealSize: "",
    transactionSuccessFeePct: "",
    transactionUpfrontRetainer: "",
  });

  // Fetch methodologies when modal opens
  useEffect(() => {
    if (open && methodologies.length === 0) {
      fetch("/api/methodologies")
        .then((r) => r.json())
        .then((d) => setMethodologies(d.methodologies ?? []))
        .catch(() => {});
    }
  }, [open, methodologies.length]);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    // auto-fill currency from client
    if (key === "clientId" && typeof value === "string") {
      const c = clients.find((x) => x.id === value);
      if (c) setForm((f) => ({ ...f, clientId: value, budgetCurrency: c.currency }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.name || !form.serviceType) {
      setError("Client, engagement name, and service type are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        engagementType: form.engagementType,
        clientId: form.clientId,
        name: form.name,
        serviceType: form.serviceType,
        engagementManagerId: form.engagementManagerId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        description: form.description || undefined,
      };

      if (form.engagementType === "PROJECT") {
        body.budgetAmount = form.budgetAmount ? Number(form.budgetAmount) : 0;
        body.budgetCurrency = form.budgetCurrency;
        body.methodologyId = form.methodologyId || undefined;
        body.budgetSensitivity = form.budgetSensitivity;
        body.consultantTierMin = form.consultantTierMin;
        body.consultantTierMax = form.consultantTierMax;
        body.internEligible = form.internEligible;
        body.pricingNotes = form.pricingNotes || undefined;
      }

      if (form.engagementType === "RETAINER") {
        body.retainerMonthlyFee = form.retainerMonthlyFee ? Number(form.retainerMonthlyFee) : undefined;
        body.retainerHoursPool = form.retainerHoursPool ? Number(form.retainerHoursPool) : undefined;
        body.retainerAutoRenew = form.retainerAutoRenew;
        body.retainerNoticePeriodDays = form.retainerNoticePeriodDays ? Number(form.retainerNoticePeriodDays) : undefined;
        body.budgetCurrency = form.budgetCurrency;
      }

      if (form.engagementType === "SECONDMENT") {
        body.secondeeMonthlyFee = form.secondeeMonthlyFee ? Number(form.secondeeMonthlyFee) : undefined;
        body.secondeeClientLineManager = form.secondeeClientLineManager || undefined;
        body.secondeeRecallClauseDays = form.secondeeRecallClauseDays ? Number(form.secondeeRecallClauseDays) : undefined;
        body.budgetCurrency = form.budgetCurrency;
      }

      if (form.engagementType === "FRACTIONAL") {
        body.fractionalPlacedName = form.fractionalPlacedName || undefined;
        body.fractionalRoleTitle = form.fractionalRoleTitle || undefined;
        body.fractionalCommissionPct = form.fractionalCommissionPct ? Number(form.fractionalCommissionPct) : undefined;
        body.fractionalArrangementFee = form.fractionalArrangementFee ? Number(form.fractionalArrangementFee) : undefined;
        body.budgetCurrency = form.budgetCurrency;
      }

      if (form.engagementType === "TRANSFORMATION") {
        body.transformEquityPct = form.transformEquityPct ? Number(form.transformEquityPct) : undefined;
        body.transformDealStructure = form.transformDealStructure || undefined;
        body.transformEntryValuation = form.transformEntryValuation ? Number(form.transformEntryValuation) : undefined;
        body.transformBoardSeat = form.transformBoardSeat;
        body.transformStepInTrigger = form.transformStepInTrigger ? Number(form.transformStepInTrigger) : undefined;
        body.transformExitMonths = form.transformExitMonths ? Number(form.transformExitMonths) : undefined;
        body.budgetCurrency = form.budgetCurrency;
      }

      if (form.engagementType === "TRANSACTION") {
        body.transactionMandateType = form.transactionMandateType || undefined;
        body.transactionTargetCompany = form.transactionTargetCompany || undefined;
        body.transactionDealSize = form.transactionDealSize ? Number(form.transactionDealSize) : undefined;
        body.transactionSuccessFeePct = form.transactionSuccessFeePct ? Number(form.transactionSuccessFeePct) : undefined;
        body.transactionUpfrontRetainer = form.transactionUpfrontRetainer ? Number(form.transactionUpfrontRetainer) : undefined;
        body.budgetCurrency = form.budgetCurrency;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Failed to create engagement."));
        return;
      }
      const project = await res.json();
      setOpen(false);
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
        style={{ background: "#0F2744" }}
      >
        <Plus size={13} />
        New Engagement
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl w-full max-w-lg sm:max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
              <h2 className="text-sm font-semibold text-gray-900">New Engagement</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
              {error && (
                <div className="text-xs text-red-600 px-3 py-2 rounded-lg" style={{ background: "#FEF2F2" }}>
                  {error}
                </div>
              )}

              {/* Engagement Type Selector */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Engagement Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ENGAGEMENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("engagementType", t.value)}
                      className="text-left rounded-lg border px-3 py-2 transition-all"
                      style={{
                        borderColor: form.engagementType === t.value ? t.color : "#e5eaf0",
                        borderWidth: form.engagementType === t.value ? 2 : 1,
                        background: form.engagementType === t.value ? `${t.color}08` : "#fff",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: t.color }}
                        />
                        <span className="text-xs font-semibold text-gray-900">{t.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 ml-4">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Engagement Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Lagoon Hospital OPD Turnaround"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Client</label>
                  <div className="relative">
                    <select
                      value={form.clientId}
                      onChange={(e) => set("clientId", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      <option value="">Select client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Service Type</label>
                  <div className="relative">
                    <select
                      value={form.serviceType}
                      onChange={(e) => set("serviceType", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      <option value="">Select type</option>
                      {SERVICE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {isElevated && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Engagement Manager</label>
                    <div className="relative">
                      <select
                        value={form.engagementManagerId}
                        onChange={(e) => set("engagementManagerId", e.target.value)}
                        className={`${inputClass} appearance-none pr-8`}
                        style={inputStyle}
                      >
                        <option value="">Unassigned</option>
                        {engagementManagers.map((em) => (
                          <option key={em.id} value={em.id}>{em.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    End Date{form.engagementType === "RETAINER" && <span className="font-normal text-gray-400"> (optional)</span>}
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    placeholder="Brief scope and objectives..."
                    className={`${inputClass} resize-none`}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* ======== TYPE-SPECIFIC FIELDS ======== */}

              {/* PROJECT: Budget, Methodology, Pricing & Staffing */}
              {form.engagementType === "PROJECT" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Budget</label>
                      <input
                        type="number"
                        value={form.budgetAmount}
                        onChange={(e) => set("budgetAmount", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                      <div className="relative">
                        <select
                          value={form.budgetCurrency}
                          onChange={(e) => set("budgetCurrency", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {methodologies.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1 flex items-center gap-1.5">
                        <Library size={11} className="text-gray-400" />
                        Methodology <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.methodologyId}
                          onChange={(e) => set("methodologyId", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="">No methodology selected</option>
                          {methodologies.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.phases.length} phases, ~{m.estimatedWeeks}w)
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {form.methodologyId && (() => {
                        const m = methodologies.find((x) => x.id === form.methodologyId);
                        return m ? (
                          <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                            Phases will be auto-generated: {m.phases.map((p) => p.name).join(" > ")}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Pricing & Staffing Constraints */}
                  <div className="pt-2 border-t" style={{ borderColor: "#e5eaf0" }}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Pricing & Staffing</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Budget Sensitivity</label>
                        <select value={form.budgetSensitivity} onChange={(e) => set("budgetSensitivity", e.target.value)} className={inputClass} style={inputStyle}>
                          <option value="PREMIUM">Premium (full rates)</option>
                          <option value="STANDARD">Standard</option>
                          <option value="VALUE">Value (competitive)</option>
                          <option value="BUDGET">Budget (lean team)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 pt-4">
                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={form.internEligible} onChange={(e) => setForm((f) => ({ ...f, internEligible: e.target.checked }))} className="rounded border-gray-300" />
                          Intern/Emerging eligible
                        </label>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Min Consultant Tier</label>
                        <select value={form.consultantTierMin} onChange={(e) => set("consultantTierMin", e.target.value)} className={inputClass} style={inputStyle}>
                          <option value="INTERN">Intern</option>
                          <option value="EMERGING">Emerging</option>
                          <option value="STANDARD">Standard</option>
                          <option value="EXPERIENCED">Experienced</option>
                          <option value="ELITE">Elite</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Max Consultant Tier</label>
                        <select value={form.consultantTierMax} onChange={(e) => set("consultantTierMax", e.target.value)} className={inputClass} style={inputStyle}>
                          <option value="EMERGING">Emerging</option>
                          <option value="STANDARD">Standard</option>
                          <option value="EXPERIENCED">Experienced</option>
                          <option value="ELITE">Elite</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RETAINER fields */}
              {form.engagementType === "RETAINER" && (
                <div className="pt-2 border-t" style={{ borderColor: "#e5eaf0" }}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Retainer Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Monthly Fee</label>
                      <input
                        type="number"
                        value={form.retainerMonthlyFee}
                        onChange={(e) => set("retainerMonthlyFee", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Hours Pool (monthly)</label>
                      <input
                        type="number"
                        value={form.retainerHoursPool}
                        onChange={(e) => set("retainerHoursPool", e.target.value)}
                        placeholder="e.g. 40"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Notice Period (days)</label>
                      <input
                        type="number"
                        value={form.retainerNoticePeriodDays}
                        onChange={(e) => set("retainerNoticePeriodDays", e.target.value)}
                        placeholder="30"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-4">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={form.retainerAutoRenew} onChange={(e) => setForm((f) => ({ ...f, retainerAutoRenew: e.target.checked }))} className="rounded border-gray-300" />
                        Auto-renew monthly
                      </label>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                      <div className="relative">
                        <select
                          value={form.budgetCurrency}
                          onChange={(e) => set("budgetCurrency", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECONDMENT fields */}
              {form.engagementType === "SECONDMENT" && (
                <div className="pt-2 border-t" style={{ borderColor: "#e5eaf0" }}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Secondment Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Monthly Fee</label>
                      <input
                        type="number"
                        value={form.secondeeMonthlyFee}
                        onChange={(e) => set("secondeeMonthlyFee", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                      <div className="relative">
                        <select
                          value={form.budgetCurrency}
                          onChange={(e) => set("budgetCurrency", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Client Line Manager</label>
                      <input
                        type="text"
                        value={form.secondeeClientLineManager}
                        onChange={(e) => set("secondeeClientLineManager", e.target.value)}
                        placeholder="Name of reporting manager"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Recall Clause (days)</label>
                      <input
                        type="number"
                        value={form.secondeeRecallClauseDays}
                        onChange={(e) => set("secondeeRecallClauseDays", e.target.value)}
                        placeholder="30"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FRACTIONAL fields */}
              {form.engagementType === "FRACTIONAL" && (
                <div className="pt-2 border-t" style={{ borderColor: "#e5eaf0" }}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Fractional Placement Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Placed Individual Name</label>
                      <input
                        type="text"
                        value={form.fractionalPlacedName}
                        onChange={(e) => set("fractionalPlacedName", e.target.value)}
                        placeholder="Full name"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Role Title</label>
                      <input
                        type="text"
                        value={form.fractionalRoleTitle}
                        onChange={(e) => set("fractionalRoleTitle", e.target.value)}
                        placeholder="e.g. Fractional CMO"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Commission (%)</label>
                      <input
                        type="number"
                        value={form.fractionalCommissionPct}
                        onChange={(e) => set("fractionalCommissionPct", e.target.value)}
                        placeholder="e.g. 15"
                        min={0}
                        max={100}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Arrangement Fee (monthly)</label>
                      <input
                        type="number"
                        value={form.fractionalArrangementFee}
                        onChange={(e) => set("fractionalArrangementFee", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                      <div className="relative">
                        <select
                          value={form.budgetCurrency}
                          onChange={(e) => set("budgetCurrency", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-2 px-2 py-1.5 rounded" style={{ background: "#FFFBEB" }}>
                    Placed individual is not a C4A employee. Arrangement is broker-only.
                  </p>
                </div>
              )}

              {/* TRANSFORMATION fields */}
              {form.engagementType === "TRANSFORMATION" && (
                <div className="pt-2 border-t" style={{ borderColor: "#e5eaf0" }}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Transformation Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Equity Stake (%)</label>
                      <input
                        type="number"
                        value={form.transformEquityPct}
                        onChange={(e) => set("transformEquityPct", e.target.value)}
                        placeholder="e.g. 25"
                        min={0}
                        max={100}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Deal Structure</label>
                      <div className="relative">
                        <select
                          value={form.transformDealStructure}
                          onChange={(e) => set("transformDealStructure", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="">Select structure</option>
                          <option value="SWEAT">Sweat Equity</option>
                          <option value="CAPITAL">Capital Investment</option>
                          <option value="HYBRID">Hybrid</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Entry Valuation</label>
                      <input
                        type="number"
                        value={form.transformEntryValuation}
                        onChange={(e) => set("transformEntryValuation", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                      <div className="relative">
                        <select
                          value={form.budgetCurrency}
                          onChange={(e) => set("budgetCurrency", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Step-in Trigger (missed KPI months)</label>
                      <input
                        type="number"
                        value={form.transformStepInTrigger}
                        onChange={(e) => set("transformStepInTrigger", e.target.value)}
                        placeholder="2"
                        min={1}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Exit Timeline (months)</label>
                      <input
                        type="number"
                        value={form.transformExitMonths}
                        onChange={(e) => set("transformExitMonths", e.target.value)}
                        placeholder="e.g. 36"
                        min={1}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={form.transformBoardSeat} onChange={(e) => setForm((f) => ({ ...f, transformBoardSeat: e.target.checked }))} className="rounded border-gray-300" />
                        Board seat required
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSACTION fields */}
              {form.engagementType === "TRANSACTION" && (
                <div className="pt-2 border-t" style={{ borderColor: "#e5eaf0" }}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Transaction Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Mandate Type</label>
                      <div className="relative">
                        <select
                          value={form.transactionMandateType}
                          onChange={(e) => set("transactionMandateType", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="">Select mandate</option>
                          <option value="SELL_SIDE">Sell-side</option>
                          <option value="BUY_SIDE">Buy-side</option>
                          <option value="FUNDRAISE">Fundraise</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Target Company</label>
                      <input
                        type="text"
                        value={form.transactionTargetCompany}
                        onChange={(e) => set("transactionTargetCompany", e.target.value)}
                        placeholder="Company name"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Deal Size</label>
                      <input
                        type="number"
                        value={form.transactionDealSize}
                        onChange={(e) => set("transactionDealSize", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Success Fee (%)</label>
                      <input
                        type="number"
                        value={form.transactionSuccessFeePct}
                        onChange={(e) => set("transactionSuccessFeePct", e.target.value)}
                        placeholder="e.g. 3"
                        min={0}
                        max={100}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Upfront Retainer</label>
                      <input
                        type="number"
                        value={form.transactionUpfrontRetainer}
                        onChange={(e) => set("transactionUpfrontRetainer", e.target.value)}
                        placeholder="0"
                        min={0}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
                      <div className="relative">
                        <select
                          value={form.budgetCurrency}
                          onChange={(e) => set("budgetCurrency", e.target.value)}
                          className={`${inputClass} appearance-none pr-8`}
                          style={inputStyle}
                        >
                          <option value="NGN">NGN</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  {form.transactionDealSize && form.transactionSuccessFeePct && (
                    <p className="text-[10px] text-gray-500 mt-2">
                      Estimated success fee: {(Number(form.transactionDealSize) * Number(form.transactionSuccessFeePct) / 100).toLocaleString()} (calculated on close)
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "#0F2744" }}
                >
                  {loading ? "Creating..." : "Create Engagement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
