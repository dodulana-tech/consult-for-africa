"use client";

import { useState } from "react";
import Link from "next/link";
import { CADRE_OPTIONS } from "@/lib/cadreHealth/cadres";

/* ─── types ────────────────────────────────────────────────────────────────── */

interface FormData {
  cadre: string;
  yearsOfExperience: number;
  hasFullRegistration: boolean;
  hasPracticingLicense: boolean;
  hasCOGS: boolean;
  postgraduateLevel: string;
  ieltsScore: string;
  oetPassed: boolean;
  plab1Passed: boolean;
  plab2Passed: boolean;
  usmlePassed: string;
  cpdPointsCurrent: number;
  cpdPointsRequired: number;
  additionalCerts: string[];
}

interface Scores {
  domestic: number;
  uk: number;
  us: number;
  canada: number;
  gulf: number;
  gaps: { area: string; action: string; impact: string }[];
}

/* ─── scoring logic ─────────────────────────────────────────────────────── */

function computeScores(data: FormData): Scores {
  const gaps: { area: string; action: string; impact: string }[] = [];

  // ── Domestic score ──
  let domestic = 20; // base for being a healthcare professional
  if (data.hasFullRegistration) domestic += 20;
  else gaps.push({ area: "Registration", action: "Complete full registration with your regulatory body", impact: "+20 domestic" });
  if (data.hasPracticingLicense) domestic += 15;
  else gaps.push({ area: "Practicing License", action: "Obtain and renew your annual practicing license", impact: "+15 domestic" });
  if (data.yearsOfExperience >= 1) domestic += 5;
  if (data.yearsOfExperience >= 3) domestic += 5;
  if (data.yearsOfExperience >= 5) domestic += 5;
  if (data.yearsOfExperience >= 10) domestic += 5;
  if (data.postgraduateLevel === "MASTERS") domestic += 5;
  if (data.postgraduateLevel === "FELLOWSHIP") domestic += 10;
  if (data.postgraduateLevel === "DOCTORATE") domestic += 10;
  if (data.cpdPointsCurrent >= data.cpdPointsRequired && data.cpdPointsRequired > 0) domestic += 5;
  else if (data.cpdPointsRequired > 0) gaps.push({ area: "CPD Points", action: `You have ${data.cpdPointsCurrent} of ${data.cpdPointsRequired} required points`, impact: "+5 domestic" });
  if (data.additionalCerts.length >= 1) domestic += 5;
  if (data.additionalCerts.length >= 3) domestic += 5;
  domestic = Math.min(domestic, 100);

  // ── UK score ──
  let uk = 10;
  if (data.hasFullRegistration) uk += 10;
  if (data.hasPracticingLicense) uk += 5;
  if (data.hasCOGS) uk += 15;
  else gaps.push({ area: "Certificate of Good Standing", action: "Apply for COGS from your regulatory body (required for UK GMC/NMC)", impact: "+15 UK" });

  const ielts = parseFloat(data.ieltsScore);
  if (!isNaN(ielts)) {
    if (ielts >= 7.5) uk += 20;
    else if (ielts >= 7.0) uk += 15;
    else if (ielts >= 6.5) uk += 10;
    else uk += 5;
  } else if (!data.oetPassed) {
    gaps.push({ area: "English Language", action: "Take IELTS (target 7.5) or OET (target Grade B)", impact: "+20 UK" });
  }
  if (data.oetPassed) uk += 20;

  if (data.cadre === "MEDICINE" || data.cadre === "DENTISTRY") {
    if (data.plab1Passed) uk += 10;
    else gaps.push({ area: "PLAB 1", action: "Pass PLAB 1 exam (can be taken in Lagos/Abuja)", impact: "+10 UK" });
    if (data.plab2Passed) uk += 15;
    else if (data.plab1Passed) gaps.push({ area: "PLAB 2", action: "Pass PLAB 2 exam (must travel to Manchester)", impact: "+15 UK" });
  } else {
    // Non-doctor cadres: NMC/HCPC registration path
    if (data.yearsOfExperience >= 2) uk += 10;
    if (data.postgraduateLevel !== "NONE" && data.postgraduateLevel) uk += 10;
  }
  if (data.yearsOfExperience >= 3) uk += 5;
  uk = Math.min(uk, 100);

  // ── US score ──
  let us = 10;
  if (data.hasFullRegistration) us += 10;
  if (data.hasCOGS) us += 10;
  if (data.cadre === "MEDICINE") {
    if (data.usmlePassed === "STEP1") us += 15;
    else if (data.usmlePassed === "STEP2") us += 25;
    else if (data.usmlePassed === "STEP3") us += 35;
    else gaps.push({ area: "USMLE", action: "Begin USMLE Step 1 preparation", impact: "+15-35 US" });
  }
  if (!isNaN(ielts) && ielts >= 7.0) us += 10;
  if (data.yearsOfExperience >= 3) us += 5;
  if (data.postgraduateLevel === "FELLOWSHIP" || data.postgraduateLevel === "DOCTORATE") us += 10;
  if (data.additionalCerts.includes("ACLS")) us += 5;
  if (data.additionalCerts.includes("BLS")) us += 5;
  us = Math.min(us, 100);

  // ── Canada score ──
  let canada = 10;
  if (data.hasFullRegistration) canada += 10;
  if (data.hasCOGS) canada += 10;
  if (!isNaN(ielts) && ielts >= 7.0) canada += 15;
  if (data.yearsOfExperience >= 3) canada += 10;
  if (data.postgraduateLevel === "FELLOWSHIP" || data.postgraduateLevel === "DOCTORATE") canada += 10;
  if (data.cadre === "NURSING" && data.yearsOfExperience >= 2) canada += 10;
  canada = Math.min(canada, 100);

  // ── Gulf score ──
  let gulf = 15;
  if (data.hasFullRegistration) gulf += 15;
  if (data.hasPracticingLicense) gulf += 10;
  if (data.hasCOGS) gulf += 15;
  else if (!gaps.find(g => g.area === "Certificate of Good Standing"))
    gaps.push({ area: "Certificate of Good Standing", action: "Required for Gulf Dataflow verification", impact: "+15 Gulf" });
  if (data.yearsOfExperience >= 2) gulf += 10;
  if (data.yearsOfExperience >= 5) gulf += 5;
  if (data.postgraduateLevel !== "NONE" && data.postgraduateLevel) gulf += 10;
  if (!isNaN(ielts) && ielts >= 6.0) gulf += 10;
  if (data.additionalCerts.length >= 1) gulf += 5;
  gulf = Math.min(gulf, 100);

  return { domestic, uk, us, canada, gulf, gaps };
}

