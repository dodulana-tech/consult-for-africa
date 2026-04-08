"use client";
import { useState } from "react";

const CADRE_OPTIONS = [
  { value: "MEDICINE", label: "Medicine & Surgery" },
  { value: "NURSING", label: "Nursing" },
  { value: "MIDWIFERY", label: "Midwifery" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "DENTISTRY", label: "Dentistry" },
  { value: "MEDICAL_LABORATORY_SCIENCE", label: "Medical Laboratory Science" },
  { value: "RADIOGRAPHY_IMAGING", label: "Radiography & Imaging" },
  { value: "REHABILITATION_THERAPY", label: "Physiotherapy & Rehab" },
  { value: "OPTOMETRY", label: "Optometry" },
  { value: "COMMUNITY_HEALTH", label: "Community Health" },
  { value: "ENVIRONMENTAL_HEALTH", label: "Environmental Health" },
  { value: "NUTRITION_DIETETICS", label: "Nutrition & Dietetics" },
  { value: "PSYCHOLOGY_SOCIAL_WORK", label: "Psychology & Social Work" },
  { value: "PUBLIC_HEALTH", label: "Public Health" },
  { value: "HEALTH_ADMINISTRATION", label: "Health Administration" },
];

export default function ExpressApplyForm({ jobId, defaultCadre }: { jobId: string; defaultCadre?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", cadre: defaultCadre || "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [isNew, setIsNew] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/cadre/jobs/${jobId}/express-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply");
      setIsNew(data.isNew);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.1)" }}>
          <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="mt-3 font-semibold text-gray-900">Application Submitted</p>
        <p className="mt-1 text-sm text-gray-500">We will be in touch if there is a match.</p>
        {isNew && (
          <a
            href={`/oncadre/activate?email=${encodeURIComponent(form.email)}`}
            className="mt-4 inline-block rounded-lg px-4 py-2 text-xs font-semibold text-[#0B3C5D] transition hover:bg-[#0B3C5D]/5"
            style={{ border: "1px solid rgba(11,60,93,0.2)" }}
          >
            Set a password to track your application
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">Quick Apply</p>
      <p className="text-xs text-gray-500 -mt-1">No account needed. 30 seconds.</p>
      <input
        required type="text" placeholder="Full name"
        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
        style={{ border: "1px solid #E8EBF0", background: "#F8F9FB" }}
      />
      <input
        required type="email" placeholder="Email address"
        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
        style={{ border: "1px solid #E8EBF0", background: "#F8F9FB" }}
      />
      <input
        required type="tel" placeholder="Phone (+234...)"
        value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
        style={{ border: "1px solid #E8EBF0", background: "#F8F9FB" }}
      />
      <select
        required value={form.cadre} onChange={e => setForm(p => ({ ...p, cadre: e.target.value }))}
        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
        style={{ border: "1px solid #E8EBF0", background: "#F8F9FB", color: form.cadre ? "#111" : "#9CA3AF" }}
      >
        <option value="">Select your cadre</option>
        {CADRE_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit" disabled={status === "loading"}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #D4AF37, #b8962e)", boxShadow: "0 2px 8px rgba(212,175,55,0.3)" }}
      >
        {status === "loading" ? "Submitting..." : "Apply Now"}
      </button>
      <p className="text-[10px] text-gray-400 text-center">
        Already have an account? <a href="/oncadre/login" className="text-[#0B3C5D] font-medium hover:underline">Sign in</a> to apply with your full profile.
      </p>
    </form>
  );
}
