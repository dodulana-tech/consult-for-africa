"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  FileEdit,
  RotateCcw,
  AlertTriangle,
  Info,
} from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

// ---- Types ----------------------------------------------------------------

type FindingItem = {
  finding: string;
  detail: string;
  impact: string;
  severity: "critical" | "high" | "medium" | "low";
};

type RecommendationItem = {
  title: string;
  rationale: string;
  actions: string[];
  expectedOutcome: string;
  priority: "immediate" | "30days" | "90days" | "6months";
  estimatedImpact: string;
};

type RoadmapPhase = {
  phase: string;
  activities: string[];
  milestone: string;
};

type ReportContent = {
  reportTitle: string;
  preparedFor: string;
  reportType: string;
  executiveSummary: string;
  situationAssessment: string;
  keyFindings: FindingItem[];
  recommendations: RecommendationItem[];
  implementationRoadmap: RoadmapPhase[];
  conclusion: string;
  appendixNotes: string;
};

type ReportMetadata = {
  clientName: string;
  reportType: string;
  reportTypeLabel: string;
  hospitalType: string;
  hospitalTypeLabel: string;
  generatedAt: string;
};

// ---- Constants ------------------------------------------------------------

const REPORT_TYPES = [
  { value: "operations_assessment", label: "Operations Assessment" },
  { value: "revenue_cycle_audit", label: "Revenue Cycle Audit" },
  { value: "clinical_governance", label: "Clinical Governance Review" },
  { value: "health_systems", label: "Health Systems Strengthening" },
  { value: "strategic_review", label: "Strategic Review" },
  { value: "progress_update", label: "Progress Update" },
];

const HOSPITAL_TYPES = [
  { value: "private_elite", label: "Private Elite" },
  { value: "private_midtier", label: "Private Mid-Tier" },
  { value: "government", label: "Government / Public" },
  { value: "faith_based", label: "Faith-Based" },
  { value: "ngo_donor", label: "NGO / Donor-Funded" },
];

const SEVERITY_CONFIG: Record<
  FindingItem["severity"],
  { label: string; bg: string; color: string }
> = {
  critical: { label: "Critical", bg: "#FEF2F2", color: "#DC2626" },
  high: { label: "High", bg: "#FFF7ED", color: "#EA580C" },
  medium: { label: "Medium", bg: "#FEFCE8", color: "#CA8A04" },
  low: { label: "Low", bg: "#EFF6FF", color: "#2563EB" },
};

const PRIORITY_CONFIG: Record<
  RecommendationItem["priority"],
  { label: string; bg: string; color: string }
> = {
  immediate: { label: "Immediate", bg: "#FEF2F2", color: "#DC2626" },
  "30days": { label: "30 Days", bg: "#FFF7ED", color: "#EA580C" },
  "90days": { label: "90 Days", bg: "#F0FDF4", color: "#16A34A" },
  "6months": { label: "6 Months", bg: "#EFF6FF", color: "#2563EB" },
};

