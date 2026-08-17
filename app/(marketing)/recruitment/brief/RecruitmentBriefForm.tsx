"use client";
import { useState } from "react";

const NAVY = "#0B3C5D";
const GOLD = "#D4AF37";

const EMPLOYMENT_BASIS = ["Permanent, full time", "Permanent, part time", "Fixed term", "Interim or secondment"];
const URGENCY = ["Immediate", "Within 1 month", "Within 3 months", "No fixed deadline"];
const PNL = ["Yes, owns the P&L", "Partly, owns a cost centre", "No"];
const QUALIFICATIONS = [
  "First degree", "Master's degree", "MBA", "Medical degree (MBBS)", "Nursing (RN/RM)",
  "Pharmacy (B.Pharm)", "Accounting (ICAN/ACCA)", "Professional certification", "No formal requirement",
];
const REGISTRATION = ["MDCN", "NMCN", "PCN", "ICAN or ACCA", "Other professional body", "None required"];
const EXPERIENCE = ["3 to 5 years", "5 to 8 years", "8 to 12 years", "12 to 15 years", "15 years or more"];
const SECTORS = [
  "Hospital", "Clinic or day case", "Wellness or aesthetics", "Diagnostics or laboratory",
  "Pharmaceuticals", "HMO or insurance", "Consumer services", "Hospitality", "Outside healthcare acceptable",
];
const COMPETENCIES = [
  "Commercial and P&L ownership", "Operational discipline", "Clinical governance", "Team building and retention",
  "Turnaround and change", "Growth and business development", "Data and reporting rigour",
  "Stakeholder and board management", "Works independently with little supervision",
];
const BENEFITS = ["Health cover", "Pension", "Car or transport", "Housing", "Relocation support", "Performance bonus", "Equity or long-term incentive"];
const BUDGET_STATUS = ["Approved", "Pending approval", "To be advised"];
const SECONDMENT = ["Yes, tell me more", "No, permanent hire only", "Undecided"];
const CONFIDENTIAL = ["Open, the employer can be named", "Confidential, do not name the employer"];

interface FormData {
  organisation: string; businessUnit: string; roleTitle: string; positions: string;
  reportsTo: string; directReports: string; location: string; employmentBasis: string;
  startBy: string; urgency: string;
  ownsPnl: string; pnlScale: string; accountabilities: string; first90Days: string; successAt12Months: string;
  qualifications: string[]; registration: string; experienceYears: string; sectorExperience: string[];
  mustHave: string; niceToHave: string; dealBreakers: string; competencies: string[]; openToDiaspora: string;
  baseSalary: string; allowances: string; variablePay: string; benefits: string[];
  totalPackage: string; packageCeiling: string; budgetStatus: string; secondmentInterest: string;
  interviewers: string; processPreference: string; internalCandidates: string; confidential: string;
  blockedCompanies: string; contactName: string; email: string; phone: string;
  billingContact: string; billingEmail: string; notes: string; termsAccepted: boolean;
}

const EMPTY: FormData = {
  organisation: "", businessUnit: "", roleTitle: "", positions: "1",
  reportsTo: "", directReports: "", location: "", employmentBasis: "", startBy: "", urgency: "",
  ownsPnl: "", pnlScale: "", accountabilities: "", first90Days: "", successAt12Months: "",
  qualifications: [], registration: "", experienceYears: "", sectorExperience: [],
  mustHave: "", niceToHave: "", dealBreakers: "", competencies: [], openToDiaspora: "",
  baseSalary: "", allowances: "", variablePay: "", benefits: [],
  totalPackage: "", packageCeiling: "", budgetStatus: "", secondmentInterest: "",
  interviewers: "", processPreference: "", internalCandidates: "", confidential: "",
  blockedCompanies: "", contactName: "", email: "", phone: "",
  billingContact: "", billingEmail: "", notes: "", termsAccepted: false,
};

const STEPS = ["The role", "Accountability", "The person", "Package", "Process"];

