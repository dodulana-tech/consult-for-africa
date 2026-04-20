"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, Loader2 } from "lucide-react";
import FileUpload from "@/components/shared/FileUpload";

const SPECIALTIES = [
  "Hospital Operations Management",
  "Clinical Governance & Quality",
  "Healthcare Turnaround & Recovery",
  "Digital Health & HIS Implementation",
  "Embedded Leadership",
  "Health Systems Strengthening",
  "Health Finance & Insurance (NHIS/HMO)",
  "Diaspora Healthcare Expertise",
  "Other",
];

const ENGAGEMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time (embedded)" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "PROJECT_BASED", label: "Project-based" },
  { value: "INTERIM", label: "Interim / fractional" },
  { value: "ADVISORY", label: "Advisory only" },
];

const WORK_AUTH = [
  { value: "nigerian_citizen", label: "Nigerian Citizen" },
  { value: "other_african_citizen", label: "Other African Citizen" },
  { value: "diaspora_willing_to_relocate", label: "Diaspora: willing to work in Africa" },
  { value: "diaspora_remote_only", label: "Diaspora: remote engagements only" },
];

const inputClass = "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744] bg-white";
const inputStyle = { borderColor: "#d1d5db" };
const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

type Step = 1 | 2 | 3;

export default function ApplicationForm() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ aiScore: number | null; message: string } | null>(null);

  const [form, setForm] = useState({
    track: "CONSULTANT",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    location: "",
    specialty: "",
    yearsExperience: "",
    currentRole: "",
    currentOrg: "",
    workAuthorization: "nigerian_citizen",
    engagementTypes: [] as string[],
    availableFrom: "",
    cvText: "",
    cvFileUrl: "",
    coverLetter: "",
    // Intern-specific
    university: "",
    programme: "",
    yearOfStudy: "",
    siwesEligible: false,
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleEngagement(val: string) {
    setForm((f) => ({
      ...f,
      engagementTypes: f.engagementTypes.includes(val)
        ? f.engagementTypes.filter((v) => v !== val)
        : [...f.engagementTypes, val],
    }));
  }

  function validateStep(s: Step): string {
    if (s === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.location) {
        return "Please fill in all required fields.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        return "Please enter a valid email address.";
      }
    }
    if (s === 2) {
      if (!form.specialty || !form.yearsExperience) {
        return "Please select your specialty and years of experience.";
      }
      if (form.engagementTypes.length === 0) {
        return "Please select at least one engagement type.";
      }
    }
    return "";
  }

  function next() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => (s < 3 ? (s + 1) as Step : s));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cvText && !form.cvFileUrl && !form.coverLetter) {
      setError("Please upload your CV, paste CV text, or write a cover letter.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/talent/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsExperience: Number(form.yearsExperience),
          availableFrom: form.availableFrom || undefined,
          cvFileUrl: form.cvFileUrl || undefined,
        }),
      });
      if (!res.ok) {
        let msg = "Failed to submit application. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // Response wasn't JSON (e.g. raw HTML error page) -- use default message
        }
        setError(msg);
        return;
      }
      const data = await res.json();
      setResult({ aiScore: data.aiScore, message: data.message });
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted && result) {
    return (
      <div className="text-center py-16 px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#D1FAE5" }}
        >
          <CheckCircle size={32} style={{ color: "#059669" }} />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: "#0F2744" }}>
          Application Submitted
        </h2>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
          {result.message}
        </p>
        {result.aiScore !== null && (
          <div className="inline-block rounded-xl px-6 py-4 mb-6" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Initial Compatibility Score</p>
            <p className="text-3xl font-bold" style={{ color: "#0F2744" }}>{result.aiScore}<span className="text-lg text-gray-400">/100</span></p>
          </div>
        )}
        <p className="text-xs text-gray-400">
          Reference your email address <strong>{form.email}</strong> for any follow-up queries.
        </p>
      </div>
    );
  }

  const stepLabels = ["Personal Details", "Professional Profile", "Your Application"];

  return (
    <div>
      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: s === step ? "#0F2744" : s < step ? "#10B981" : "#F3F4F6",
                color: s <= step ? "white" : "#9CA3AF",
              }}
            >
              {s < step ? "✓" : s}
            </div>
            <span className="text-xs font-medium hidden sm:block" style={{ color: s === step ? "#0F2744" : "#9CA3AF" }}>
              {stepLabels[s - 1]}
            </span>
            {s < 3 && <div className="flex-1 h-px" style={{ background: s < step ? "#10B981" : "#E5E7EB" }} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-600 px-4 py-3 rounded-lg mb-6" style={{ background: "#FEF2F2" }}>
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        {/* Step 1: Personal */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Track selection */}
            <div>
              <label className={labelClass}>I am applying as</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {[
                  { value: "CONSULTANT", label: "Consultant", desc: "Experienced professional" },
                  { value: "INTERN", label: "Intern", desc: "Student placement" },
                  { value: "SIWES", label: "SIWES Student", desc: "IT/SIWES placement" },
                  { value: "FELLOWSHIP", label: "Fellow", desc: "Graduate programme" },
                ].map((t) => (
                  <button key={t.value} type="button" onClick={() => setForm((f) => ({ ...f, track: t.value }))}
                    className="text-left rounded-lg border p-3 transition-all text-xs"
                    style={{ borderColor: form.track === t.value ? "#0F2744" : "#E5E7EB", background: form.track === t.value ? "#EFF6FF" : "white" }}>
                    <p className="font-semibold" style={{ color: form.track === t.value ? "#0F2744" : "#374151" }}>{t.label}</p>
                    <p className="text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="Adaeze" />
              </div>
              <div>
                <label className={labelClass}>Last Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="Okafor" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email Address <span className="text-red-400">*</span></label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className={inputClass} style={inputStyle} placeholder="adaeze@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="+234 800 000 0000" />
              </div>
              <div>
                <label className={labelClass}>Current Location <span className="text-red-400">*</span></label>
                <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="Lagos, Nigeria" />
              </div>
            </div>
            <div>
              <label className={labelClass}>LinkedIn Profile URL</label>
              <input type="url" value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)}
                className={inputClass} style={inputStyle} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        )}

        {/* Step 2: Professional */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Intern-specific fields */}
            {(form.track === "INTERN" || form.track === "SIWES") && (
              <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#D4AF37" + "40", background: "#D4AF37" + "08" }}>
                <p className="text-xs font-semibold" style={{ color: "#0F2744" }}>
                  {form.track === "SIWES" ? "SIWES Placement Details" : "Internship Details"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>University / Institution <span className="text-red-400">*</span></label>
                    <input value={form.university} onChange={(e) => set("university", e.target.value)}
                      className={inputClass} style={inputStyle} placeholder="e.g. University of Lagos" />
                  </div>
                  <div>
                    <label className={labelClass}>Programme <span className="text-red-400">*</span></label>
                    <select value={form.programme} onChange={(e) => set("programme", e.target.value)}
                      className={inputClass} style={inputStyle}>
                      <option value="">Select programme...</option>
                      <option value="Health Administration">Health Administration</option>
                      <option value="Public Health">Public Health</option>
                      <option value="Hospital Management">Hospital Management</option>
                      <option value="Health Information Management">Health Information Management</option>
                      <option value="Nursing Administration">Nursing Administration</option>
                      <option value="Health Economics">Health Economics</option>
                      <option value="Business Administration (Healthcare)">Business Administration (Healthcare)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Year of Study</label>
                    <select value={form.yearOfStudy} onChange={(e) => set("yearOfStudy", e.target.value)}
                      className={inputClass} style={inputStyle}>
                      <option value="">Select...</option>
                      <option value="200-level">200 Level</option>
                      <option value="300-level">300 Level</option>
                      <option value="400-level">400 Level</option>
                      <option value="500-level">500 Level</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Recent Graduate">Recent Graduate</option>
                    </select>
                  </div>
                  {form.track === "SIWES" && (
                    <div className="flex items-center gap-2 pt-5">
                      <input type="checkbox" checked={form.siwesEligible} onChange={(e) => setForm((f) => ({ ...f, siwesEligible: e.target.checked }))}
                        className="rounded border-gray-300" />
                      <label className="text-xs text-gray-600">I confirm I am eligible for SIWES through my institution</label>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{form.track === "INTERN" || form.track === "SIWES" ? "Current Role (if any)" : "Current Role / Title"}</label>
                <input type="text" value={form.currentRole} onChange={(e) => set("currentRole", e.target.value)}
                  className={inputClass} style={inputStyle} placeholder={form.track === "INTERN" || form.track === "SIWES" ? "e.g. Student, Class Representative" : "Chief Medical Director"} />
              </div>
              <div>
                <label className={labelClass}>{form.track === "INTERN" || form.track === "SIWES" ? "University" : "Current Organisation"}</label>
                <input type="text" value={form.currentOrg} onChange={(e) => set("currentOrg", e.target.value)}
                  className={inputClass} style={inputStyle} placeholder={form.track === "INTERN" || form.track === "SIWES" ? "Same as above or different" : "Lagos University Teaching Hospital"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Primary Specialty <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={form.specialty} onChange={(e) => set("specialty", e.target.value)}
                    className={`${inputClass} appearance-none pr-8`} style={inputStyle}>
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Years of Experience <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)}
                    className={`${inputClass} appearance-none pr-8`} style={inputStyle}>
                    <option value="">Select range</option>
                    {[
                      { label: "1-3 years", value: "1" },
                      { label: "3-5 years", value: "3" },
                      { label: "5-8 years", value: "5" },
                      { label: "8-12 years", value: "8" },
                      { label: "12-15 years", value: "12" },
                      { label: "15-20 years", value: "15" },
                      { label: "20+ years", value: "20" },
                    ].map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Work Authorisation</label>
              <div className="relative">
                <select value={form.workAuthorization} onChange={(e) => set("workAuthorization", e.target.value)}
                  className={`${inputClass} appearance-none pr-8`} style={inputStyle}>
                  {WORK_AUTH.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Preferred Engagement Types <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {ENGAGEMENT_TYPES.map((t) => (
                  <label key={t.value} className="flex items-center gap-2.5 p-3 rounded-lg cursor-pointer transition-colors"
                    style={{ border: `1px solid ${form.engagementTypes.includes(t.value) ? "#0F2744" : "#E5E7EB"}`, background: form.engagementTypes.includes(t.value) ? "#EFF6FF" : "white" }}>
                    <input type="checkbox" className="sr-only" checked={form.engagementTypes.includes(t.value)}
                      onChange={() => toggleEngagement(t.value)} />
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: form.engagementTypes.includes(t.value) ? "#0F2744" : "white", border: `1.5px solid ${form.engagementTypes.includes(t.value) ? "#0F2744" : "#D1D5DB"}` }}>
                      {form.engagementTypes.includes(t.value) && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className="text-xs text-gray-700">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Available From</label>
              <input type="date" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)}
                className={inputClass} style={inputStyle} />
            </div>
          </div>
        )}

        {/* Step 3: Application */}
        {step === 3 && (
          <div className="space-y-4">
            <FileUpload
              folder="cvs"
              isPublic
              accept=".pdf,.doc,.docx"
              label="Upload your CV"
              maxSizeMB={10}
              onUpload={({ url }) => set("cvFileUrl", url)}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full" style={{ borderTop: "1px solid #E5E7EB" }} />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] text-gray-400">Or paste your CV text below</span>
              </div>
            </div>

            <div>
              <label className={labelClass}>CV / Resume (paste text)</label>
              <p className="text-xs text-gray-400 mb-2">Copy and paste the text content of your CV.</p>
              <textarea
                value={form.cvText}
                onChange={(e) => set("cvText", e.target.value)}
                rows={10}
                placeholder="Paste your CV here..."
                className={`${inputClass} resize-none`}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass}>Cover Letter / Statement of Interest <span className="text-red-400">*</span></label>
              <p className="text-xs text-gray-500 mb-1">
                Written communication is a core consulting competency. This letter is evaluated as a writing sample.
              </p>
              <p className="text-xs text-gray-400 mb-3">
                In 400-800 words, articulate: (1) your specific expertise and how it maps to healthcare challenges in Africa,
                (2) a concrete example of institutional impact you have driven, and (3) why Consult For Africa specifically.
                Avoid generic statements. Write as you would for a hospital CEO or board audience.
              </p>
              <textarea
                value={form.coverLetter}
                onChange={(e) => set("coverLetter", e.target.value)}
                rows={12}
                placeholder={"Dear Consult For Africa Selection Committee,\n\nI am writing to express my interest in joining the Consult For Africa network as a...\n\nIn my current role as..., I led...\n\nThe specific value I would bring to C4A engagements is..."}
                className={`${inputClass} resize-none`}
                style={inputStyle}
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-gray-300">
                  {form.coverLetter ? `${form.coverLetter.split(/\s+/).filter(Boolean).length} words` : "0 words"}
                </p>
                {form.coverLetter && form.coverLetter.split(/\s+/).filter(Boolean).length < 200 && (
                  <p className="text-[10px] text-amber-500">We recommend at least 400 words for a strong submission</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid #f3f4f6" }}>
          {step > 1 ? (
            <button type="button" onClick={() => { setStep((s) => (s - 1) as Step); setError(""); }}
              className="px-5 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-700 font-medium">
              Back
            </button>
          ) : <div />}
          {step < 3 ? (
            <button type="button" onClick={next}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: "#0F2744" }}>
              Continue
            </button>
          ) : (
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#0F2744" }}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
