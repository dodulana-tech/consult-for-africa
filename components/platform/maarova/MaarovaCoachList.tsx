"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Upload,
  X,
  ChevronDown,
  Star,
  Users,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Copy,
  Check,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────────────── */

type VettingStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "INTERVIEW_SCHEDULED"
  | "APPROVED"
  | "REJECTED";

interface Coach {
  id: string;
  name: string;
  email: string;
  title: string;
  bio: string;
  specialisms: string[];
  certifications: string[];
  country: string;
  city: string | null;
  yearsExperience: number;
  vettingStatus: VettingStatus;
  isActive: boolean;
  isPortalEnabled: boolean;
  activeClients: number;
  maxClients: number;
  avgSessionRating: number | string | null;
  totalSessions: number;
  completedEngagements: number;
  languages: string[];
  timezone: string;
  healthcareExperience: boolean;
  developmentFocus: string[];
  hourlyRate: number | string | null;
  currency: string;
  createdAt: string;
  _count: { matches: number };
}

/* ── Constants ───────────────────────────────────────────────────────────────── */

const VETTING_OPTIONS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Applied", value: "APPLIED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Interview Scheduled", value: "INTERVIEW_SCHEDULED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const VETTING_STYLES: Record<
  VettingStatus,
  { bg: string; color: string; label: string }
