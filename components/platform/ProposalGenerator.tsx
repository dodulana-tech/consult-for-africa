"use client";

import { useState, useEffect } from "react";
import { Sparkles, FileText, Plus, X, Copy, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type ProposalContent = {
  executiveSummary: string;
  challengeStatement: string;
  proposedApproach: string;
  teamComposition: string;
  keyDeliverables: string[];
  investmentSummary: string;
  whyConsultForAfrica: string;
  nextSteps: string[];
};

type ProposalMetadata = {
  clientName: string;
  projectName: string;
  budgetRange: string;
  timeline: string;
  generatedAt: string;
};

const CLIENT_TYPES = [
  { value: "PRIVATE_ELITE", label: "Elite Private Hospital" },
  { value: "PRIVATE_MIDTIER", label: "Mid-tier Private Hospital" },
  { value: "GOVERNMENT", label: "Government/Public" },
  { value: "DEVELOPMENT", label: "Development Partner" },
];

const SERVICE_TYPES = [
  { value: "HOSPITAL_OPERATIONS", label: "Hospital Operations" },
  { value: "TURNAROUND", label: "Turnaround Management" },
  { value: "EMBEDDED_LEADERSHIP", label: "Embedded Leadership" },
  { value: "CLINICAL_GOVERNANCE", label: "Clinical Governance" },
  { value: "DIGITAL_HEALTH", label: "Digital Health" },
  { value: "HEALTH_SYSTEMS", label: "Health Systems" },
  { value: "DIASPORA_EXPERTISE", label: "Diaspora Expertise" },
  { value: "EM_AS_SERVICE", label: "EM as a Service" },
];

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-colors"
      style={{ background: copied ? "#ECFDF5" : "#F3F4F6", color: copied ? "#059669" : "#6B7280" }}
    >
      {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };
const labelClass = "text-xs font-medium text-gray-500 block mb-1";

export default function ProposalGenerator() {
  const [form, setForm] = useState({
    clientName: "",
    contactName: "",
    clientType: "PRIVATE_ELITE",
    serviceType: "HOSPITAL_OPERATIONS",
    projectName: "",
    budgetRange: "",
    timeline: "12 weeks",
    problems: [""],
    goals: [""],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ content: ProposalContent; metadata: ProposalMetadata } | null>(null);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("cfa_proposal_result");
      if (cached) setResult(JSON.parse(cached));
    } catch {}
  }, []);

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setProblem(i: number, val: string) {
    const updated = [...form.problems];
    updated[i] = val;
    setForm((f) => ({ ...f, problems: updated }));
  }

  function setGoal(i: number, val: string) {
    const updated = [...form.goals];
    updated[i] = val;
    setForm((f) => ({ ...f, goals: updated }));
  }

  function addProblem() { setForm((f) => ({ ...f, problems: [...f.problems, ""] })); }
  function removeProblem(i: number) {
    if (form.problems.length <= 1) return;
    setForm((f) => ({ ...f, problems: f.problems.filter((_, idx) => idx !== i) }));
  }

  function addGoal() { setForm((f) => ({ ...f, goals: [...f.goals, ""] })); }
  function removeGoal(i: number) {
    if (form.goals.length <= 1) return;
    setForm((f) => ({ ...f, goals: f.goals.filter((_, idx) => idx !== i) }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const problems = form.problems.filter((p) => p.trim());
    const goals = form.goals.filter((g) => g.trim());
    if (!form.clientName.trim() || problems.length === 0 || goals.length === 0) {
      setError("Client name, at least one problem, and one goal are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, problems, goals }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "Failed to generate proposal. Please try again.");
        return;
      }
      const data = await res.json();
      const newResult = { content: data.content, metadata: data.metadata };
      setResult(newResult);
      try { sessionStorage.setItem("cfa_proposal_result", JSON.stringify(newResult)); } catch {}
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const { content, metadata } = result;
    const fullText = `PROPOSAL: ${metadata.projectName}
Client: ${metadata.clientName}
Budget: ${metadata.budgetRange} | Timeline: ${metadata.timeline}
Generated: ${new Date(metadata.generatedAt).toLocaleDateString()}

EXECUTIVE SUMMARY
${content.executiveSummary}

THE CHALLENGE
${content.challengeStatement}

PROPOSED APPROACH
${content.proposedApproach}

TEAM COMPOSITION
${content.teamComposition}

KEY DELIVERABLES
${content.keyDeliverables.map((d, i) => `${i + 1}. ${d}`).join("\n")}

INVESTMENT SUMMARY
${content.investmentSummary}

WHY CONSULT FOR AFRICA
${content.whyConsultForAfrica}

NEXT STEPS
${content.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Proposal Generated</p>
              <p className="text-xs text-emerald-600">
                {metadata.projectName} for {metadata.clientName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CopyButton text={fullText} />
            <button
              onClick={() => { setResult(null); try { sessionStorage.removeItem("cfa_proposal_result"); } catch {} }}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "#F3F4F6", color: "#374151" }}
            >
              New Proposal
            </button>
          </div>
        </div>

        {/* Sections */}
        <Section title="Executive Summary">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.executiveSummary}</p>
        </Section>

        <Section title="The Challenge" defaultOpen={false}>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.challengeStatement}</p>
        </Section>

        <Section title="Proposed Approach" defaultOpen={false}>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.proposedApproach}</p>
        </Section>

        <Section title="Team Composition" defaultOpen={false}>
          <p className="text-sm text-gray-700 leading-relaxed">{content.teamComposition}</p>
        </Section>

        <Section title="Key Deliverables" defaultOpen={false}>
          <ul className="space-y-2">
            {content.keyDeliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span
                  className="mt-0.5 w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 text-white"
                  style={{ background: "#0F2744" }}
                >
                  {i + 1}
                </span>
                {d}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Investment Summary" defaultOpen={false}>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.investmentSummary}</p>
        </Section>

        <Section title="Why Consult For Africa" defaultOpen={false}>
          <p className="text-sm text-gray-700 leading-relaxed">{content.whyConsultForAfrica}</p>
        </Section>

        <Section title="Next Steps" defaultOpen={false}>
          <ol className="space-y-2">
            {content.nextSteps.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="font-semibold text-gray-400 w-5 shrink-0">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </Section>
      </div>
    );
  }

  return (
    <form onSubmit={generate} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Client info */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Client Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Client Name *</label>
            <input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)}
              placeholder="e.g. Lagoon Hospital" className={inputClass} style={inputStyle} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Contact Name</label>
            <input value={form.contactName} onChange={(e) => setField("contactName", e.target.value)}
              placeholder="e.g. Dr. Folasade Williams, CEO" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Client Type</label>
            <select value={form.clientType} onChange={(e) => setField("clientType", e.target.value)}
              className={inputClass} style={inputStyle}>
              {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Service Type</label>
            <select value={form.serviceType} onChange={(e) => setField("serviceType", e.target.value)}
              className={inputClass} style={inputStyle}>
              {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Project Name</label>
            <input value={form.projectName} onChange={(e) => setField("projectName", e.target.value)}
              placeholder="e.g. Revenue Cycle Transformation" className={inputClass} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3 col-span-2 sm:col-span-1">
            <div>
              <label className={labelClass}>Budget Range</label>
              <input value={form.budgetRange} onChange={(e) => setField("budgetRange", e.target.value)}
                placeholder="e.g. NGN 40-50M" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Timeline</label>
              <input value={form.timeline} onChange={(e) => setField("timeline", e.target.value)}
                placeholder="e.g. 12 weeks" className={inputClass} style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Problems */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Problems Identified *</h3>
        <div className="space-y-2">
          {form.problems.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={p}
                onChange={(e) => setProblem(i, e.target.value)}
                placeholder={`e.g. Revenue leakage NGN 15-20M/month`}
                className={`flex-1 ${inputClass}`}
                style={inputStyle}
              />
              {form.problems.length > 1 && (
                <button type="button" onClick={() => removeProblem(i)} className="text-gray-400 hover:text-red-500 px-1">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addProblem}
          className="mt-2 flex items-center gap-1 text-xs font-medium"
          style={{ color: "#0F2744" }}
        >
          <Plus size={12} /> Add Problem
        </button>
      </div>

      {/* Goals */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Client Goals *</h3>
        <div className="space-y-2">
          {form.goals.map((g, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={g}
                onChange={(e) => setGoal(i, e.target.value)}
                placeholder={`e.g. Reduce revenue leakage by 50%`}
                className={`flex-1 ${inputClass}`}
                style={inputStyle}
              />
              {form.goals.length > 1 && (
                <button type="button" onClick={() => removeGoal(i)} className="text-gray-400 hover:text-red-500 px-1">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addGoal}
          className="mt-2 flex items-center gap-1 text-xs font-medium"
          style={{ color: "#0F2744" }}
        >
          <Plus size={12} /> Add Goal
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: "#0F2744" }}
      >
        <Sparkles size={14} />
        {loading ? "Generating Proposal..." : "Generate with Nuru"}
      </button>
      {loading && (
        <p className="text-center text-xs text-gray-400">
          Nuru is writing your proposal. This takes 10-20 seconds.
        </p>
      )}
    </form>
  );
}
