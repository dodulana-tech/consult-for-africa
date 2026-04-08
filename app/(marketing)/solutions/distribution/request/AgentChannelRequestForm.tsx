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
  { value: "STARTER", label: "Starter", price: "N200,000" },
  { value: "GROWTH", label: "Growth", price: "N750,000" },
  { value: "ENTERPRISE", label: "Enterprise", price: "N2,000,000+" },
];

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  productDescription: string;
  targetMarket: string;
  currentPricing: string;
  commissionBudget: string;
  territories: string[];
  preferredTier: string;
  notes: string;
}

export default function AgentChannelRequestForm() {
  const [form, setForm] = useState<FormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
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
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function handleTerritoryToggle(territory: string) {
    setForm((p) => ({
      ...p,
      territories: p.territories.includes(territory)
        ? p.territories.filter((t) => t !== territory)
        : [...p.territories, territory],
    }));
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
          We have received your request. A member of the C4A team will be in touch within 48 hours to discuss your opportunity.
        </p>
      </div>
    );
  }

  const inputStyle = { border: "1px solid #E8EBF0", background: "#F8F9FB" } as const;
  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 sm:p-8 space-y-5" style={{ border: "1px solid #E8EBF0" }}>
      {/* Company + Contact */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Company name *</label>
          <input required type="text" name="companyName" value={form.companyName} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="Acme Health Ltd" />
        </div>
        <div>
          <label className={labelClass}>Contact name *</label>
          <input required type="text" name="contactName" value={form.contactName} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="Jane Doe" />
        </div>
      </div>

      {/* Email + Phone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email *</label>
          <input required type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="jane@acme.com" />
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input required type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="+234 800 000 0000" />
        </div>
      </div>

      {/* Product description */}
      <div>
        <label className={labelClass}>What do you sell? *</label>
        <textarea required name="productDescription" value={form.productDescription} onChange={handleChange} rows={3} className={inputClass} style={inputStyle} placeholder="Describe your product or service..." />
      </div>

      {/* Target market */}
      <div>
        <label className={labelClass}>Who buys it?</label>
        <textarea name="targetMarket" value={form.targetMarket} onChange={handleChange} rows={2} className={inputClass} style={inputStyle} placeholder="e.g. Hospital procurement teams, HR departments, individual patients..." />
      </div>

      {/* Current pricing */}
      <div>
        <label className={labelClass}>What does it cost the customer?</label>
        <input type="text" name="currentPricing" value={form.currentPricing} onChange={handleChange} className={inputClass} style={inputStyle} placeholder="e.g. N50,000 per unit, N200,000/year subscription" />
      </div>

      {/* Commission budget */}
      <div>
        <label className={labelClass}>Commission budget</label>
        <select name="commissionBudget" value={form.commissionBudget} onChange={handleChange} className={inputClass} style={{ ...inputStyle, color: form.commissionBudget ? "#111" : "#9CA3AF" }}>
          <option value="">Select a range</option>
          {COMMISSION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Territories */}
      <div>
        <label className={labelClass}>Territories</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {TERRITORY_OPTIONS.map((t) => {
            const selected = form.territories.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTerritoryToggle(t)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{
                  background: selected ? "#0B3C5D" : "#F8F9FB",
                  color: selected ? "#fff" : "#374151",
                  border: selected ? "1px solid #0B3C5D" : "1px solid #E8EBF0",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred tier */}
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
                className="rounded-xl p-3 text-center transition"
                style={{
                  background: selected ? "#0B3C5D" : "#F8F9FB",
                  color: selected ? "#fff" : "#374151",
                  border: selected ? "1px solid #0B3C5D" : "1px solid #E8EBF0",
                }}
              >
                <p className="text-xs font-semibold">{tier.label}</p>
                <p className="text-[11px] mt-0.5" style={{ opacity: 0.7 }}>{tier.price}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Additional notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputClass} style={inputStyle} placeholder="Anything else we should know..." />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "#0B3C5D" }}
      >
        {status === "loading" ? "Submitting..." : "Submit Request"}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        We will respond within 48 hours. For urgent enquiries, email{" "}
        <a href="mailto:partnerships@consultforafrica.com" className="text-[#0B3C5D] font-medium hover:underline">
          partnerships@consultforafrica.com
        </a>
      </p>
    </form>
  );
}
