"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  User,
  CreditCard,
  ClipboardCheck,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { SPECIALTY_CATEGORIES, getServiceTypesForSpecialties } from "@/lib/specialties";

interface OnboardingData {
  status: string;
  assessmentLevel: string;
  profileCompleted: boolean;
  assessmentCompleted: boolean;
}

const LOCATIONS = [
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Port Harcourt, Nigeria",
  "Ibadan, Nigeria",
  "Kano, Nigeria",
  "Accra, Ghana",
  "Nairobi, Kenya",
  "Johannesburg, South Africa",
  "London, UK",
  "Dubai, UAE",
  "Other",
];

export default function OnboardingPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Profile fields
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [primarySpecialty, setPrimarySpecialty] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [isDiaspora, setIsDiaspora] = useState(false);
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Banking fields
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [currency, setCurrency] = useState("NGN");

  // Assessment fields
  const [scores, setScores] = useState<Record<string, number>>({});

  const fetchOnboarding = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.status === 404) {
        router.replace("/dashboard");
        return;
      }
      if (!res.ok) {
        router.replace("/dashboard");
        return;
      }
      const data = await res.json();
      if (data.status === "ACTIVE") {
        router.replace("/dashboard");
        return;
      }
      setOnboarding(data);

      // Resume at the right step based on onboarding status
      // Priority: assessmentCompleted flag is the most reliable signal
      if (data.assessmentCompleted) {
        // Assessment done, show confirmation (last step)
        setStep(getStepCount(data.assessmentLevel) - 1);
      } else if (data.status === "ASSESSMENT_PENDING" || data.bankingCompleted) {
        // Banking done, assessment pending - go to assessment step
        // For LIGHT level (no assessment), this is the confirmation step
        if (data.assessmentLevel === "LIGHT") {
          setStep(getStepCount(data.assessmentLevel) - 1);
        } else {
          setStep(3); // Assessment step
        }
      } else if (data.profileCompleted) {
        // Profile done, go to banking
        setStep(2);
      }
    } catch {
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.replace("/login");
      return;
    }
    fetchOnboarding();
  }, [session, sessionStatus, router, fetchOnboarding]);

  // Load bank list
  useEffect(() => {
    fetch("/api/paystack/banks")
      .then((r) => r.json())
      .then((data) => setBanks(data.banks ?? []))
      .catch(() => {});
  }, []);

  // Resolve account name when bank + account number are set
  useEffect(() => {
    if (!bankCode || !accountNumber || accountNumber.length < 10) return;
    setResolving(true);
    setResolveError("");
    const timeout = setTimeout(() => {
      fetch(`/api/paystack/resolve?account_number=${accountNumber}&bank_code=${bankCode}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.accountName) {
            setAccountName(data.accountName);
          } else {
            setResolveError(data.error || "Could not verify account");
          }
        })
        .catch(() => setResolveError("Could not verify account"))
        .finally(() => setResolving(false));
    }, 500); // debounce
    return () => clearTimeout(timeout);
  }, [bankCode, accountNumber]);

  function getStepCount(level: string) {
    // Welcome, Profile, Banking, Assessment (if needed), Confirmation
    if (level === "LIGHT") return 4; // Welcome, Profile, Banking, Confirmation
    return 5; // Welcome, Profile, Banking, Assessment, Confirmation
  }

  function getSteps(level: string) {
    const base = [
      { label: "Welcome", icon: Sparkles },
      { label: "Profile", icon: User },
      { label: "Banking", icon: CreditCard },
    ];
    if (level !== "LIGHT") {
      base.push({ label: "Assessment", icon: ClipboardCheck });
    }
    base.push({ label: "Confirmation", icon: PartyPopper });
    return base;
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          bio,
          location: location === "Other" ? customLocation : location,
          specialties,
          primarySpecialty: primarySpecialty || specialties[0] || null,
          expertiseAreas: getServiceTypesForSpecialties(specialties),
          yearsExperience: Number(yearsExperience),
          isDiaspora,
          hoursPerWeek: Number(hoursPerWeek),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text);
        return false;
      }
      return true;
    } catch {
      setError("Failed to save profile. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveBanking() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, accountNumber, accountName, swiftCode, currency }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text);
        return false;
      }
      return true;
    } catch {
      setError("Failed to save banking details. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAssessment() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text);
        return false;
      }
      return true;
    } catch {
      setError("Failed to save assessment. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        setError(text);
        return false;
      }
      return true;
    } catch {
      setError("Failed to complete onboarding. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    const level = onboarding?.assessmentLevel ?? "STANDARD";
    const totalSteps = getStepCount(level);

    if (step === 1) {
      // Save profile
      const ok = await saveProfile();
      if (!ok) return;
    } else if (step === 2) {
      // Save banking
      const ok = await saveBanking();
      if (!ok) return;
    } else if (step === 3 && level !== "LIGHT") {
      // Save assessment
      if (level === "FULL" || level === "MAAROVA") {
        // For FULL/MAAROVA, just move to confirmation (external Maarova assessment)
      } else {
        const ok = await saveAssessment();
        if (!ok) return;
      }
    }

    if (step === totalSteps - 2) {
      // Moving to the final confirmation step - complete onboarding
      await completeOnboarding();
    }

    if (step < totalSteps - 1) {
      setStep(step + 1);
      setError("");
    }
  }

  if (loading || sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center h-[100dvh]">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!onboarding) return null;

  const level = onboarding.assessmentLevel;
  const steps = getSteps(level);
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps - 1;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: done ? "#DCFCE7" : active ? "#EFF6FF" : "#F1F5F9",
                      color: done ? "#166534" : active ? "#0F2744" : "#94A3B8",
                    }}
                  >
                    {done ? (
                      <CheckCircle size={14} />
                    ) : (
                      <Icon size={14} />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight size={14} className="text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}
            >
              {error}
            </div>
          )}

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F2744" }}>
                Welcome to Consult For Africa
              </h1>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We are excited to have you join our network of healthcare management consultants.
                Before you get started, we need to set up your profile and get you ready for
                your first engagement.
              </p>

              <div
                className="rounded-xl p-6 mb-6"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
              >
                <h2 className="text-sm font-semibold mb-3" style={{ color: "#0F2744" }}>
                  What to expect
                </h2>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <User size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Profile setup</strong> - Tell us about your experience and expertise</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CreditCard size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Banking details</strong> - So we can pay you for your work</span>
                  </li>
                  {level !== "LIGHT" && (
                    <li className="flex items-start gap-3">
                      <ClipboardCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Skills assessment</strong> -{" "}
                        {level === "FULL" || level === "MAAROVA"
                          ? "Complete a Maarova leadership assessment"
                          : "Self-assess your expertise across our service areas"}
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                    <span><strong>Ready to go</strong> - Your profile will be reviewed and activated</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                This takes about {level === "FULL" || level === "MAAROVA" ? "10-15" : "5-10"} minutes. You can save and resume at any time.
              </p>
            </div>
          )}

          {/* Step 1: Profile Setup */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F2744" }}>
                Set up your profile
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                This information will appear on your consultant profile within CFA.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Healthcare Management Consultant"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Brief professional summary..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
                    >
                      <option value="">Select location</option>
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    {location === "Other" && (
                      <input
                        type="text"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        placeholder="Enter your location"
                        className="w-full mt-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
                    <input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      min={0}
                      max={50}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                  <p className="text-xs text-gray-400 mb-3">Select all that apply. Pick your primary specialty below.</p>
                  <div className="space-y-2">
                    {SPECIALTY_CATEGORIES.map((cat) => {
                      const isExpanded = expandedCategories.has(cat.key);
                      const selectedInCat = cat.specialties.filter((s) => specialties.includes(s.key));
                      return (
                        <div key={cat.key} className="rounded-lg" style={{ border: "1px solid #E2E8F0" }}>
                          <button
                            type="button"
                            onClick={() => setExpandedCategories((prev) => {
                              const next = new Set(prev);
                              if (next.has(cat.key)) next.delete(cat.key); else next.add(cat.key);
                              return next;
                            })}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-left"
                            style={{ color: "#0F2744" }}
                          >
                            <span>
                              {cat.label}
                              {selectedInCat.length > 0 && (
                                <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                                  {selectedInCat.length}
                                </span>
                              )}
                            </span>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                              {cat.specialties.map((s) => {
                                const selected = specialties.includes(s.key);
                                return (
                                  <button
                                    key={s.key}
                                    type="button"
                                    onClick={() => {
                                      setSpecialties((prev) =>
                                        selected ? prev.filter((k) => k !== s.key) : [...prev, s.key]
                                      );
                                      if (selected && primarySpecialty === s.key) setPrimarySpecialty("");
                                    }}
                                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                                    style={{
                                      background: selected ? "#0F2744" : "#F1F5F9",
                                      color: selected ? "#fff" : "#64748B",
                                      border: selected ? "1px solid #0F2744" : "1px solid #E2E8F0",
                                    }}
                                  >
                                    {s.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {specialties.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary specialty</label>
                    <select
                      value={primarySpecialty}
                      onChange={(e) => setPrimarySpecialty(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
                    >
                      <option value="">Select primary</option>
                      {specialties.map((key) => {
                        const cat = SPECIALTY_CATEGORIES.find((c) => c.specialties.some((s) => s.key === key));
                        const spec = cat?.specialties.find((s) => s.key === key);
                        return <option key={key} value={key}>{spec?.label ?? key}</option>;
                      })}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Used for your skills assessment scenario</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hours per week available</label>
                    <input
                      type="number"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                      min={5}
                      max={60}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDiaspora}
                        onChange={(e) => setIsDiaspora(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Diaspora-based consultant
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Banking Details */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F2744" }}>
                Banking details
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                We need your bank details so we can process payments for your engagements.
                This information is stored securely and only used for payroll.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <div className="flex gap-3">
                    {(["NGN", "USD"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: currency === c ? "#0F2744" : "#F1F5F9",
                          color: currency === c ? "#fff" : "#64748B",
                          border: currency === c ? "1px solid #0F2744" : "1px solid #E2E8F0",
                        }}
                      >
                        {c === "NGN" ? "Nigerian Naira (NGN)" : "US Dollar (USD)"}
                      </button>
                    ))}
                  </div>
                </div>

                {currency === "NGN" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                    <select
                      value={bankCode}
                      onChange={(e) => {
                        setBankCode(e.target.value);
                        const selected = banks.find((b) => b.code === e.target.value);
                        setBankName(selected?.name ?? "");
                        setAccountName("");
                        setResolveError("");
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    >
                      <option value="">Select your bank...</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {currency === "USD" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Chase Bank, Wise"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setAccountNumber(val);
                      if (val.length < 10) {
                        setAccountName("");
                        setResolveError("");
                      }
                    }}
                    placeholder="0123456789"
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  />
                  {currency === "NGN" && accountNumber.length === 10 && !bankCode && (
                    <p className="text-xs text-amber-600 mt-1">Select a bank to verify your account</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account name</label>
                  {resolving ? (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                      Verifying account...
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder={currency === "NGN" ? "Auto-filled when bank and account number are set" : "Full name on your bank account"}
                      readOnly={currency === "NGN" && !!accountName && !resolveError}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 ${
                        currency === "NGN" && accountName && !resolveError ? "bg-green-50 border-green-200 text-green-800 font-medium" : "border-gray-200"
                      }`}
                    />
                  )}
                  {resolveError && (
                    <p className="text-xs text-red-500 mt-1">{resolveError}. You can enter the account name manually.</p>
                  )}
                  {currency === "NGN" && accountName && !resolveError && !resolving && (
                    <p className="text-xs text-green-600 mt-1">Account verified</p>
                  )}
                </div>

                {currency === "USD" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SWIFT code <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={swiftCode}
                      onChange={(e) => setSwiftCode(e.target.value)}
                      placeholder="e.g. GTBINGLA"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Assessment (STANDARD or FULL only) */}
          {step === 3 && level !== "LIGHT" && (
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#0F2744" }}>
                Skills assessment
              </h1>

              {level === "MAAROVA" ? (
                <div>
                  <p className="text-gray-500 text-sm mb-6">
                    Your onboarding includes a Maarova leadership assessment. You will receive
                    a separate email with credentials to access the assessment portal.
                    Complete the assessment within 7 days.
                  </p>
                  <div
                    className="rounded-xl p-6"
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                  >
                    <h2 className="text-sm font-semibold mb-2" style={{ color: "#0F2744" }}>
                      Maarova Assessment Portal
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Complete the leadership assessment to help us understand your strengths
                      and match you with the right engagements.
                    </p>
                    <a
                      href="/maarova/portal/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{ background: "#0F2744", color: "#fff" }}
                    >
                      Open Maarova Portal
                      <ChevronRight size={14} />
                    </a>
                  </div>
                </div>
              ) : level === "FULL" ? (
                <div>
                  <p className="text-gray-500 text-sm mb-6">
                    Your onboarding includes a proctored skills assessment and a Maarova leadership
                    assessment. The skills assessment takes about 45 minutes and includes scenario-based
                    questions plus a short video response.
                  </p>
                  <div className="space-y-4">
                    <div
                      className="rounded-xl p-6"
                      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                    >
                      <h2 className="text-sm font-semibold mb-2" style={{ color: "#0F2744" }}>
                        1. Skills Assessment
                      </h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Complete a proctored assessment with scenario questions, experience review,
                        rapid-fire questions, and a video response.
                      </p>
                      <button
                        onClick={() => router.push("/onboarding/assessment/intro")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{ background: "#0F2744", color: "#fff" }}
                      >
                        Start Skills Assessment
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div
                      className="rounded-xl p-6"
                      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                    >
                      <h2 className="text-sm font-semibold mb-2" style={{ color: "#0F2744" }}>
                        2. Maarova Assessment Portal
                      </h2>
                      <p className="text-sm text-gray-600 mb-4">
                        You will receive a separate email with credentials to access the Maarova
                        assessment portal. Complete the assessment within 7 days.
                      </p>
                      <a
                        href="/maarova/portal/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{ background: "#0F2744", color: "#fff" }}
                      >
                        Open Maarova Portal
                        <ChevronRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-sm mb-6">
                    Complete a proctored skills assessment. This takes about 45 minutes and includes
                    scenario-based questions, experience review, rapid-fire questions, and a short
                    video response. Your responses will be reviewed by our team.
                  </p>

                  <div
                    className="rounded-xl p-6"
                    style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                  >
                    <h2 className="text-sm font-semibold mb-2" style={{ color: "#0F2744" }}>
                      What to expect
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-600 mb-5">
                      <li className="flex items-start gap-2">
                        <span className="text-xs text-gray-400 mt-0.5">1.</span>
                        <span>Scenario response (15 min)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-xs text-gray-400 mt-0.5">2.</span>
                        <span>Experience deep-dive (15 min)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-xs text-gray-400 mt-0.5">3.</span>
                        <span>Quick-fire questions (10 min)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-xs text-gray-400 mt-0.5">4.</span>
                        <span>Video response (5 min)</span>
                      </li>
                    </ul>

                    <button
                      onClick={() => router.push("/onboarding/assessment/intro")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{ background: "#0F2744", color: "#fff" }}
                    >
                      Begin Assessment
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Final step: Confirmation */}
          {isLastStep && (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: "#DCFCE7" }}
              >
                <CheckCircle size={32} style={{ color: "#166534" }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "#0F2744" }}>
                You are all set
              </h1>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {level === "LIGHT"
                  ? "Your profile has been activated. Welcome to Consult For Africa."
                  : "Your profile is now under review. A member of our team will review your details and activate your account, usually within 1-2 business days. You will receive an email when your profile is live."}
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "#D4AF37", color: "#06090f" }}
              >
                Go to Dashboard
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {!isLastStep && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                style={{ color: "#64748B" }}
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: "#0F2744", color: "#fff" }}
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {step === 0 ? "Get Started" : step === totalSteps - 2 ? "Complete" : "Continue"}
                {!saving && <ChevronRight size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
