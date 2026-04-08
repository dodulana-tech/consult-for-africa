"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDUSTRY_OPTIONS = [
  "Healthcare",
  "Corporate Wellness",
  "Pharmaceuticals",
  "Medical Devices",
  "HMO / Insurance",
  "Government Health",
  "Real Estate",
  "Technology",
  "Oil & Gas",
  "Financial Services",
  "Hospitality",
  "Other",
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default function AgentRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    company: "", title: "", state: "", salesExperience: "",
    referralSource: "",
  });
  const [industries, setIndustries] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleIndustry(ind: string) {
    setIndustries((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent-portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, industries }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto-login after registration
      const loginRes = await fetch("/api/agent-portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (loginRes.ok) {
        router.push("/agent/dashboard");
        router.refresh();
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#F8F9FB" }}>
        <div className="w-full max-w-md text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "#D1FAE5" }}
          >
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Application Submitted
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Thank you for applying to become a C4A Sales Agent. Our team will review
            your application and get back to you within 48 hours.
          </p>
          <Link
            href="/agent/login"
            className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "#0F2744" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "#F8F9FB" }}>
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cfa.png" alt="Consult For Africa" className="mx-auto mb-4" style={{ height: 36 }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Become an Agent
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Apply to sell on behalf of C4A clients and earn commissions
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-8 shadow-sm"
          style={{ border: "1px solid #E8EBF0" }}
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">First Name *</label>
                <input
                  required value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Last Name *</label>
                <input
                  required value={form.lastName} onChange={(e) => update("lastName", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email *</label>
              <input
                type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Phone *</label>
              <input
                type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                placeholder="08012345678"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password *</label>
              <input
                type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Company</label>
                <input
                  value={form.company} onChange={(e) => update("company", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Title / Role</label>
                <input
                  value={form.title} onChange={(e) => update("title", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                  placeholder="e.g. Business Development Lead"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">State</label>
                <select
                  value={form.state} onChange={(e) => update("state", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Sales Experience</label>
                <select
                  value={form.salesExperience} onChange={(e) => update("salesExperience", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                >
                  <option value="">Select</option>
                  <option value="1">Less than 1 year</option>
                  <option value="2">1-3 years</option>
                  <option value="5">3-5 years</option>
                  <option value="8">5-10 years</option>
                  <option value="15">10+ years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Industries</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      industries.includes(ind)
                        ? "text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                    style={industries.includes(ind) ? { background: "#0F2744" } : {}}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">How did you hear about us?</label>
              <input
                value={form.referralSource} onChange={(e) => update("referralSource", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                placeholder="Referral, LinkedIn, etc."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/agent/login" className="font-semibold hover:underline" style={{ color: "#D4AF37" }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