/* ─── steps ─────────────────────────────────────────────────────────────── */

const CERT_OPTIONS = ["BLS", "ACLS", "ATLS", "ALSO", "NRP", "PALS", "Other"];

/* ─── component ─────────────────────────────────────────────────────────── */

export default function ReadinessAssessment() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Scores | null>(null);
  const [capture, setCapture] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [captureError, setCaptureError] = useState("");
  const [captureLoading, setCaptureLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    cadre: "",
    yearsOfExperience: 0,
    hasFullRegistration: false,
    hasPracticingLicense: false,
    hasCOGS: false,
    postgraduateLevel: "NONE",
    ieltsScore: "",
    oetPassed: false,
    plab1Passed: false,
    plab2Passed: false,
    usmlePassed: "NONE",
    cpdPointsCurrent: 0,
    cpdPointsRequired: 30,
    additionalCerts: [],
  });

  const update = (partial: Partial<FormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const toggleCert = (cert: string) =>
    setForm((prev) => ({
      ...prev,
      additionalCerts: prev.additionalCerts.includes(cert)
        ? prev.additionalCerts.filter((c) => c !== cert)
        : [...prev.additionalCerts, cert],
    }));

  // Step 3 -> compute scores, go to capture gate (step 4)
  const handleQuizComplete = () => {
    const result = computeScores(form);
    setScores(result);
    setStep(4); // capture gate
  };

  // Step 4 -> submit capture info, save to backend, reveal results (step 5)
  const handleCaptureSubmit = async () => {
    if (!capture.firstName.trim() || !capture.email.trim()) {
      setCaptureError("Name and email are required to see your results.");
      return;
    }
    if (!capture.email.includes("@")) {
      setCaptureError("Please enter a valid email address.");
      return;
    }
    setCaptureError("");
    setCaptureLoading(true);
    try {
      await fetch("/api/cadre/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scores,
          capture: {
            firstName: capture.firstName.trim(),
            lastName: capture.lastName.trim(),
            email: capture.email.trim().toLowerCase(),
            phone: capture.phone.trim(),
          },
        }),
      });
    } catch {
      // non-blocking - still show results even if save fails
    } finally {
      setCaptureLoading(false);
      setStep(5); // reveal results
    }
  };

  const isMedDent = form.cadre === "MEDICINE" || form.cadre === "DENTISTRY";

  /* ─── step renderers ──────────────────────────────────────────────────── */

  // Step 5: Full results
  if (step === 5 && scores) {
    return <ResultCard scores={scores} form={form} capture={capture} onReset={() => { setStep(0); setScores(null); setCapture({ firstName: "", lastName: "", email: "", phone: "" }); }} />;
  }

  // Step 4: Capture gate
  if (step === 4 && scores) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        {/* Teaser - show domestic score only, blurred international */}
        <div className="mb-6 rounded-xl bg-[#0B3C5D] p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40">Your score is ready</span>
            <span className="rounded-md bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">CadreHealth</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle cx="32" cy="32" r="27" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - scores.domestic / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold">{scores.domestic}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Domestic Employability</p>
              <p className="text-xs text-white/50 mt-0.5">
                {scores.domestic >= 70 ? "Strong profile" : scores.domestic >= 50 ? "Room to grow" : "Significant gaps to close"}
              </p>
            </div>
          </div>
          {/* Blurred international */}
          <div className="mt-4 grid grid-cols-4 gap-2 relative">
            <div className="absolute inset-0 backdrop-blur-sm bg-white/5 rounded-lg z-10 flex items-center justify-center">
              <span className="text-xs font-medium text-white/70">Enter your details to see full results</span>
            </div>
            {["UK", "US", "Canada", "Gulf"].map((c) => (
              <div key={c} className="rounded-md bg-white/5 p-2 text-center">
                <div className="text-sm font-bold text-white/30">--</div>
                <div className="text-[9px] text-white/20">{c}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Capture form */}
        <h3 className="text-lg font-bold text-gray-900">
          Almost there. See your full results.
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter your details to unlock your international readiness scores,
          personalized gap analysis, and career roadmap.
        </p>

        {captureError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {captureError}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">First name *</label>
              <input
                type="text"
                value={capture.firstName}
                onChange={(e) => setCapture(p => ({ ...p, firstName: e.target.value }))}
                placeholder="Chioma"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Last name</label>
              <input
                type="text"
                value={capture.lastName}
                onChange={(e) => setCapture(p => ({ ...p, lastName: e.target.value }))}
                placeholder="Okafor"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email address *</label>
            <input
              type="email"
              value={capture.email}
              onChange={(e) => setCapture(p => ({ ...p, email: e.target.value }))}
              placeholder="chioma@example.com"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Phone (WhatsApp)</label>
            <input
              type="tel"
              value={capture.phone}
              onChange={(e) => setCapture(p => ({ ...p, phone: e.target.value }))}
              placeholder="08012345678"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            />
          </div>
        </div>

        <button
          onClick={handleCaptureSubmit}
          disabled={captureLoading || !capture.firstName.trim() || !capture.email.trim()}
          className="mt-5 w-full rounded-lg py-3.5 text-sm font-semibold text-[#06090f] transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#D4AF37" }}
        >
          {captureLoading ? "Loading..." : "See my full results"}
        </button>

        <p className="mt-3 text-center text-[11px] text-gray-400">
          Your data is confidential. We will never share it without your permission.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      {/* Progress bar */}
      <div className="mb-8 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[#0B3C5D]" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            Your professional background
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years since qualification
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={form.yearsOfExperience || ""}
              onChange={(e) =>
                update({ yearsOfExperience: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              placeholder="e.g. 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Highest postgraduate qualification
            </label>
            <select
              value={form.postgraduateLevel}
              onChange={(e) => update({ postgraduateLevel: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
            >
              <option value="NONE">None</option>
              <option value="MASTERS">Masters degree (MSc, MPH, MBA, etc.)</option>
              <option value="FELLOWSHIP">Fellowship (FWACP, FMCP, FWACS, etc.)</option>
              <option value="DOCTORATE">Doctorate (PhD, MD)</option>
            </select>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!form.cadre}
            className="w-full rounded-lg bg-[#0B3C5D] py-3 text-base font-semibold text-white transition hover:bg-[#0A3350] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            Regulatory status
          </h2>

          <div className="space-y-4">
            <Toggle
              label="I have full registration with my regulatory body"
              checked={form.hasFullRegistration}
              onChange={(v) => update({ hasFullRegistration: v })}
            />
            <Toggle
              label="My annual practicing license is current"
              checked={form.hasPracticingLicense}
              onChange={(v) => update({ hasPracticingLicense: v })}
            />
            <Toggle
              label="I have a Certificate of Good Standing (COGS)"
              checked={form.hasCOGS}
              onChange={(v) => update({ hasCOGS: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPD points earned (this cycle)
              </label>
              <input
                type="number"
                min={0}
                value={form.cpdPointsCurrent || ""}
                onChange={(e) =>
                  update({ cpdPointsCurrent: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPD points required
              </label>
              <input
                type="number"
                min={0}
                value={form.cpdPointsRequired || ""}
                onChange={(e) =>
                  update({ cpdPointsRequired: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg bg-[#0B3C5D] py-3 text-base font-semibold text-white transition hover:bg-[#0A3350]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            International readiness
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IELTS overall score (leave blank if not taken)
            </label>
            <input
              type="text"
              value={form.ieltsScore}
              onChange={(e) => update({ ieltsScore: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
              placeholder="e.g. 7.5"
            />
          </div>

          <Toggle
            label="I have passed the OET"
            checked={form.oetPassed}
            onChange={(v) => update({ oetPassed: v })}
          />

          {isMedDent && (
            <>
              <Toggle
                label="I have passed PLAB 1"
                checked={form.plab1Passed}
                onChange={(v) => update({ plab1Passed: v })}
              />
              <Toggle
                label="I have passed PLAB 2"
                checked={form.plab2Passed}
                onChange={(v) => update({ plab2Passed: v })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USMLE progress
                </label>
                <select
                  value={form.usmlePassed}
                  onChange={(e) => update({ usmlePassed: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                >
                  <option value="NONE">Not started / Not applicable</option>
                  <option value="STEP1">Passed Step 1</option>
                  <option value="STEP2">Passed Step 2 CK</option>
                  <option value="STEP3">Passed Step 3</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 rounded-lg bg-[#0B3C5D] py-3 text-base font-semibold text-white transition hover:bg-[#0A3350]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            Additional certifications
          </h2>
          <p className="text-sm text-gray-500">
            Select any additional professional certifications you hold.
          </p>

          <div className="flex flex-wrap gap-3">
            {CERT_OPTIONS.map((cert) => (
              <button
                key={cert}
                onClick={() => toggleCert(cert)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  form.additionalCerts.includes(cert)
                    ? "bg-[#0B3C5D] text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cert}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleQuizComplete}
              className="flex-1 rounded-lg bg-[#D4AF37] py-3 text-base font-semibold text-[#0B3C5D] transition hover:bg-[#C4A030]"
            >
              See my score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Toggle component ──────────────────────────────────────────────────── */

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition hover:bg-gray-50">
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-[#0B3C5D]" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

/* ─── Result card (shareable) ───────────────────────────────────────────── */

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{score}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}

function ResultCard({
  scores,
  form,
  capture,
  onReset,
}: {
  scores: Scores;
  form: FormData;
  capture: { firstName: string; lastName: string; email: string; phone: string };
  onReset: () => void;
}) {
  const cadreLabel =
    CADRE_OPTIONS.find((c) => c.value === form.cadre)?.label ?? form.cadre;
  const displayName = capture.firstName ? `${capture.firstName}${capture.lastName ? ` ${capture.lastName}` : ""}` : "Your";

  return (
    <div className="space-y-8">
      {/* Score card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {displayName}&apos;s Career Readiness
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {cadreLabel} &middot; {form.yearsOfExperience} years experience
            </p>
          </div>
          <div className="rounded-lg bg-[#0B3C5D] px-3 py-1.5 text-xs font-semibold text-white">
            CadreHealth
          </div>
        </div>

        {/* Domestic score - hero */}
        <div className="mb-8 rounded-xl bg-gray-50 p-6 text-center">
          <ScoreRing score={scores.domestic} label="Domestic Employability" color="#10B981" />
        </div>

        {/* International scores */}
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
          International Readiness
        </h3>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <ScoreRing score={scores.uk} label="United Kingdom" color="#3B82F6" />
          <ScoreRing score={scores.us} label="United States" color="#8B5CF6" />
          <ScoreRing score={scores.canada} label="Canada" color="#EF4444" />
          <ScoreRing score={scores.gulf} label="Gulf States" color="#F59E0B" />
        </div>
      </div>

      {/* Gap analysis */}
      {scores.gaps.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">
            Your roadmap to higher scores
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Close these gaps to improve your readiness
          </p>
          <div className="mt-6 space-y-4">
            {scores.gaps.map((gap, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-lg border border-gray-100 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{gap.area}</div>
                  <div className="mt-0.5 text-sm text-gray-600">
                    {gap.action}
                  </div>
                  <div className="mt-1 text-xs font-medium text-emerald-600">
                    {gap.impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-[#0B3C5D]/20 bg-[#0B3C5D]/5 p-8 text-center">
        <h3 className="text-lg font-bold text-gray-900">
          Get your full personalized roadmap
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Create a free CadreHealth profile to track your progress, manage
          credentials, access salary data, and get matched to opportunities.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/oncadre/register"
            className="inline-flex items-center justify-center rounded-lg bg-[#0B3C5D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A3350]"
          >
            Create free profile
          </Link>
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Retake assessment
          </button>
        </div>
      </div>
    </div>
  );
}
