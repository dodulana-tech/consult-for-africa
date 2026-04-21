"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Plus, X } from "lucide-react";
import { formatEnumLabel } from "@/lib/utils";
import { parseApiError } from "@/lib/parse-api-error";

type Profile = {
  title: string;
  bio: string;
  location: string;
  isDiaspora: boolean;
  expertiseAreas: string[];
  yearsExperience: number;
  hoursPerWeek: number | null;
  availabilityStatus: string;
  hourlyRateUSD: number | null;
  monthlyRateNGN: number | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  swiftCode: string | null;
};

const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "PARTIALLY_AVAILABLE", label: "Partially Available" },
  { value: "UNAVAILABLE", label: "Unavailable" },
  { value: "ON_LEAVE", label: "On Leave" },
];

export default function EditConsultantProfile({ initialProfile }: { initialProfile: Profile }) {
  const [form, setForm] = useState(initialProfile);
  const [newExpertise, setNewExpertise] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof Profile, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setSuccess(false);
  }

  function addExpertise() {
    const tag = newExpertise.trim();
    if (!tag || form.expertiseAreas.includes(tag)) return;
    set("expertiseAreas", [...form.expertiseAreas, tag]);
    setNewExpertise("");
  }

  function removeExpertise(area: string) {
    set("expertiseAreas", form.expertiseAreas.filter((a) => a !== area));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.bio.trim() || !form.location.trim()) {
      setError("Title, bio, and location are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/consultant-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await parseApiError(res, "");
        setError(text || "Failed to save. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
  const inputStyle = { borderColor: "#e5eaf0" };
  const labelClass = "text-xs font-medium text-gray-500 block mb-1";

  return (
    <form onSubmit={save} className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-lg p-3 text-sm text-emerald-700" style={{ background: "#ECFDF5" }}>
          <CheckCircle2 size={14} />
          Profile updated successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 text-sm text-red-600" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Professional Info */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Professional Info</h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Title</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Senior Healthcare Operations Consultant"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={4}
              placeholder="Brief professional biography..."
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Location</label>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Lagos, Nigeria"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass}>Years Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.yearsExperience}
                onChange={(e) => set("yearsExperience", parseInt(e.target.value) || 0)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDiaspora}
                onChange={(e) => set("isDiaspora", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Diaspora consultant</span>
            </label>
          </div>
        </div>
      </div>

      {/* Expertise */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Expertise Areas</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.expertiseAreas.map((area) => (
            <span
              key={area}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: "#F0F4FF", color: "#0F2744" }}
            >
              {formatEnumLabel(area)}
              <button type="button" onClick={() => removeExpertise(area)} className="hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newExpertise}
            onChange={(e) => setNewExpertise(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExpertise(); } }}
            placeholder="Add expertise area..."
            className={`flex-1 ${inputClass}`}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={addExpertise}
            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Availability & Rates */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Availability & Rates</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Availability Status</label>
            <select
              value={form.availabilityStatus}
              onChange={(e) => set("availabilityStatus", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {AVAILABILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Hours/Week Available</label>
            <input
              type="number"
              min="0"
              max="80"
              value={form.hoursPerWeek ?? ""}
              onChange={(e) => set("hoursPerWeek", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="e.g. 20"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Payment currency + rate */}
        <div className="mt-4">
          <label className={labelClass}>Payment Currency</label>
          <div className="flex gap-3 mb-3">
            {(["NGN", "USD"] as const).map((c) => {
              const isSelected = c === "NGN" ? !!form.monthlyRateNGN || !form.hourlyRateUSD : !!form.hourlyRateUSD;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (c === "NGN") {
                      set("hourlyRateUSD", null);
                    } else {
                      set("monthlyRateNGN", null);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isSelected ? "#0F2744" : "#F1F5F9",
                    color: isSelected ? "#fff" : "#64748B",
                    border: `1px solid ${isSelected ? "#0F2744" : "#E2E8F0"}`,
                  }}
                >
                  {c === "NGN" ? "Nigerian Naira (NGN)" : "US Dollar (USD)"}
                </button>
              );
            })}
          </div>

          {/* Show relevant rate field based on currency */}
          {(!form.hourlyRateUSD || form.monthlyRateNGN) ? (
            <div>
              <label className={labelClass}>Your Monthly Rate (NGN)</label>
              <input
                type="number"
                min="0"
                step="100000"
                value={form.monthlyRateNGN ?? ""}
                onChange={(e) => set("monthlyRateNGN", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="e.g. 2,500,000"
                className={inputClass}
                style={inputStyle}
              />
              <p className="text-[10px] text-gray-400 mt-1">This is your full-time monthly engagement rate. Hourly and daily rates will be derived from this.</p>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Your Hourly Rate (USD)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={form.hourlyRateUSD ?? ""}
                onChange={(e) => set("hourlyRateUSD", e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="e.g. 150"
                className={inputClass}
                style={inputStyle}
              />
              <p className="text-[10px] text-gray-400 mt-1">Standard rate for diaspora and international consultants. Billed in USD.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank Details */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Bank Name</label>
            <input
              value={form.bankName ?? ""}
              onChange={(e) => set("bankName", e.target.value)}
              placeholder="e.g. First Bank"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Account Name</label>
            <input
              value={form.accountName ?? ""}
              onChange={(e) => set("accountName", e.target.value)}
              placeholder="Full name on account"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Account Number</label>
            <input
              value={form.accountNumber ?? ""}
              onChange={(e) => set("accountNumber", e.target.value)}
              placeholder="10-digit account number"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>SWIFT Code <span className="text-gray-400">(diaspora)</span></label>
            <input
              value={form.swiftCode ?? ""}
              onChange={(e) => set("swiftCode", e.target.value)}
              placeholder="e.g. FBNINGLA"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "#0F2744" }}
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
