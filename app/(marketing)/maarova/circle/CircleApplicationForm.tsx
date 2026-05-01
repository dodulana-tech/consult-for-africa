"use client";

import { useState } from "react";

export default function CircleApplicationForm({ slotsRemaining }: { slotsRemaining: number }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    currentRole: "",
    currentEmployer: "",
    city: "",
    country: "",
    yearsInRole: "",
    coachingOptIn: true,
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Required fields
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.linkedinUrl.trim() || !form.currentRole.trim() || !form.currentEmployer.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    if (!cvFile) {
      setError("Please upload your CV.");
      return;
    }
    if (cvFile.size > 5 * 1024 * 1024) {
      setError("CV must be smaller than 5 MB.");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, String(v));
      });
      fd.append("cv", cvFile);

      const res = await fetch("/api/maarova/circle/apply", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      setSubmittedStatus(data.status as string);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "#D4AF37", background: "rgba(212,175,55,0.06)" }}>
        <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.2)" }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: "#0F2744" }}>Application received</h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {submittedStatus === "APPROVED"
            ? "You have been approved for the Founding Circle. Check your inbox for your private link to start the assessment."
            : submittedStatus === "DECLINED"
            ? "Thank you for applying. This round is calibrated for healthcare operators with current leadership scope. We will be in touch about future rounds."
            : "We have your application. Debo will review it personally within 24 hours. You will hear back either way."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: "#E8EBF0" }}>
      {/* Name */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="First name" required>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
            required
          />
        </Field>
        <Field label="Last name" required>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
            required
          />
        </Field>
      </div>

      {/* Email + Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Email" required>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
            required
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
          />
        </Field>
      </div>

      {/* LinkedIn */}
      <div className="mb-4">
        <Field label="LinkedIn URL" required>
          <input
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={form.linkedinUrl}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
            required
          />
        </Field>
      </div>

      {/* Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Current role" required>
          <input
            type="text"
            placeholder="e.g. Medical Director"
            value={form.currentRole}
            onChange={(e) => update("currentRole", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
            required
          />
        </Field>
        <Field label="Years in role">
          <input
            type="number"
            min={0}
            max={60}
            value={form.yearsInRole}
            onChange={(e) => update("yearsInRole", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
          />
        </Field>
      </div>

      {/* Employer */}
      <div className="mb-4">
        <Field label="Current employer" required>
          <input
            type="text"
            placeholder="Hospital, organisation, or company"
            value={form.currentEmployer}
            onChange={(e) => update("currentEmployer", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
            required
          />
        </Field>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="City">
          <input
            type="text"
            placeholder="Lagos, Abuja, Nairobi..."
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
          />
        </Field>
        <Field label="Country">
          <input
            type="text"
            placeholder="Nigeria, Kenya, Ghana..."
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            className="w-full rounded-xl border p-3 text-sm"
            style={{ borderColor: "#E8EBF0" }}
          />
        </Field>
      </div>

      {/* CV upload */}
      <div className="mb-6">
        <Field label="Upload CV (PDF or Word, under 5 MB)" required>
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium file:bg-[#0F2744] file:text-white hover:file:bg-[#1a3a55]"
          />
        </Field>
      </div>

      {/* Coaching opt-in */}
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={form.coachingOptIn}
          onChange={(e) => update("coachingOptIn", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300"
          style={{ accentColor: "#D4AF37" }}
        />
        <span className="text-sm text-gray-700">
          Notify me when Maarova coaching opens in June 2026 with my 10% Founding Circle discount.
        </span>
      </label>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" style={{ border: "1px solid #FCA5A5" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl py-4 text-sm font-semibold transition disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #D4AF37, #b8932d)",
          color: "#0F2744",
        }}
      >
        {submitting
          ? "Submitting and reviewing..."
          : slotsRemaining > 0
          ? "Submit application"
          : "Join the waitlist"}
      </button>
      <p className="mt-3 text-[11px] text-center text-gray-500">
        We review every application personally. You will hear back within 24 hours.
      </p>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
        {label} {required && <span style={{ color: "#D4AF37" }}>*</span>}
      </span>
      {children}
    </label>
  );
}
