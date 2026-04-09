"use client";
import { useState } from "react";

const COMMISSION_OPTIONS = [
  "Up to 5%",
  "5-10%",
  "10-15%",
  "15-20%",
  "20%+",
  "Not sure yet",
];

const TERRITORY_OPTIONS = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Nationwide",
  "Diaspora",
];

const TIER_OPTIONS = [
  { value: "STARTER", label: "Starter", price: "N200,000", desc: "Up to 10 agents" },
  { value: "GROWTH", label: "Growth", price: "N750,000", desc: "Up to 25 agents" },
  { value: "ENTERPRISE", label: "Enterprise", price: "N2M+", desc: "Unlimited agents" },
];

const PRODUCT_TYPES = [
  "Health insurance / HMO plans",
  "Diagnostic packages / lab tests",
  "Wellness programmes",
  "Home care services",
  "Pharmaceutical products",
  "Elective procedures (IVF, orthopaedic, dental)",
  "Medical devices / equipment",
  "Health tech platform / app",
  "Other",
];

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  productType: string;
  productDescription: string;
  targetMarket: string;
  currentPricing: string;
  commissionBudget: string;
  territories: string[];
  preferredTier: string;
  notes: string;
}

export default function AgentChannelRequestForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    productType: "",
    productDescription: "",
    targetMarket: "",
    currentPricing: "",
    commissionBudget: "",
    territories: [],
    preferredTier: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function toggleTerritory(t: string) {
    setForm((p) => ({
      ...p,
      territories: p.territories.includes(t)
        ? p.territories.filter((x) => x !== t)
        : [...p.territories, t],
    }));
  }

  function canAdvance(): boolean {
    if (step === 1) return !!(form.productType && form.productDescription.trim());
    if (step === 2) return !!(form.companyName.trim() && form.email.trim() && form.contactName.trim());
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/agent-channel/request", {
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
        <p className="mt-4 text-lg font-semibold text-gray-900">Request Received</p>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          A member of the C4A partnerships team will be in touch within 48 hours to discuss your opportunity and design a commission model.
        </p>
      </div>
    );
  }

  const inputClass = "w-full rounded-lg px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20 transition";
  const inputStyle = { border: "1px solid #D1D5DB", background: "#fff" } as const;
  const labelClass = "block text-sm font-medium text-gray-900 mb-1.5";

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8" style={{ border: "1px solid #E8EBF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors"
              style={{
                background: step >= s ? "#0B3C5D" : "#F3F4F6",
                color: step >= s ? "#fff" : "#9CA3AF",
              }}
            >
              {step > s ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : s}
            </div>
            {s < 3 && (
              <div className="flex-1 h-[2px] rounded-full" style={{ background: step > s ? "#0B3C5D" : "#E5E7EB" }} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ─── STEP 1: Your Product ─── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-semibold text-gray-900">What do you sell?</p>
              <p className="text-sm text-gray-500 mt-1">Pick the category that best describes your product.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_TYPES.map((pt) => {
                const selected = form.productType === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, productType: pt }))}
                    className="rounded-lg px-3 py-2.5 text-xs font-medium text-left transition-all"
                    style={{
                      background: selected ? "#0B3C5D" : "#fff",
                      color: selected ? "#fff" : "#374151",
                      border: selected ? "1.5px solid #0B3C5D" : "1.5px solid #D1D5DB",
                    }}
                  >
                    {pt}
                  </button>
                );
              })}
            </div>

            <div>
              <label className={labelClass}>Describe it in a few sentences</label>
              <textarea
                name="productDescription"
                value={form.productDescription}
                onChange={handleChange}
                rows={3}
                className={inputClass + " resize-none"}
                style={inputStyle}
                placeholder="What it does, why customers buy it, what makes it different..."
              />
            </div>

            <div>
              <label className={labelClass}>What does it cost the customer?</label>
              <input
                type="text"
                name="currentPricing"
                value={form.currentPricing}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. N50,000 per unit, N200,000/year"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canAdvance()}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ background: "#0B3C5D" }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ─── STEP 2: Your Details ─── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-semibold text-gray-900">Tell us about you</p>
              <p className="text-sm text-gray-500 mt-1">So we know who to call.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Company name *</label>
                <input required type="text" name="companyName" value={form.companyName} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="Acme Health" />
              </div>
              <div>
                <label className={labelClass}>Your name *</label>
                <input required type="text" name="contactName" value={form.contactName} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="Jane Doe" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input required type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="jane@acmehealth.com" />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="+234 800 000 0000" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Who buys your product?</label>
              <textarea
                name="targetMarket"
                value={form.targetMarket}
                onChange={handleChange}
                rows={2}
                className={inputClass + " resize-none"}
                style={inputStyle}
                placeholder="e.g. Hospital procurement, diaspora families, corporate HR departments..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                style={{ border: "1px solid #D1D5DB" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canAdvance()}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "#0B3C5D" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Distribution Preferences ─── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-semibold text-gray-900">Distribution preferences</p>
              <p className="text-sm text-gray-500 mt-1">Help us design the right agent programme for you.</p>
            </div>

            {/* Commission budget */}
            <div>
              <label className={labelClass}>What commission can you offer agents?</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {COMMISSION_OPTIONS.map((opt) => {
                  const selected = form.commissionBudget === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, commissionBudget: opt }))}
                      className="rounded-lg px-2 py-2.5 text-xs font-medium text-center transition-all"
                      style={{
                        background: selected ? "#0B3C5D" : "#fff",
                        color: selected ? "#fff" : "#374151",
                        border: selected ? "1.5px solid #0B3C5D" : "1.5px solid #D1D5DB",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Territories */}
            <div>
              <label className={labelClass}>Where do you want agents?</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {TERRITORY_OPTIONS.map((t) => {
                  const selected = form.territories.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTerritory(t)}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: selected ? "#0B3C5D" : "#fff",
                        color: selected ? "#fff" : "#374151",
                        border: selected ? "1.5px solid #0B3C5D" : "1.5px solid #D1D5DB",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tier */}
            <div>
              <label className={labelClass}>Preferred tier</label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                {TIER_OPTIONS.map((tier) => {
                  const selected = form.preferredTier === tier.value;
                  return (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, preferredTier: tier.value }))}
                      className="rounded-xl p-4 text-center transition-all"
                      style={{
                        background: selected ? "#0B3C5D" : "#fff",
                        border: selected ? "1.5px solid #0B3C5D" : "1.5px solid #D1D5DB",
                      }}
                    >
                      <p className="text-xs font-bold" style={{ color: selected ? "#D4AF37" : "#0B3C5D" }}>{tier.label}</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: selected ? "#fff" : "#111827" }}>{tier.price}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: selected ? "rgba(255,255,255,0.6)" : "#9CA3AF" }}>{tier.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Anything else?</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                className={inputClass + " resize-none"}
                style={inputStyle}
                placeholder="Timeline, special requirements, questions..."
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                style={{ border: "1px solid #D1D5DB" }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #D4AF37, #b8962e)", color: "#06090f", boxShadow: "0 2px 12px rgba(212,175,55,0.25)" }}
              >
                {status === "loading" ? "Submitting..." : "Submit Request"}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              We respond within 48 hours. For urgent enquiries:{" "}
              <a href="mailto:partnerships@consultforafrica.com" className="text-[#0B3C5D] font-medium hover:underline">
                partnerships@consultforafrica.com
              </a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