> = {
  APPLIED: { bg: "#FEF3C7", color: "#92400E", label: "Applied" },
  UNDER_REVIEW: { bg: "#DBEAFE", color: "#1E40AF", label: "Under Review" },
  INTERVIEW_SCHEDULED: {
    bg: "#EDE9FE",
    color: "#5B21B6",
    label: "Interview Scheduled",
  },
  APPROVED: { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
  REJECTED: { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
};

const AFRICAN_COUNTRIES = [
  "Nigeria",
  "Kenya",
  "South Africa",
  "Ghana",
  "Ethiopia",
  "Tanzania",
  "Rwanda",
  "Uganda",
  "Egypt",
  "Morocco",
  "Senegal",
  "Cameroon",
  "Ivory Coast",
  "Mozambique",
  "Zimbabwe",
  "Zambia",
  "Botswana",
  "Namibia",
  "Mauritius",
  "Malawi",
];
const OTHER_COUNTRIES = ["United Kingdom", "United States"];
const ALL_COUNTRIES = [...AFRICAN_COUNTRIES.sort(), ...OTHER_COUNTRIES];

const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Accra",
  "Africa/Addis_Ababa",
  "Africa/Dar_es_Salaam",
  "Africa/Kigali",
  "Africa/Kampala",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
];

const CURRENCIES = ["NGN", "USD", "GBP", "KES", "ZAR"];

const DEV_FOCUS_SUGGESTIONS = [
  "Emotional Intelligence",
  "Strategic Thinking",
  "Team Leadership",
  "Change Management",
  "Communication",
  "Conflict Resolution",
  "Decision Making",
  "Stakeholder Management",
  "Clinical Leadership",
  "Patient Safety Culture",
  "Healthcare Operations",
  "Board Governance",
];

const CSV_TEMPLATE = `name,email,title,bio,country,specialisms,certifications,yearsExperience,city,languages,timezone,healthcareExperience,developmentFocus,maxClients,hourlyRate,currency
"Jane Doe","jane@example.com","Executive Coach","Experienced coach...","Nigeria","Leadership;Change Management","ICF PCC;EMCC",15,"Lagos","English;Yoruba","Africa/Lagos",true,"Emotional Intelligence;Strategic Thinking",8,50000,"NGN"`;

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function formatRating(value: number | string | null): string {
  if (value === null || value === undefined) return "N/A";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "N/A";
  return n.toFixed(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── Tag Input Component ─────────────────────────────────────────────────────── */

function TagInput({
  tags,
  onChange,
  placeholder,
  suggestions,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (!suggestions || !input.trim()) return [];
    const lower = input.toLowerCase();
    return suggestions.filter(
      (s) => s.toLowerCase().includes(lower) && !tags.includes(s)
    );
  }, [suggestions, input, tags]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 p-2 rounded-lg text-sm min-h-[44px]"
        style={{ border: "1px solid #e5eaf0", background: "#fff" }}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ background: "#F3F4F6", color: "#374151" }}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="hover:text-red-600 transition-colors p-0.5"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (input.trim()) addTag(input);
            }
            if (e.key === "Backspace" && !input && tags.length > 0) {
              removeTag(tags.length - 1);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[100px] outline-none text-sm bg-transparent placeholder:text-gray-400"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="absolute z-20 mt-1 w-full rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              style={{ color: "#374151" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 sm:p-5 flex items-center gap-3"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent || "#F3F4F6" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-xl font-bold mt-0.5" style={{ color: "#0F2744" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Add Coach Slide-over ────────────────────────────────────────────────────── */

function AddCoachPanel({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    bio: "",
    specialisms: [] as string[],
    certifications: [] as string[],
    yearsExperience: "",
    country: "Nigeria",
    city: "",
    languages: ["English"],
    timezone: "Africa/Lagos",
    healthcareExperience: false,
    developmentFocus: [] as string[],
    maxClients: "8",
    hourlyRate: "",
    currency: "NGN",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        email: "",
        title: "",
        bio: "",
        specialisms: [],
        certifications: [],
        yearsExperience: "",
        country: "Nigeria",
        city: "",
        languages: ["English"],
        timezone: "Africa/Lagos",
        healthcareExperience: false,
        developmentFocus: [],
        maxClients: "8",
        hourlyRate: "",
        currency: "NGN",
      });
      setError("");
      setSuccess("");
      setSubmitting(false);
    }
  }, [open]);

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/maarova/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsExperience: parseInt(form.yearsExperience, 10) || 0,
          maxClients: parseInt(form.maxClients, 10) || 8,
          hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create coach");
        return;
      }
      setSuccess(`${data.coach.name} added successfully`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputClass =
    "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#D4A574]/40 placeholder:text-gray-400";
  const inputStyle = { border: "1px solid #e5eaf0", background: "#fff" };
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-0 lg:inset-y-0 lg:right-0 lg:left-auto z-50 flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full lg:w-[540px] bg-white flex flex-col lg:ml-auto shadow-2xl animate-in slide-in-from-right duration-300"
          style={{ borderLeft: "1px solid #e5eaf0" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid #e5eaf0" }}
          >
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                Add New Coach
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Add a coach to the network for vetting
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Status messages */}
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "#FEE2E2", color: "#991B1B" }}
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "#D1FAE5", color: "#065F46" }}
              >
                <CheckCircle size={14} className="shrink-0" />
                {success}
              </div>
            )}

            {/* Section: Basic */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#D4A574" }}
              >
                Basic Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Dr. Aisha Okafor"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="aisha@example.com"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass}>Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Executive Coach, ICF PCC"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section: Bio */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#D4A574" }}
              >
                Bio
              </h3>
              <label className={labelClass}>Professional Bio *</label>
              <textarea
                required
                rows={4}
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="A brief professional biography highlighting coaching experience, approach, and relevant background..."
                className={`${inputClass} resize-none`}
                style={inputStyle}
              />
            </div>

            {/* Section: Professional */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#D4A574" }}
              >
                Professional Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Specialisms *</label>
                  <TagInput
                    tags={form.specialisms}
                    onChange={(v) => update("specialisms", v)}
                    placeholder="Type and press Enter..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Certifications *</label>
                  <TagInput
                    tags={form.certifications}
                    onChange={(v) => update("certifications", v)}
                    placeholder="Type and press Enter..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Years of Experience *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={60}
                    value={form.yearsExperience}
                    onChange={(e) => update("yearsExperience", e.target.value)}
                    placeholder="15"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#D4A574" }}
              >
                Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Country *</label>
                  <div className="relative">
                    <select
                      required
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      {ALL_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Lagos"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Section: Matching */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#D4A574" }}
              >
                Matching Preferences
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Languages</label>
                  <TagInput
                    tags={form.languages}
                    onChange={(v) => update("languages", v)}
                    placeholder="Type and press Enter..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Timezone</label>
                  <div className="relative">
                    <select
                      value={form.timezone}
                      onChange={(e) => update("timezone", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "healthcareExperience",
                        !form.healthcareExperience
                      )
                    }
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      form.healthcareExperience ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                    style={{ minWidth: 44, minHeight: 24 }}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        form.healthcareExperience
                          ? "translate-x-4"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    Healthcare experience
                  </span>
                </div>
                <div>
                  <label className={labelClass}>Development Focus</label>
                  <TagInput
                    tags={form.developmentFocus}
                    onChange={(v) => update("developmentFocus", v)}
                    placeholder="Type or select..."
                    suggestions={DEV_FOCUS_SUGGESTIONS}
                  />
                </div>
              </div>
            </div>

            {/* Section: Capacity */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#D4A574" }}
              >
                Capacity
              </h3>
              <div>
                <label className={labelClass}>Maximum Clients</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.maxClients}
                  onChange={(e) => update("maxClients", e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Section: Financial */}
            <div>
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#D4A574" }}
              >
                Financial
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Hourly Rate</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.hourlyRate}
                    onChange={(e) => update("hourlyRate", e.target.value)}
                    placeholder="50000"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <div className="relative">
                    <select
                      value={form.currency}
                      onChange={(e) => update("currency", e.target.value)}
                      className={`${inputClass} appearance-none pr-8`}
                      style={inputStyle}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 pb-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#0F2744", minHeight: 44 }}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {submitting ? "Adding Coach..." : "Add Coach"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* ── Bulk Upload Modal ───────────────────────────────────────────────────────── */

function BulkUploadModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"input" | "preview" | "result">("input");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<Record<string, string | string[] | boolean | number>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("input");
    setRawText("");
    setParsed([]);
    setParseErrors([]);
    setResult(null);
  };

  const parseCSV = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setParseErrors(["CSV must have a header row and at least one data row"]);
      return;
    }

    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, string | string[] | boolean | number>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string | string[] | boolean | number> = {};

      headers.forEach((h, idx) => {
        const val = values[idx]?.trim() || "";
        const arrayFields = [
          "specialisms",
          "certifications",
          "languages",
          "developmentFocus",
        ];
        if (arrayFields.includes(h)) {
          row[h] = val
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (h === "healthcareExperience") {
          row[h] = val.toLowerCase() === "true";
        } else if (h === "yearsExperience" || h === "maxClients") {
          row[h] = parseInt(val, 10) || 0;
        } else if (h === "hourlyRate") {
          row[h] = val ? parseFloat(val) : 0;
        } else {
          row[h] = val;
        }
      });

      if (!row.name || !row.email || !row.title || !row.bio || !row.country) {
        errors.push(
          `Row ${i}: Missing required fields (name, email, title, bio, country)`
        );
      } else {
        rows.push(row);
      }
    }

    setParsed(rows);
    setParseErrors(errors);
    if (rows.length > 0) setStep("preview");
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/maarova/admin/coaches/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coaches: parsed }),
      });
      const data = await res.json();
      setResult(data);
      setStep("result");
      if (data.created > 0) {
        onSuccess();
      }
    } catch {
      setResult({ created: 0, skipped: 0, errors: ["Network error"] });
      setStep("result");
    } finally {
      setSubmitting(false);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(CSV_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => {
          reset();
          onClose();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{ border: "1px solid #e5eaf0" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} style={{ color: "#D4A574" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                Bulk Upload Coaches
              </h2>
            </div>
            <button
              onClick={() => {
                reset();
                onClose();
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {step === "input" && (
              <>
                {/* Template */}
                <div
                  className="rounded-lg p-4"
                  style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">
                      CSV Format
                    </p>
                    <button
                      onClick={copyTemplate}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                      style={{ minHeight: 32 }}
                    >
                      {copied ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} className="text-gray-500" />
                      )}
                      {copied ? "Copied" : "Copy Template"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Use semicolons to separate multiple values in array fields
                    (specialisms, certifications, languages, developmentFocus).
                    Maximum 50 coaches per upload.
                  </p>
                  <div className="overflow-x-auto">
                    <pre className="text-[11px] text-gray-600 whitespace-pre overflow-x-auto">
                      {CSV_TEMPLATE}
                    </pre>
                  </div>
                </div>

                {/* File upload */}
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-8 rounded-lg transition-colors hover:bg-gray-50"
                    style={{
                      border: "2px dashed #e5eaf0",
                      minHeight: 44,
                    }}
                  >
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Click to upload CSV file
                    </span>
                    <span className="text-xs text-gray-400">
                      or paste CSV content below
                    </span>
                  </button>
                </div>

                {/* Paste area */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Or paste CSV content
                  </label>
                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your CSV data here..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none font-mono placeholder:text-gray-400"
                    style={{ border: "1px solid #e5eaf0" }}
                  />
                </div>

                {parseErrors.length > 0 && (
                  <div
                    className="rounded-lg p-3 space-y-1"
                    style={{ background: "#FEE2E2" }}
                  >
                    {parseErrors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => parseCSV(rawText)}
                  disabled={!rawText.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#0F2744", minHeight: 44 }}
                >
                  Parse and Preview
                </button>
              </>
            )}

            {step === "preview" && (
              <>
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: "#DBEAFE", color: "#1E40AF" }}
                >
                  <CheckCircle size={14} />
                  {parsed.length} coach{parsed.length !== 1 ? "es" : ""} parsed
                  successfully
                  {parseErrors.length > 0 &&
                    `, ${parseErrors.length} row${parseErrors.length !== 1 ? "s" : ""} skipped`}
                </div>

                <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e5eaf0" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "#F9FAFB" }}>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">
                          Name
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">
                          Email
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">
                          Title
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">
                          Country
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((row, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: "1px solid #F3F4F6" }}
                        >
                          <td className="px-3 py-2 text-gray-800">
                            {String(row.name || "")}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {String(row.email || "")}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {String(row.title || "")}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {String(row.country || "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("input")}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-100"
                    style={{
                      border: "1px solid #e5eaf0",
                      color: "#374151",
                      minHeight: 44,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: "#0F2744", minHeight: 44 }}
                  >
                    {submitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {submitting
                      ? "Uploading..."
                      : `Upload ${parsed.length} Coach${parsed.length !== 1 ? "es" : ""}`}
                  </button>
                </div>
              </>
            )}

            {step === "result" && result && (
              <>
                <div className="text-center py-4">
                  {result.created > 0 ? (
                    <CheckCircle
                      size={40}
                      className="mx-auto mb-3"
                      style={{ color: "#10B981" }}
                    />
                  ) : (
                    <AlertCircle
                      size={40}
                      className="mx-auto mb-3"
                      style={{ color: "#EF4444" }}
                    />
                  )}
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "#0F2744" }}
                  >
                    Upload Complete
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div
                    className="rounded-lg p-2 sm:p-3"
                    style={{ background: "#D1FAE5" }}
                  >
                    <p className="text-lg font-bold text-emerald-700">
                      {result.created}
                    </p>
                    <p className="text-xs text-emerald-600">Created</p>
                  </div>
                  <div
                    className="rounded-lg p-2 sm:p-3"
                    style={{ background: "#FEF3C7" }}
                  >
                    <p className="text-lg font-bold text-amber-700">
                      {result.skipped}
                    </p>
                    <p className="text-xs text-amber-600">Skipped</p>
                  </div>
                  <div
                    className="rounded-lg p-2 sm:p-3"
                    style={{ background: "#FEE2E2" }}
                  >
                    <p className="text-lg font-bold text-red-700">
                      {result.errors.length}
                    </p>
                    <p className="text-xs text-red-600">Errors</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div
                    className="rounded-lg p-3 max-h-32 overflow-y-auto space-y-1"
                    style={{ background: "#FEF2F2" }}
                  >
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#0F2744", minHeight: 44 }}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Enable Portal Button ────────────────────────────────────────────────────── */

function EnablePortalButton({
  coachId,
  onDone,
}: {
  coachId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Enable portal access for this coach? They will receive login credentials via email.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/maarova/admin/coaches/${coachId}/enable`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to enable portal");
      }
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to enable portal";
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={enable}
      disabled={loading}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-emerald-100"
      style={{ color: "#065F46", minHeight: 32 }}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <ShieldCheck size={12} />
      )}
      Enable Portal
    </button>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────────── */

export default function MaarovaCoachList({ coaches }: { coaches: Coach[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = coaches;
    if (statusFilter !== "ALL") {
      list = list.filter((c) => c.vettingStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      );
    }
    return list;
  }, [coaches, statusFilter, search]);

  const stats = useMemo(() => {
    const approved = coaches.filter((c) => c.vettingStatus === "APPROVED").length;
    const pending = coaches.filter(
      (c) =>
        c.vettingStatus === "APPLIED" ||
        c.vettingStatus === "UNDER_REVIEW" ||
        c.vettingStatus === "INTERVIEW_SCHEDULED"
    ).length;
    const activeEngagements = coaches.reduce(
      (sum, c) => sum + c.activeClients,
      0
    );
    return { total: coaches.length, approved, pending, activeEngagements };
  }, [coaches]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Users size={18} style={{ color: "#0F2744" }} />}
          label="Total Coaches"
          value={stats.total}
          accent="#F0F4F8"
        />
        <StatCard
          icon={<CheckCircle size={18} style={{ color: "#10B981" }} />}
          label="Approved"
          value={stats.approved}
          accent="#D1FAE5"
        />
        <StatCard
          icon={<Clock size={18} style={{ color: "#F59E0B" }} />}
          label="Pending Review"
          value={stats.pending}
          accent="#FEF3C7"
        />
        <StatCard
          icon={<Star size={18} style={{ color: "#D4A574" }} />}
          label="Active Engagements"
          value={stats.activeEngagements}
          accent="#FDF6EF"
        />
      </div>

      {/* Filters and Actions */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coaches by name, email, title, or country..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-[#D4A574]/40 placeholder:text-gray-400"
              style={{ border: "1px solid #e5eaf0", minHeight: 44 }}
            />
          </div>

          {/* Status filter */}
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-[#D4A574]/40"
              style={{ border: "1px solid #e5eaf0", minHeight: 44 }}
            >
              {VETTING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ border: "1px solid #e5eaf0", color: "#374151", minHeight: 44 }}
            >
              <Upload size={14} />
              <span className="hidden sm:inline">Bulk Upload</span>
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#0F2744", minHeight: 44 }}
            >
              <Plus size={14} />
              Add Coach
            </button>
          </div>
        </div>

        {/* Active filter info */}
        {(statusFilter !== "ALL" || search.trim()) && (
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <p className="text-xs text-gray-400">
              Showing {filtered.length} of {coaches.length} coaches
            </p>
            {(statusFilter !== "ALL" || search.trim()) && (
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearch("");
                }}
                className="text-xs font-medium hover:underline"
                style={{ color: "#D4A574" }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div
        className="hidden lg:block rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name / Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Country
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Vetting
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Portal
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Clients
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Rating
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coach) => {
                const vStyle = VETTING_STYLES[coach.vettingStatus];
                const rating = formatRating(coach.avgSessionRating);
                return (
                  <tr
                    key={coach.id}
                    onClick={() =>
                      router.push(`/admin/maarova/coaches/${coach.id}`)
                    }
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td className="px-5 py-3">
                      <p
                        className="text-sm font-medium group-hover:underline"
                        style={{ color: "#0F2744" }}
                      >
                        {coach.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {coach.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">
                      {coach.title}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {coach.country}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: vStyle.bg,
                          color: vStyle.color,
                        }}
                      >
                        {vStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs"
                        style={{
                          color: coach.isPortalEnabled
                            ? "#10B981"
                            : "#9CA3AF",
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{
                            background: coach.isPortalEnabled
                              ? "#10B981"
                              : "#D1D5DB",
                          }}
                        />
                        {coach.isPortalEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {coach.activeClients} / {coach.maxClients}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Star
                          size={12}
                          style={{
                            color: "#D4A574",
                            fill:
                              rating !== "N/A" ? "#D4A574" : "transparent",
                          }}
                        />
                        <span
                          className="font-medium"
                          style={{ color: "#0F2744" }}
                        >
                          {rating}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {coach.vettingStatus === "APPROVED" &&
                        !coach.isPortalEnabled && (
                          <EnablePortalButton
                            coachId={coach.id}
                            onDone={refresh}
                          />
                        )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-gray-400 text-sm"
                  >
                    {coaches.length === 0
                      ? "No coaches yet. Add your first coach to get started."
                      : "No coaches match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((coach) => {
          const vStyle = VETTING_STYLES[coach.vettingStatus];
          const rating = formatRating(coach.avgSessionRating);
          return (
            <div
              key={coach.id}
              onClick={() =>
                router.push(`/admin/maarova/coaches/${coach.id}`)
              }
              className="rounded-xl p-4 transition-all active:scale-[0.99] cursor-pointer"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              {/* Top row: name + badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "#0F2744" }}
                  >
                    {coach.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {coach.email}
                  </p>
                </div>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                  style={{ background: vStyle.bg, color: vStyle.color }}
                >
                  {vStyle.label}
                </span>
              </div>

              {/* Title */}
              <p className="text-xs text-gray-600 mt-2 truncate">
                {coach.title}
              </p>

              {/* Details row */}
              <div
                className="flex items-center gap-4 mt-3 pt-3 flex-wrap"
                style={{ borderTop: "1px solid #F3F4F6" }}
              >
                <span className="text-[11px] text-gray-500">
                  {coach.country}
                </span>
                <span className="text-[11px] text-gray-500">
                  {coach.activeClients}/{coach.maxClients} clients
                </span>
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Star
                    size={10}
                    style={{
                      color: "#D4A574",
                      fill: rating !== "N/A" ? "#D4A574" : "transparent",
                    }}
                  />
                  <span style={{ color: "#0F2744" }}>{rating}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{
                      background: coach.isPortalEnabled
                        ? "#10B981"
                        : "#D1D5DB",
                    }}
                  />
                  <span
                    style={{
                      color: coach.isPortalEnabled ? "#10B981" : "#9CA3AF",
                    }}
                  >
                    Portal
                  </span>
                </span>
              </div>

              {/* Actions */}
              {coach.vettingStatus === "APPROVED" &&
                !coach.isPortalEnabled && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid #F3F4F6" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EnablePortalButton
                      coachId={coach.id}
                      onDone={refresh}
                    />
                  </div>
                )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            className="rounded-xl p-6 sm:p-8 text-center"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <p className="text-sm text-gray-400">
              {coaches.length === 0
                ? "No coaches yet. Add your first coach to get started."
                : "No coaches match your filters."}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCoachPanel
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={refresh}
      />
      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
