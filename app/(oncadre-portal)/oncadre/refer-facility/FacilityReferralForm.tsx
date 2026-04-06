"use client";

import { useState } from "react";
import { NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";
import { useRouter } from "next/navigation";

const FACILITY_TYPES = [
  { value: "PUBLIC_TERTIARY", label: "Public Tertiary (Teaching Hospital, FMC)" },
  { value: "PUBLIC_SECONDARY", label: "Public Secondary (State / General Hospital)" },
  { value: "PUBLIC_PRIMARY", label: "Public Primary (PHC)" },
  { value: "PRIVATE_TERTIARY", label: "Private Tertiary" },
  { value: "PRIVATE_SECONDARY", label: "Private Secondary" },
  { value: "PRIVATE_CLINIC", label: "Private Clinic" },
  { value: "FAITH_BASED", label: "Faith-Based" },
  { value: "NGO", label: "NGO" },
  { value: "MILITARY", label: "Military" },
  { value: "INTERNATIONAL", label: "International (NHS, Gulf, etc.)" },
];

const NEED_TYPES = [
  { value: "RECRUITMENT", label: "Permanent Recruitment" },
  { value: "LOCUM_STAFFING", label: "Locum / Temporary Staffing" },
  { value: "CONSULTING", label: "Workforce Consulting" },
  { value: "OTHER", label: "Other" },
];

export default function FacilityReferralForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    facilityName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    facilityType: "",
    state: "",
    city: "",
    needType: "RECRUITMENT",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.facilityName.trim()) {
      setError("Facility name is required.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/cadre/refer-facility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/oncadre/referrals"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-bold text-emerald-900">Thank you!</h2>
        <p className="mt-2 text-emerald-700">
          Your facility referral has been submitted. Our team will follow up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Facility Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Facility Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.facilityName}
          onChange={(e) => update("facilityName", e.target.value)}
          placeholder="e.g. Lagos University Teaching Hospital"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
        />
      </div>

      {/* Contact Person */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact Person Name
          </label>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            placeholder="Dr. Adeyemi Johnson"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact Email
          </label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contact Phone
        </label>
        <input
          type="tel"
          value={form.contactPhone}
          onChange={(e) => update("contactPhone", e.target.value)}
          placeholder="+234..."
          className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
        />
      </div>

      {/* Facility Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Facility Type
        </label>
        <select
          value={form.facilityType}
          onChange={(e) => update("facilityType", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
        >
          <option value="">Select type...</option>
          {FACILITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <select
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
          >
            <option value="">Select state...</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
          />
        </div>
      </div>

      {/* Need Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          What do they need? <span className="text-red-500">*</span>
        </label>
        <select
          value={form.needType}
          onChange={(e) => update("needType", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
        >
          {NEED_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          placeholder="Any context that would help us reach out effectively..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0B3C5D] focus:ring-1 focus:ring-[#0B3C5D] focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[#0B3C5D] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0A3350] disabled:opacity-50 transition"
      >
        {submitting ? "Submitting..." : "Submit Referral"}
      </button>
    </form>
  );
}
