"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CADRE_OPTIONS, NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";

const FACILITY_TYPE_OPTIONS = [
  { value: "PUBLIC_TERTIARY", label: "Public Tertiary (Teaching Hospital)" },
  { value: "PUBLIC_SECONDARY", label: "Public Secondary (General Hospital)" },
  { value: "PUBLIC_PRIMARY", label: "Public Primary (PHC)" },
  { value: "PRIVATE_TERTIARY", label: "Private Tertiary" },
  { value: "PRIVATE_SECONDARY", label: "Private Secondary" },
  { value: "PRIVATE_CLINIC", label: "Private Clinic" },
  { value: "FAITH_BASED", label: "Faith-Based / Mission Hospital" },
  { value: "NGO", label: "NGO / Development Partner" },
  { value: "MILITARY", label: "Military / Paramilitary" },
  { value: "INTERNATIONAL", label: "International Organization" },
];

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN (Naira)" },
  { value: "USD", label: "USD (US Dollar)" },
];

export default function SalarySurveyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    cadre: "",
    role: "",
    facilityType: "",
    state: "",
    city: "",
    yearsOfExperience: "",
    baseSalary: "",
    allowances: "",
    callDutyPay: "",
    locumIncome: "",
    currency: "NGN",
    paidOnTime: true,
    averagePayDelayDays: "",
  });

  const update = (partial: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const totalMonthlyTakeHome =
    (parseFloat(form.baseSalary) || 0) +
    (parseFloat(form.allowances) || 0) +
    (parseFloat(form.callDutyPay) || 0) +
    (parseFloat(form.locumIncome) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cadre/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cadre: form.cadre,
          role: form.role,
          facilityType: form.facilityType,
          state: form.state,
          city: form.city || null,
          yearsOfExperience: parseInt(form.yearsOfExperience) || null,
          baseSalary: parseFloat(form.baseSalary) || 0,
          allowances: parseFloat(form.allowances) || null,
          callDutyPay: parseFloat(form.callDutyPay) || null,
          locumIncome: parseFloat(form.locumIncome) || null,
          totalMonthlyTakeHome: totalMonthlyTakeHome || null,
          currency: form.currency,
          paidOnTime: form.paidOnTime,
          averagePayDelayDays: form.paidOnTime
            ? null
            : parseInt(form.averagePayDelayDays) || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(true);
      // Refresh the page after a short delay to show the salary map
      setTimeout(() => router.refresh(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-8 w-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-emerald-900">
          Salary map unlocked!
        </h3>
        <p className="mt-2 text-sm text-emerald-700">
          Thank you for contributing. Your data is anonymized and helps every
          healthcare professional negotiate better.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Role information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Your current role
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          This helps us group salary data accurately.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Healthcare cadre
            </label>
            <select
              value={form.cadre}
              onChange={(e) => update({ cadre: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              <option value="">Select your cadre</option>
              {CADRE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Job title / role
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => update({ role: e.target.value })}
              placeholder="e.g. Senior Registrar, Staff Nurse"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Facility type
            </label>
            <select
              value={form.facilityType}
              onChange={(e) => update({ facilityType: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              <option value="">Select facility type</option>
              {FACILITY_TYPE_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Years of experience
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={form.yearsOfExperience}
              onChange={(e) => update({ yearsOfExperience: e.target.value })}
              placeholder="e.g. 5"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              State
            </label>
            <select
              value={form.state}
              onChange={(e) => update({ state: e.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              City (optional)
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="e.g. Ikeja"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Monthly compensation
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          All amounts are monthly. Only base salary is required.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Currency</label>
          <div className="flex rounded-lg border border-gray-300">
            {CURRENCY_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => update({ currency: c.value })}
                className={`px-4 py-2 text-sm font-medium transition first:rounded-l-lg last:rounded-r-lg ${
                  form.currency === c.value
                    ? "bg-[#0B3C5D] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Base salary *
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.baseSalary}
              onChange={(e) => update({ baseSalary: e.target.value })}
              placeholder="e.g. 250000"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Allowances
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.allowances}
              onChange={(e) => update({ allowances: e.target.value })}
              placeholder="Housing, transport, hazard, etc."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Call duty pay
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.callDutyPay}
              onChange={(e) => update({ callDutyPay: e.target.value })}
              placeholder="Average monthly call duty"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Locum income
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.locumIncome}
              onChange={(e) => update({ locumIncome: e.target.value })}
              placeholder="Average monthly locum earnings"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>
        </div>

        {/* Auto-computed total */}
        <div className="mt-4 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Total monthly take-home
            </span>
            <span className="text-lg font-bold text-[#0B3C5D]">
              {form.currency === "NGN" ? "\u20A6" : "$"}
              {totalMonthlyTakeHome.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Pay reliability */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Pay reliability</h3>
        <p className="mt-1 text-sm text-gray-500">
          This helps professionals know what to expect at different facility types.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Are you typically paid on time?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => update({ paidOnTime: true, averagePayDelayDays: "" })}
                className={`min-h-[44px] flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  form.paidOnTime
                    ? "border-[#0B3C5D] bg-[#0B3C5D] text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Yes, on time
              </button>
              <button
                type="button"
                onClick={() => update({ paidOnTime: false })}
                className={`min-h-[44px] flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  !form.paidOnTime
                    ? "border-[#0B3C5D] bg-[#0B3C5D] text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                No, often delayed
              </button>
            </div>
          </div>

          {!form.paidOnTime && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Average delay (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={form.averagePayDelayDays}
                onChange={(e) =>
                  update({ averagePayDelayDays: e.target.value })
                }
                placeholder="e.g. 14"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Privacy note + submit */}
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">
            Your salary data is always anonymized. We never share individual
            reports or associate them with your name. Aggregated data requires a
            minimum sample size before it appears on the map.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !form.cadre || !form.role || !form.facilityType || !form.state || !form.baseSalary}
          className="w-full rounded-lg bg-[#D4AF37] py-3 text-base font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030] disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Share my salary and unlock the map"}
        </button>
      </div>
    </form>
  );
}
