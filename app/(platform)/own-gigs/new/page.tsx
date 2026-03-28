"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { ArrowLeft, ArrowRight, Check, Loader2, Info } from "lucide-react";

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

const PLATFORM_FEE_PCT = 12;

const STEPS = ["Client", "Project", "Platform Fee", "Review"];

export default function NewOwnGigPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feeAccepted, setFeeAccepted] = useState(false);
  const [feePct, setFeePct] = useState(String(PLATFORM_FEE_PCT));

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

  const budget = Number(budgetAmount || 0);
  const platformFee = Math.round(budget * Number(feePct) / 100);
  const symbol = budgetCurrency === "NGN" ? "₦" : "$";

  const canNext = () => {
    if (step === 0) return clientName && clientContactName && clientEmail;
    if (step === 1) return projectName && serviceType;
    if (step === 2) return feeAccepted;
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
          budgetAmount: budget,
          budgetCurrency,
          feeModel: "PERCENTAGE",
          feePct: Number(feePct),
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

          {/* Step 2: Platform Fee */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-[#0F2744]">Platform Fee</h2>
              <p className="text-sm text-slate-500">
                CFA provides the tools, client portal, EM oversight, and operational support for your gig.
                The standard rate is {PLATFORM_FEE_PCT}%. You may propose a different rate within the allowed range.
              </p>

              <div
                className="rounded-xl p-5 space-y-4"
                style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Your proposed rate</span>
                  <span className="text-base font-bold text-[#0F2744]">{feePct}%</span>
                </div>
                <input
                  type="range" min="10" max="15" step="0.5"
                  value={feePct}
                  onChange={(e) => setFeePct(e.target.value)}
                  className="w-full accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>10%</span>
                  <span className="font-semibold text-[#D4AF37]">{PLATFORM_FEE_PCT}% standard</span>
                  <span>15%</span>
                </div>
                {budget > 0 && (
                  <>
                    <div className="h-px" style={{ background: "#e5eaf0" }} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Project budget</span>
                      <span className="text-sm font-semibold text-slate-800">{symbol}{budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">Platform fee</span>
                      <span className="text-base font-bold" style={{ color: "#D4AF37" }}>{symbol}{platformFee.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {Number(feePct) < PLATFORM_FEE_PCT && (
                  <p className="text-xs text-amber-600">
                    Below standard rate. Subject to approval by CFA.
                  </p>
                )}
              </div>

              <div
                className="flex items-start gap-2.5 rounded-lg p-3 text-xs text-slate-500"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
              >
                <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#3B82F6" }} />
                <span>
                  This covers your assigned EM, client portal access, project tools, quality assurance,
                  and CFA branding. The fee is deducted from project payments before consultant payouts.
                </span>
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={feeAccepted}
                  onChange={(e) => setFeeAccepted(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#D4AF37]"
                />
                <span className="text-sm text-slate-700">I accept the platform fee terms</span>
              </label>
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
                    {symbol}{budget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Platform Fee</p>
                  <p className="font-medium text-[#0F2744]">
                    {feePct}%{budget > 0 ? ` (${symbol}${platformFee.toLocaleString()})` : ""}
                    {Number(feePct) < PLATFORM_FEE_PCT && <span className="text-xs text-amber-600 ml-1">(pending approval)</span>}
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
