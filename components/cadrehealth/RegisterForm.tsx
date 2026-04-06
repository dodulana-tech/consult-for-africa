"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CADRE_OPTIONS, NIGERIAN_STATES } from "@/lib/cadreHealth/cadres";

const OPEN_TO_OPTIONS = [
  { value: "PERMANENT", label: "Permanent roles" },
  { value: "LOCUM", label: "Locum / shift work" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "INTERNATIONAL", label: "International opportunities" },
  { value: "SHORT_MISSION", label: "Short missions / medical outreach" },
  { value: "MEDEVAC", label: "Medical evacuation / patient transfer" },
  { value: "REMOTE", label: "Remote / telemedicine" },
];

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    cadre: "",
    subSpecialty: "",
    yearsOfExperience: "",
    state: "",
    city: "",
    isDiaspora: false,
    diasporaCountry: "",
    openTo: [] as string[],
    referralCode: "",
  });

  const update = (partial: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const toggleOpenTo = (value: string) =>
    setForm((prev) => ({
      ...prev,
      openTo: prev.openTo.includes(value)
        ? prev.openTo.filter((v) => v !== value)
        : [...prev.openTo, value],
    }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cadre/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/oncadre/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Progress */}
      <div className="mb-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[#0B3C5D]" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              value={form.firstName}
              onChange={(v) => update({ firstName: v })}
              placeholder="Chioma"
            />
            <Input
              label="Last name"
              value={form.lastName}
              onChange={(v) => update({ lastName: v })}
              placeholder="Okafor"
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => update({ email: v })}
            placeholder="chioma@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(v) => update({ phone: v })}
            placeholder="08012345678"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => update({ password: v })}
            placeholder="Min 8 characters"
          />

          <button
            onClick={() => setStep(1)}
            disabled={!form.firstName || !form.email || !form.password || form.password.length < 8}
            className="w-full rounded-lg bg-[#0B3C5D] py-3 text-base font-semibold text-white transition hover:bg-[#0A3350] disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Healthcare cadre
            </label>
            <select
              value={form.cadre}
              onChange={(e) => update({ cadre: e.target.value })}
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

          <Input
            label="Sub-specialty (optional)"
            value={form.subSpecialty}
            onChange={(v) => update({ subSpecialty: v })}
            placeholder="e.g. Internal Medicine, ICU Nursing"
          />

          <Input
            label="Years since qualification"
            type="number"
            value={form.yearsOfExperience}
            onChange={(v) => update({ yearsOfExperience: v })}
            placeholder="e.g. 5"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!form.cadre}
              className="flex-1 rounded-lg bg-[#0B3C5D] py-3 text-base font-semibold text-white transition hover:bg-[#0A3350] disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              State
            </label>
            <select
              value={form.state}
              onChange={(e) => update({ state: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="DIASPORA">I&apos;m outside Nigeria</option>
            </select>
          </div>

          {form.state === "DIASPORA" ? (
            <Input
              label="Country of residence"
              value={form.diasporaCountry}
              onChange={(v) => update({ diasporaCountry: v, isDiaspora: true })}
              placeholder="e.g. United Kingdom"
            />
          ) : (
            <Input
              label="City"
              value={form.city}
              onChange={(v) => update({ city: v })}
              placeholder="e.g. Ikeja"
            />
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              I&apos;m open to
            </label>
            <div className="flex flex-wrap gap-2">
              {OPEN_TO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOpenTo(opt.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    form.openTo.includes(opt.value)
                      ? "bg-[#0B3C5D] text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Referral code (optional)"
            value={form.referralCode}
            onChange={(v) => update({ referralCode: v })}
            placeholder="From a colleague?"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.state}
              className="flex-1 rounded-lg bg-[#D4AF37] py-3 text-base font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030] disabled:opacity-50"
            >
              {loading ? "Creating profile..." : "Create profile"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Input component ───────────────────────────────────────────────────── */

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
      />
    </div>
  );
}