export default function RecruitmentBriefForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }
  function pick(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }
  function toggle(field: "qualifications" | "sectorExperience" | "competencies" | "benefits", value: string) {
    setForm((p) => {
      const cur = p[field];
      return { ...p, [field]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  }

  function canAdvance(): boolean {
    if (step === 1) return !!(form.organisation.trim() && form.roleTitle.trim());
    if (step === 5) return !!(form.contactName.trim() && form.email.trim() && form.termsAccepted);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdvance()) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/recruitment/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white p-8 sm:p-10 text-center" style={{ border: "1px solid #E8EBF0" }}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.1)" }}>
          <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-900">Brief received</p>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          The engagement invoice follows within one working day. <strong className="text-gray-700">The search opens on
          receipt of funds</strong>, and you will have a written brief and a package benchmark to approve within three
          working days of that.
        </p>
        <button
          type="button"
          onClick={() => { setForm({ ...EMPTY, organisation: form.organisation, businessUnit: form.businessUnit, contactName: form.contactName, email: form.email, phone: form.phone }); setStep(1); setStatus("idle"); }}
          className="mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: NAVY }}
        >
          Submit another role
        </button>
      </div>
    );
  }

  const inputClass = "w-full rounded-lg px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 transition";
  const inputStyle = { border: "1px solid #D1D5DB", background: "#fff" } as const;
  const labelClass = "block text-sm font-medium text-gray-900 mb-1.5";
  const hintClass = "text-xs text-gray-400 mb-1.5";

  const Chips = ({ options, selected, onPick, cols = "grid-cols-2 sm:grid-cols-3" }: {
    options: string[]; selected: string[] | string; onPick: (v: string) => void; cols?: string;
  }) => (
    <div className={`grid ${cols} gap-2`}>
      {options.map((o) => {
        const on = Array.isArray(selected) ? selected.includes(o) : selected === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onPick(o)}
            className="rounded-lg px-3 py-2.5 text-xs font-medium text-left transition-all"
            style={{
              background: on ? NAVY : "#fff",
              color: on ? "#fff" : "#374151",
              border: on ? `1.5px solid ${NAVY}` : "1.5px solid #D1D5DB",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8" style={{ border: "1px solid #E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-3">
        {STEPS.map((_, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors"
                style={{ background: step >= s ? NAVY : "#F3F4F6", color: step >= s ? "#fff" : "#9CA3AF" }}
              >
                {step > s ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              {s < STEPS.length && <div className="flex-1 h-[2px] rounded-full" style={{ background: step > s ? NAVY : "#E5E7EB" }} />}
            </div>
          );
        })}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-7" style={{ color: NAVY }}>
        Step {step} of {STEPS.length}: {STEPS[step - 1]}
      </p>

      <form onSubmit={handleSubmit}>
        {/* ── 1 THE ROLE ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Organisation *</label>
                <input required name="organisation" value={form.organisation} onChange={ch} className={inputClass} style={inputStyle} placeholder="Medbury Healthcare Group" />
              </div>
              <div>
                <label className={labelClass}>Business unit or entity</label>
                <input name="businessUnit" value={form.businessUnit} onChange={ch} className={inputClass} style={inputStyle} placeholder="Medlyfe" />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Role title *</label>
                <input required name="roleTitle" value={form.roleTitle} onChange={ch} className={inputClass} style={inputStyle} placeholder="Chief Operating Officer" />
              </div>
              <div>
                <label className={labelClass}>Positions</label>
                <input name="positions" value={form.positions} onChange={ch} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Reports to</label>
                <input name="reportsTo" value={form.reportsTo} onChange={ch} className={inputClass} style={inputStyle} placeholder="Group Chief Executive" />
              </div>
              <div>
                <label className={labelClass}>Direct reports</label>
                <input name="directReports" value={form.directReports} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. 4: clinical lead, front office, finance, marketing" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Location or base</label>
                <input name="location" value={form.location} onChange={ch} className={inputClass} style={inputStyle} placeholder="Lekki, Lagos" />
              </div>
              <div>
                <label className={labelClass}>Needed by</label>
                <input name="startBy" value={form.startBy} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. 1 November" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Employment basis</label>
              <Chips options={EMPLOYMENT_BASIS} selected={form.employmentBasis} onPick={(v) => pick("employmentBasis", v)} cols="grid-cols-2 sm:grid-cols-4" />
            </div>
            <div>
              <label className={labelClass}>How urgent is it?</label>
              <Chips options={URGENCY} selected={form.urgency} onPick={(v) => pick("urgency", v)} cols="grid-cols-2 sm:grid-cols-4" />
            </div>
          </div>
        )}

        {/* ── 2 ACCOUNTABILITY ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Does the role own a P&amp;L?</label>
              <p className={hintClass}>This decides whether we search for a commercial operator or a functional manager. It is the single most important answer on this form.</p>
              <Chips options={PNL} selected={form.ownsPnl} onPick={(v) => pick("ownsPnl", v)} cols="grid-cols-1 sm:grid-cols-3" />
            </div>
            {form.ownsPnl.startsWith("Yes") && (
              <div>
                <label className={labelClass}>What is the scale of that P&amp;L?</label>
                <input name="pnlScale" value={form.pnlScale} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. NGN 400M revenue, 25 staff" />
              </div>
            )}
            <div>
              <label className={labelClass}>Key accountabilities</label>
              <textarea name="accountabilities" value={form.accountabilities} onChange={ch} rows={4} className={inputClass + " resize-none"} style={inputStyle} placeholder="What this person is on the hook for. Four or five lines is enough." />
            </div>
            <div>
              <label className={labelClass}>First 90 days: what must be true?</label>
              <textarea name="first90Days" value={form.first90Days} onChange={ch} rows={3} className={inputClass + " resize-none"} style={inputStyle} placeholder="The things you would be disappointed not to see by the end of the first quarter." />
            </div>
            <div>
              <label className={labelClass}>Success at 12 months</label>
              <textarea name="successAt12Months" value={form.successAt12Months} onChange={ch} rows={3} className={inputClass + " resize-none"} style={inputStyle} placeholder="How you will judge whether the hire worked. Numbers where you have them." />
            </div>
          </div>
        )}

        {/* ── 3 THE PERSON ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Qualifications</label>
              <Chips options={QUALIFICATIONS} selected={form.qualifications} onPick={(v) => toggle("qualifications", v)} />
            </div>
            <div>
              <label className={labelClass}>Professional registration required</label>
              <Chips options={REGISTRATION} selected={form.registration} onPick={(v) => pick("registration", v)} />
            </div>
            <div>
              <label className={labelClass}>Years of relevant experience</label>
              <Chips options={EXPERIENCE} selected={form.experienceYears} onPick={(v) => pick("experienceYears", v)} cols="grid-cols-2 sm:grid-cols-5" />
            </div>
            <div>
              <label className={labelClass}>Sector experience that counts</label>
              <Chips options={SECTORS} selected={form.sectorExperience} onPick={(v) => toggle("sectorExperience", v)} />
            </div>
            <div>
              <label className={labelClass}>Competencies to prioritise</label>
              <p className={hintClass}>Pick the three or four that matter most. These are what the shortlist assessment will test.</p>
              <Chips options={COMPETENCIES} selected={form.competencies} onPick={(v) => toggle("competencies", v)} cols="grid-cols-1 sm:grid-cols-2" />
            </div>
            <div>
              <label className={labelClass}>Must have</label>
              <textarea name="mustHave" value={form.mustHave} onChange={ch} rows={2} className={inputClass + " resize-none"} style={inputStyle} placeholder="Non-negotiable experience or attributes." />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nice to have</label>
                <textarea name="niceToHave" value={form.niceToHave} onChange={ch} rows={2} className={inputClass + " resize-none"} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>Deal breakers</label>
                <textarea name="dealBreakers" value={form.dealBreakers} onChange={ch} rows={2} className={inputClass + " resize-none"} style={inputStyle} placeholder="What would rule someone out." />
              </div>
            </div>
            <div>
              <label className={labelClass}>Open to candidates currently working abroad?</label>
              <Chips options={["Yes", "No", "Only if they relocate at their own cost"]} selected={form.openToDiaspora} onPick={(v) => pick("openToDiaspora", v)} cols="grid-cols-1 sm:grid-cols-3" />
            </div>
          </div>
        )}

        {/* ── 4 PACKAGE ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: "#F0F6FA", border: "1px solid #D6E4EE" }}>
              <p className="text-xs text-gray-600 leading-relaxed">
                The fee is <strong>15% of first-year total package</strong>, with a minimum of NGN 4.5M for an executive
                role and NGN 1.8M for a specialist role. Total package means base salary plus guaranteed allowances and
                any guaranteed bonus for the first twelve months.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Base salary</label>
                <input name="baseSalary" value={form.baseSalary} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. NGN 2.0M per month" />
              </div>
              <div>
                <label className={labelClass}>Guaranteed allowances</label>
                <input name="allowances" value={form.allowances} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. NGN 400k per month" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Variable or bonus</label>
                <input name="variablePay" value={form.variablePay} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. up to 20% of base on targets" />
              </div>
              <div>
                <label className={labelClass}>Total first-year package</label>
                <input name="totalPackage" value={form.totalPackage} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. NGN 30M, or NGN 2.5M per month" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Is there a ceiling?</label>
              <p className={hintClass}>
                The most you would go to for an outstanding candidate. Tell us even if it is the same as the figure
                above, because it changes who we approach rather than who we present. For a role that owns a P&amp;L,
                variable pay on margin delivery usually widens the pool further than more base does, so say if you are
                open to that.
              </p>
              <input name="packageCeiling" value={form.packageCeiling} onChange={ch} className={inputClass} style={inputStyle} placeholder="e.g. NGN 2.5M per month base, open to a margin bonus on top" />
            </div>
            <div>
              <label className={labelClass}>Benefits</label>
              <Chips options={BENEFITS} selected={form.benefits} onPick={(v) => toggle("benefits", v)} />
            </div>
            <div>
              <label className={labelClass}>Is the budget approved?</label>
              <Chips options={BUDGET_STATUS} selected={form.budgetStatus} onPick={(v) => pick("budgetStatus", v)} cols="grid-cols-1 sm:grid-cols-3" />
            </div>
            <div>
              <label className={labelClass}>Interim cover while the search runs?</label>
              <p className={hintClass}>
                A senior search takes 8 to 10 weeks to offer, and a candidate of that seniority will owe notice, so the
                seat realistically fills around month four. We can second an experienced operator into the role in the
                meantime at NGN 3M a month, six months minimum. Six because an interim spends the first month learning
                and the last handing over, so a shorter secondment buys you almost no useful time.
              </p>
              <Chips options={SECONDMENT} selected={form.secondmentInterest} onPick={(v) => pick("secondmentInterest", v)} cols="grid-cols-1 sm:grid-cols-3" />
            </div>
          </div>
        )}

        {/* ── 5 PROCESS ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Who will interview?</label>
                <textarea name="interviewers" value={form.interviewers} onChange={ch} rows={2} className={inputClass + " resize-none"} style={inputStyle} placeholder="Names and roles" />
              </div>
              <div>
                <label className={labelClass}>Preferred process</label>
                <textarea name="processPreference" value={form.processPreference} onChange={ch} rows={2} className={inputClass + " resize-none"} style={inputStyle} placeholder="e.g. two rounds, panel at final stage" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Internal candidates to include</label>
                <input name="internalCandidates" value={form.internalCandidates} onChange={ch} className={inputClass} style={inputStyle} placeholder="Names, or none" />
              </div>
              <div>
                <label className={labelClass}>Companies not to approach</label>
                <input name="blockedCompanies" value={form.blockedCompanies} onChange={ch} className={inputClass} style={inputStyle} placeholder="Off-limits employers" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Confidentiality</label>
              <Chips options={CONFIDENTIAL} selected={form.confidential} onPick={(v) => pick("confidential", v)} cols="grid-cols-1 sm:grid-cols-2" />
            </div>
            <div className="pt-1 border-t" style={{ borderColor: "#E8EBF0" }} />
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Your name *</label>
                <input required name="contactName" value={form.contactName} onChange={ch} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input required type="email" name="email" value={form.email} onChange={ch} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={ch} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Billing contact</label>
                <input name="billingContact" value={form.billingContact} onChange={ch} className={inputClass} style={inputStyle} placeholder="Who receives the invoice" />
              </div>
              <div>
                <label className={labelClass}>Billing email</label>
                <input type="email" name="billingEmail" value={form.billingEmail} onChange={ch} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Anything else</label>
              <textarea name="notes" value={form.notes} onChange={ch} rows={2} className={inputClass + " resize-none"} style={inputStyle} />
            </div>

            <label className="flex gap-3 items-start cursor-pointer rounded-xl p-4" style={{ background: "#FEF9EF", border: "1px solid #EBDCBC" }}>
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => setForm((p) => ({ ...p, termsAccepted: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded"
                style={{ accentColor: NAVY }}
              />
              <span className="text-xs text-gray-700 leading-relaxed">
                I am authorising this search on a retained basis at 15% of first-year total package, subject to the
                minimum fee. I understand the engagement tranche is <strong>40% of the fee, invoiced on submission of
                this brief and non-refundable</strong>, and that <strong>the search opens on receipt of funds</strong>.
                The balance falls due 30% on delivery of the shortlist and 30% on acceptance of offer.
              </span>
            </label>

            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-7">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              style={{ border: "1px solid #D1D5DB" }}
            >
              Back
            </button>
          )}
          {step < STEPS.length ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: NAVY }}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={status === "loading" || !canAdvance()}
              className="flex-1 rounded-xl py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8962e)`, color: "#06090f", boxShadow: "0 2px 12px rgba(212,175,55,0.25)" }}
            >
              {status === "loading" ? "Submitting..." : "Submit brief and start the project"}
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-5">
          Your details are used only to run this search and are held in line with the NDPR. Questions:{" "}
          <a href="mailto:hello@consultforafrica.com" className="font-medium hover:underline" style={{ color: NAVY }}>
            hello@consultforafrica.com
          </a>
        </p>
      </form>
    </div>
  );
}