// ---- Shared UI helpers ----------------------------------------------------

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };
const labelClass = "text-xs font-medium text-gray-500 block mb-1";

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="rounded-xl bg-white overflow-hidden"
      style={{ border: "1px solid #e5eaf0" }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {open ? (
          <ChevronUp size={14} className="text-gray-400" />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: FindingItem["severity"] }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.low;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {severity === "critical" || severity === "high" ? (
        <AlertTriangle size={9} />
      ) : (
        <Info size={9} />
      )}
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: RecommendationItem["priority"] }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["90days"];
  return (
    <span
      className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ---- Report Result View ---------------------------------------------------

function buildPlainText(report: ReportContent, metadata: ReportMetadata): string {
  const date = new Date(metadata.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const lines: string[] = [
    report.reportTitle.toUpperCase(),
    `Prepared for: ${report.preparedFor}`,
    `Report Type: ${metadata.reportTypeLabel}`,
    `Date: ${date}`,
    "",
    "═".repeat(60),
    "",
    "1. EXECUTIVE SUMMARY",
    "",
    report.executiveSummary,
    "",
    "═".repeat(60),
    "",
    "2. SITUATION ASSESSMENT",
    "",
    report.situationAssessment,
    "",
    "═".repeat(60),
    "",
    "3. KEY FINDINGS",
    "",
    ...report.keyFindings.map(
      (f, i) =>
        `${i + 1}. ${f.finding} [${f.severity.toUpperCase()}]\n   ${f.detail}\n   Impact: ${f.impact}`
    ),
    "",
    "═".repeat(60),
    "",
    "4. RECOMMENDATIONS",
    "",
    ...report.recommendations.map(
      (r, i) =>
        `${i + 1}. ${r.title} [Priority: ${r.priority}]\n   Rationale: ${r.rationale}\n   Actions:\n${r.actions.map((a) => `   - ${a}`).join("\n")}\n   Expected Outcome: ${r.expectedOutcome}\n   Estimated Impact: ${r.estimatedImpact}`
    ),
    "",
    "═".repeat(60),
    "",
    "5. IMPLEMENTATION ROADMAP",
    "",
    ...report.implementationRoadmap.map(
      (p) =>
        `${p.phase}\nActivities:\n${p.activities.map((a) => `  - ${a}`).join("\n")}\nMilestone: ${p.milestone}`
    ),
    "",
    "═".repeat(60),
    "",
    "6. CONCLUSION",
    "",
    report.conclusion,
    "",
    "═".repeat(60),
    "",
    "APPENDIX / METHODOLOGY NOTES",
    "",
    report.appendixNotes,
  ];

  return lines.join("\n");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      style={{
        background: copied ? "#ECFDF5" : "#F3F4F6",
        color: copied ? "#059669" : "#374151",
      }}
    >
      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy Report Text"}
    </button>
  );
}

function ReportResult({
  report,
  metadata,
  onReset,
}: {
  report: ReportContent;
  metadata: ReportMetadata;
  onReset: () => void;
}) {
  const plainText = buildPlainText(report, metadata);
  const dateStr = new Date(metadata.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Success banner */}
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-3"
        style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Report Generated</p>
            <p className="text-xs text-emerald-600">
              {report.reportTitle} for {metadata.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CopyButton text={plainText} />
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "#F3F4F6", color: "#374151" }}
          >
            <RotateCcw size={12} />
            Start New Report
          </button>
        </div>
      </div>

      {/* Report Header Card */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#0F2744" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          {metadata.reportTypeLabel} &bull; {metadata.hospitalTypeLabel}
        </p>
        <h2 className="text-base font-bold text-white leading-snug">{report.reportTitle}</h2>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
          Prepared for {report.preparedFor} &bull; {dateStr}
        </p>
      </div>

      {/* Executive Summary */}
      <Section title="Executive Summary">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {report.executiveSummary}
        </p>
      </Section>

      {/* Situation Assessment */}
      <Section title="Situation Assessment" defaultOpen={false}>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {report.situationAssessment}
        </p>
      </Section>

      {/* Key Findings */}
      <Section title={`Key Findings (${report.keyFindings.length})`} defaultOpen={false}>
        <div className="space-y-3">
          {report.keyFindings.map((f, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{f.finding}</p>
                <SeverityBadge severity={f.severity} />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{f.detail}</p>
              <p className="text-xs font-medium text-gray-500">
                <span className="text-gray-700">Impact: </span>
                {f.impact}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Recommendations */}
      <Section title={`Recommendations (${report.recommendations.length})`} defaultOpen={false}>
        <div className="space-y-4">
          {report.recommendations.map((r, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 text-white"
                    style={{ background: "#0F2744" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                </div>
                <PriorityBadge priority={r.priority} />
              </div>
              <p className="text-xs text-gray-500 mb-3 ml-8">{r.rationale}</p>
              <div className="ml-8 space-y-1.5 mb-3">
                {r.actions.map((action, ai) => (
                  <div key={ai} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 text-white"
                      style={{ background: "#6B7280" }}
                    >
                      {ai + 1}
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
              <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  className="rounded-lg px-3 py-2"
                  style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}
                >
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Expected Outcome</p>
                  <p className="text-xs text-blue-900">{r.expectedOutcome}</p>
                </div>
                {r.estimatedImpact && (
                  <div
                    className="rounded-lg px-3 py-2"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                  >
                    <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-0.5">Estimated Impact</p>
                    <p className="text-xs text-green-900">{r.estimatedImpact}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Implementation Roadmap */}
      <Section title="Implementation Roadmap" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {report.implementationRoadmap.map((phase, i) => (
            <div
              key={i}
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 text-white"
                  style={{ background: "#0F2744" }}
                >
                  {i + 1}
                </span>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{phase.phase}</p>
              </div>
              <ul className="space-y-1 pl-1">
                {phase.activities.map((activity, ai) => (
                  <li key={ai} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {activity}
                  </li>
                ))}
              </ul>
              <div
                className="mt-auto rounded-lg px-2 py-1.5"
                style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}
              >
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Milestone</p>
                <p className="text-xs text-blue-900">{phase.milestone}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Conclusion */}
      <Section title="Conclusion" defaultOpen={false}>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report.conclusion}</p>
      </Section>

      {/* Appendix */}
      {report.appendixNotes && (
        <Section title="Appendix / Methodology Notes" defaultOpen={false}>
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{report.appendixNotes}</p>
        </Section>
      )}

      {/* Bottom actions */}
      <div className="flex gap-2 pt-2">
        <CopyButton text={plainText} />
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: "#F3F4F6", color: "#374151" }}
        >
          <RotateCcw size={12} />
          Start New Report
        </button>
      </div>
    </div>
  );
}

// ---- Main Component -------------------------------------------------------

export default function ReportGenerator() {
  const [form, setForm] = useState({
    reportType: "operations_assessment",
    clientName: "",
    hospitalType: "private_elite",
    keyFindings: "",
    recommendations: "",
    timeline: "",
    budget: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ report: ReportContent; metadata: ReportMetadata } | null>(null);

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function reset() {
    setResult(null);
    setError("");
    setForm({
      reportType: "operations_assessment",
      clientName: "",
      hospitalType: "private_elite",
      keyFindings: "",
      recommendations: "",
      timeline: "",
      budget: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!form.keyFindings.trim()) {
      setError("Key findings are required.");
      return;
    }
    if (!form.recommendations.trim()) {
      setError("Recommendations are required.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: form.reportType,
          clientName: form.clientName,
          hospitalType: form.hospitalType,
          keyFindings: form.keyFindings,
          recommendations: form.recommendations,
          timeline: form.timeline || undefined,
          budget: form.budget || undefined,
        }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res, "Failed to generate report.");
        setError(msg);
        return;
      }

      const data = await res.json();
      setResult({ report: data.report as ReportContent, metadata: data.metadata as ReportMetadata });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <ReportResult
        report={result.report}
        metadata={result.metadata}
        onReset={reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600"
          style={{ background: "#FEF2F2" }}
        >
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Report context */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Report Context</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Report Type *</label>
            <select
              value={form.reportType}
              onChange={(e) => setField("reportType", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Hospital Type *</label>
            <select
              value={form.hospitalType}
              onChange={(e) => setField("hospitalType", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {HOSPITAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Client Name *</label>
            <input
              value={form.clientName}
              onChange={(e) => setField("clientName", e.target.value)}
              placeholder="e.g. Eko Hospital Group"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Timeline (optional)</label>
            <input
              value={form.timeline}
              onChange={(e) => setField("timeline", e.target.value)}
              placeholder="e.g. 6-month engagement, Month 3 of 4"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass}>Budget Context (optional)</label>
            <input
              value={form.budget}
              onChange={(e) => setField("budget", e.target.value)}
              placeholder="e.g. NGN 48M project budget"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Key Findings *</h3>
        <p className="text-xs text-gray-400 mb-3">Your raw notes from the engagement. Nuru will structure and expand these.</p>
        <textarea
          value={form.keyFindings}
          onChange={(e) => setField("keyFindings", e.target.value)}
          rows={5}
          placeholder="Enter your key findings from the engagement. Be specific. Claude will polish and expand these."
          className={`${inputClass} resize-y`}
          style={inputStyle}
        />
      </div>

      {/* Recommendations */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Recommendations *</h3>
        <p className="text-xs text-gray-400 mb-3">Your core recommendations. Nuru will add rationale, action steps, and implementation timeline.</p>
        <textarea
          value={form.recommendations}
          onChange={(e) => setField("recommendations", e.target.value)}
          rows={4}
          placeholder="Your core recommendations. Nuru will add rationale, action steps, and implementation timeline."
          className={`${inputClass} resize-y`}
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: "#0F2744" }}
      >
        <FileEdit size={14} />
        {loading ? "Generating Report..." : "Generate Report"}
      </button>

      {loading && (
        <p className="text-center text-xs text-gray-400">
          Nuru is drafting your report. This takes 20-30 seconds...
        </p>
      )}
    </form>
  );
}
