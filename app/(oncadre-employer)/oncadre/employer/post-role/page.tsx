"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CADRE_OPTIONS = [
  { value: "MEDICINE", label: "Medicine (Doctor)" },
  { value: "NURSING", label: "Nursing" },
  { value: "MIDWIFERY", label: "Midwifery" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "DENTISTRY", label: "Dentistry" },
  { value: "MEDICAL_LABORATORY_SCIENCE", label: "Medical Laboratory Science" },
  { value: "RADIOGRAPHY_IMAGING", label: "Radiography / Imaging" },
  { value: "REHABILITATION_THERAPY", label: "Rehabilitation Therapy" },
  { value: "OPTOMETRY", label: "Optometry" },
  { value: "COMMUNITY_HEALTH", label: "Community Health" },
  { value: "ENVIRONMENTAL_HEALTH", label: "Environmental Health" },
  { value: "NUTRITION_DIETETICS", label: "Nutrition / Dietetics" },
  { value: "PSYCHOLOGY_SOCIAL_WORK", label: "Psychology / Social Work" },
  { value: "PUBLIC_HEALTH", label: "Public Health" },
  { value: "HEALTH_RECORDS", label: "Health Records" },
  { value: "HOSPITAL_MANAGEMENT", label: "Hospital Management & Leadership" },
];

const MANDATE_TYPES = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "LOCUM", label: "Locum" },
  { value: "CONTRACT", label: "Contract" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "INTERNATIONAL", label: "International" },
];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default function PostRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    cadre: "",
    subSpecialty: "",
    type: "PERMANENT",
    minYearsExperience: "",
    locationState: "",
    locationCity: "",
    salaryRangeMin: "",
    salaryRangeMax: "",
    urgency: "MEDIUM",
    requiredQualifications: "",
    preferredQualifications: "",
    isRemoteOk: false,
    isRelocationRequired: false,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        minYearsExperience: form.minYearsExperience ? parseInt(form.minYearsExperience) : null,
        salaryRangeMin: form.salaryRangeMin ? parseFloat(form.salaryRangeMin) : null,
        salaryRangeMax: form.salaryRangeMax ? parseFloat(form.salaryRangeMax) : null,
        requiredQualifications: form.requiredQualifications
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        preferredQualifications: form.preferredQualifications
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await fetch("/api/cadre/employer/post-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create listing");
      router.push("/oncadre/employer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20";
  const inputStyle = {
    border: "1px solid #E8EBF0",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    minHeight: "44px",
  };

  return (
    <div className="max-w-2xl">
      <h1
        className="font-bold text-gray-900"
        style={{ fontSize: "clamp(1.4rem, 3vw, 1.75rem)" }}
      >
        Post a New Role
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Your listing will be published on the CadreHealth job board and visible
        to thousands of healthcare professionals.
      </p>

      {error && (
        <div
          className="mt-6 rounded-xl px-4 py-3 text-sm text-red-700"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Job title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Senior Medical Officer"
            required
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Cadre + Type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Cadre
            </label>
            <select
              value={form.cadre}
              onChange={(e) => update("cadre", e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Select cadre</option>
              {CADRE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Employment Type
            </label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
            >
              {MANDATE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-specialty */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Sub-specialty <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={form.subSpecialty}
            onChange={(e) => update("subSpecialty", e.target.value)}
            placeholder="e.g. Cardiology, Paediatrics"
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              State
            </label>
            <select
              value={form.locationState}
              onChange={(e) => update("locationState", e.target.value)}
              className={inputClass}
              style={inputStyle}
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
              City <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.locationCity}
              onChange={(e) => update("locationCity", e.target.value)}
              placeholder="e.g. Ikeja, Abuja"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Min experience + urgency */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Min. Years Experience <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              value={form.minYearsExperience}
              onChange={(e) => update("minYearsExperience", e.target.value)}
              placeholder="e.g. 3"
              min="0"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Urgency
            </label>
            <select
              value={form.urgency}
              onChange={(e) => update("urgency", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Salary range */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Salary Min (NGN/month) <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              value={form.salaryRangeMin}
              onChange={(e) => update("salaryRangeMin", e.target.value)}
              placeholder="e.g. 500000"
              min="0"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Salary Max (NGN/month) <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              value={form.salaryRangeMax}
              onChange={(e) => update("salaryRangeMax", e.target.value)}
              placeholder="e.g. 1000000"
              min="0"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
            rows={6}
            className={inputClass}
            style={{ ...inputStyle, minHeight: "120px" }}
          />
        </div>

        {/* Required qualifications */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Required Qualifications <span className="text-gray-400">(one per line)</span>
          </label>
          <textarea
            value={form.requiredQualifications}
            onChange={(e) => update("requiredQualifications", e.target.value)}
            placeholder={"MBBS or equivalent\nValid practicing license\n3+ years post-NYSC experience"}
            rows={4}
            className={inputClass}
            style={{ ...inputStyle, minHeight: "100px" }}
          />
        </div>

        {/* Preferred qualifications */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Preferred Qualifications <span className="text-gray-400">(one per line, optional)</span>
          </label>
          <textarea
            value={form.preferredQualifications}
            onChange={(e) => update("preferredQualifications", e.target.value)}
            placeholder={"Fellowship in relevant specialty\nExperience in private hospital setting"}
            rows={3}
            className={inputClass}
            style={{ ...inputStyle, minHeight: "80px" }}
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRemoteOk}
              onChange={(e) => update("isRemoteOk", e.target.checked)}
              className="rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
            />
            Remote work OK
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRelocationRequired}
              onChange={(e) => update("isRelocationRequired", e.target.checked)}
              className="rounded border-gray-300 text-[#0B3C5D] focus:ring-[#0B3C5D]"
            />
            Relocation required
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !form.title || !form.cadre}
          className="w-full rounded-xl py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)",
            boxShadow: "0 2px 8px rgba(11,60,93,0.25)",
            minHeight: "44px",
          }}
        >
          {loading ? "Publishing..." : "Publish Role"}
        </button>
      </form>
    </div>
  );
}
