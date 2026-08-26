"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface JoinData {
  organisationName: string;
  placesRemaining: number;
}

export default function MaarovaJoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [data, setData] = useState<JoinData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [yearsInHealthcare, setYearsInHealthcare] = useState("");
  const [clinicalBackground, setClinicalBackground] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/maarova/join/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.message || json.error || "This link is not valid.");
          return;
        }
        setData(json);
      })
      .catch(() => setError("Could not check this link. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/maarova/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          title: title || undefined,
          department: department || undefined,
          yearsInHealthcare: yearsInHealthcare || undefined,
          clinicalBackground: clinicalBackground || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      router.push(result.redirect || "/maarova/portal/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F2744" }}>
        <div className="animate-pulse text-white text-sm">Checking your link...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F2744" }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">This link is not open</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <a href="/maarova/portal/login" className="inline-block mt-6 text-sm font-medium hover:underline" style={{ color: "#D4A574" }}>
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0F2744" }}>
      {/* Header */}
      <div className="pt-12 pb-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#D4A574" }}>
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-white font-semibold tracking-wide text-sm">MAAROVA</span>
        </div>
        <h1 className="text-white text-2xl font-bold">{data.organisationName}</h1>
        <p className="text-gray-300 text-sm mt-2 max-w-md mx-auto">
          Set up your account to take your leadership assessment. It takes about 40 minutes, and you can
          pause and pick it up again within 7 days. Your individual results are private to you.
        </p>
      </div>

      {/* Form Card */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: "#e5eaf0" }}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: "#e5eaf0" }}
                placeholder="you@example.com"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                You will use this to log back in if you pause partway through.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role or title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: "#e5eaf0" }}
                  placeholder="e.g. Programme Lead"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: "#e5eaf0" }}
                  placeholder="e.g. Rehabilitation"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Create a password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: "#e5eaf0" }}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: "#e5eaf0" }}
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          {/* Optional context fields */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-3">Optional - helps us calibrate your assessment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Years in the sector</label>
                <input
                  type="number"
                  value={yearsInHealthcare}
                  onChange={(e) => setYearsInHealthcare(e.target.value)}
                  min="0"
                  max="50"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5eaf0" }}
                  placeholder="e.g. 8"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Are you a clinical practitioner?
                </label>
                <select
                  value={clinicalBackground}
                  onChange={(e) => setClinicalBackground(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  <option value="">Select your background</option>
                  <option value="Medicine">Medicine (Doctor)</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Dentistry">Dentistry</option>
                  <option value="Allied Health">Allied Health (Lab, Radiography, Therapy)</option>
                  <option value="Social Work">Social Work / Counselling</option>
                  <option value="__non_clinical__">Non-clinical / Administrative</option>
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  This determines which assessment modules apply to you.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name || !email || !password || !confirmPassword}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#D4A574" }}
          >
            {submitting ? "Setting up your account..." : "Create Account & Start Assessment"}
          </button>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Already started? <a href="/maarova/portal/login" className="underline" style={{ color: "#D4A574" }}>Log in here</a>.
            Your assessment results are private and shared only with you.
          </p>
        </form>
      </div>
    </div>
  );
}
