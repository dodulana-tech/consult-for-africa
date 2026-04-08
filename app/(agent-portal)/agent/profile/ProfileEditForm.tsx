"use client";

import { useState } from "react";

interface AgentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string | null;
  state: string | null;
  industries: string[];
  salesExperience: number | null;
  bio: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const INDUSTRY_OPTIONS = [
  "Healthcare", "Technology", "Finance", "Education", "Manufacturing",
  "Real Estate", "Agriculture", "Energy", "Retail", "Consulting",
  "Telecommunications", "Logistics", "Hospitality", "Other",
];

export default function ProfileEditForm({ agent }: { agent: AgentData }) {
  const [form, setForm] = useState({
    firstName: agent.firstName,
    lastName: agent.lastName,
    phone: agent.phone,
    company: agent.company ?? "",
    state: agent.state ?? "",
    industries: agent.industries,
    salesExperience: agent.salesExperience?.toString() ?? "",
    bio: agent.bio ?? "",
    bankName: agent.bankName ?? "",
    accountNumber: agent.accountNumber ?? "",
    accountName: agent.accountName ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function update(field: string, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  }

  function toggleIndustry(industry: string) {
    setForm((prev) => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry],
    }));
    setMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/agent-portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          state: form.state,
          industries: form.industries,
          salesExperience: form.salesExperience,
          bio: form.bio.trim(),
          bankName: form.bankName.trim(),
          accountNumber: form.accountNumber.trim(),
          accountName: form.accountName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to save profile");
      }

      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20";

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Personal Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Email</label>
            <input
              type="email"
              value={agent.email}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
            />
            <p className="mt-1 text-[11px] text-gray-400">Email cannot be changed</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Company</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="Your company or organisation"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">State</label>
            <select
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              className={inputClass}
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Sales Experience (years)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={form.salesExperience}
              onChange={(e) => update("salesExperience", e.target.value)}
              placeholder="e.g. 5"
              className={inputClass}
            />
          </div>
        </div>

        {/* Industries */}
        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold text-gray-600">Industries</label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_OPTIONS.map((ind) => {
              const selected = form.industries.includes(ind);
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => toggleIndustry(ind)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: selected ? "#0F2744" : "#F3F4F6",
                    color: selected ? "#FFFFFF" : "#6B7280",
                  }}
                >
                  {ind}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            placeholder="Tell us about yourself and your sales background"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="mb-1 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Bank Details
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          Commission payouts will be sent to this account.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Bank Name</label>
            <input
              type="text"
              value={form.bankName}
              onChange={(e) => update("bankName", e.target.value)}
              placeholder="e.g. GTBank"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Account Number</label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => update("accountNumber", e.target.value)}
              placeholder="10-digit account number"
              maxLength={10}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Account Name</label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => update("accountName", e.target.value)}
              placeholder="Name on the account"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ background: "#0F2744" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {message && (
          <p
            className={`text-sm font-medium ${
              message.type === "success" ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
