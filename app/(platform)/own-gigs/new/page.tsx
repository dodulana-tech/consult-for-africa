"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

const SERVICE_TYPES = [
  { value: "HOSPITAL_OPERATIONS", label: "Hospital Operations" },
  { value: "TURNAROUND", label: "Turnaround" },
  { value: "EMBEDDED_LEADERSHIP", label: "Embedded Leadership" },
  { value: "CLINICAL_GOVERNANCE", label: "Clinical Governance" },
  { value: "DIGITAL_HEALTH", label: "Digital Health" },
  { value: "HEALTH_SYSTEMS", label: "Health Systems" },
  { value: "DIASPORA_EXPERTISE", label: "Diaspora Expertise" },
  { value: "EM_AS_SERVICE", label: "EM as a Service" },
];

const ENGAGEMENT_TYPES = [
  { value: "PROJECT", label: "Project" },
  { value: "RETAINER", label: "Retainer" },
];

const STEPS = ["Client", "Project", "Fee Model", "Review"];

export default function NewOwnGigPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Client fields
  const [clientName, setClientName] = useState("");
  const [clientContactName, setClientContactName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Project fields
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("HOSPITAL_OPERATIONS");
  const [engagementType, setEngagementType] = useState("PROJECT");
  const [startDate, setStartDate] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("NGN");

  // Fee fields
  const [feeModel, setFeeModel] = useState<"PERCENTAGE" | "FLAT_MONTHLY">("PERCENTAGE");
  const [feePct, setFeePct] = useState("12");
  const [flatMonthlyFee, setFlatMonthlyFee] = useState("");

  const canNext = () => {
    if (step === 0) return clientName && clientContactName && clientEmail;
    if (step === 1) return projectName && serviceType;
    if (step === 2) {
      if (feeModel === "PERCENTAGE") return Number(feePct) >= 10 && Number(feePct) <= 15;
      return Number(flatMonthlyFee) > 0;
    }
    return true;
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/own-gig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName, clientEmail, clientPhone, clientContactName,
          projectName, description, serviceType, engagementType,
          startDate: startDate || undefined,
          budgetAmount: budgetAmount ? Number(budgetAmount) : 0,
          budgetCurrency,
          feeModel,
          feePct: feeModel === "PERCENTAGE" ? Number(feePct) : undefined,
          flatMonthlyFee: feeModel === "FLAT_MONTHLY" ? Number(flatMonthlyFee) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create gig");
      }

      const gig = await res.json();
      router.push(`/projects/${gig.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1.5";

  return (
    <>
      <TopBar title="New Own Gig" subtitle="Set up a project for your own client" />

      <div className="p-6 max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${
                  i < step ? "bg-green-100 text-green-700"
                    : i === step ? "bg-[#0F2744] text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "font-semibold text-[#0F2744]" : "text-slate-400"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {/* Step 0: Client */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0F2744]">Client Details</h2>
              <div>
                <label className={labelCls}>Organisation / Client Name *</label>
                <input className={inputCls} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Healthcare" />
              </div>
              <div>
                <label className={labelCls}>Contact Person Name *</label>
                <input className={inputCls} value={clientContactName} onChange={(e) => setClientContactName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input className={inputCls} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="jane@acme.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+234..." />
              </div>
            </div>
          )}

          {/* Step 1: Project */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0F2744]">Project Details</h2>
              <div>
                <label className={labelCls}>Project Name *</label>
                <input className={inputCls} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Operational Review Q2" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={inputCls} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief scope..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Service Type *</label>
                  <select className={inputCls} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    {SERVICE_TYPES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Engagement Type</label>
                  <select className={inputCls} value={engagementType} onChange={(e) => setEngagementType(e.target.value)}>
                    {ENGAGEMENT_TYPES.map((et) => <option key={et.value} value={et.value}>{et.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input className={inputCls} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Budget</label>
                  <input className={inputCls} type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="5000000" />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select className={inputCls} value={budgetCurrency} onChange={(e) => setBudgetCurrency(e.target.value)}>
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fee Model */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#0F2744]">Platform Fee Model</h2>
              <p className="text-sm text-slate-500">Choose how CFA earns from this engagement. You get the tools, portal, and EM oversight.</p>

              <div className="space-y-3">
                <label
                  className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition ${
                    feeModel === "PERCENTAGE" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="feeModel"
                    checked={feeModel === "PERCENTAGE"}
                    onChange={() => setFeeModel("PERCENTAGE")}
                    className="mt-1 accent-[#D4AF37]"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#0F2744]">Percentage of project value</p>
                    <p className="text-xs text-slate-500 mt-0.5">CFA takes 10-15% of the total project budget</p>
                    {feeModel === "PERCENTAGE" && (
                      <div className="mt-3">
                        <label className="text-xs text-slate-500">Fee percentage: {feePct}%</label>
                        <input
                          type="range" min="10" max="15" step="0.5"
                          value={feePct}
                          onChange={(e) => setFeePct(e.target.value)}
                          className="w-full mt-1 accent-[#D4AF37]"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>10%</span>
                          <span>15%</span>
                        </div>
                        {budgetAmount && (
                          <p className="text-xs text-[#D4AF37] font-medium mt-2">
                            CFA fee: {budgetCurrency === "NGN" ? "₦" : "$"}
                            {(Number(budgetAmount) * Number(feePct) / 100).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition ${
                    feeModel === "FLAT_MONTHLY" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="feeModel"
                    checked={feeModel === "FLAT_MONTHLY"}
                    onChange={() => setFeeModel("FLAT_MONTHLY")}
                    className="mt-1 accent-[#D4AF37]"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#0F2744]">Flat monthly fee</p>
                    <p className="text-xs text-slate-500 mt-0.5">Fixed monthly amount regardless of project value</p>
                    {feeModel === "FLAT_MONTHLY" && (
                      <div className="mt-3">
                        <label className="text-xs text-slate-500">Monthly fee ({budgetCurrency})</label>
                        <input
                          type="number"
                          className={inputCls + " mt-1"}
                          value={flatMonthlyFee}
                          onChange={(e) => setFlatMonthlyFee(e.target.value)}
                          placeholder="50000"
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0F2744]">Review &amp; Create</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Client</p>
                  <p className="font-medium text-[#0F2744]">{clientName}</p>
                  <p className="text-slate-500">{clientContactName} &middot; {clientEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Project</p>
                  <p className="font-medium text-[#0F2744]">{projectName}</p>
                  <p className="text-slate-500">{SERVICE_TYPES.find((s) => s.value === serviceType)?.label} &middot; {engagementType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Budget</p>
                  <p className="font-medium text-[#0F2744]">
                    {budgetCurrency === "NGN" ? "₦" : "$"}{Number(budgetAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Fee Model</p>
                  <p className="font-medium text-[#0F2744]">
                    {feeModel === "PERCENTAGE"
                      ? `${feePct}% of project value`
                      : `${budgetCurrency === "NGN" ? "₦" : "$"}${Number(flatMonthlyFee).toLocaleString()}/month`
                    }
                  </p>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "#0F2744" }}
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: "#0F2744" }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {submitting ? "Creating..." : "Create Gig"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
