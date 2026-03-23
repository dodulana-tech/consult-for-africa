"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  X,
  Save,
  Send,
  CheckCircle2,
  Clock,
  FileSearch,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Lightbulb,
  Target,
  TrendingUp,
  XCircle,
  Users,
  Sparkles,
  BarChart3,
} from "lucide-react";

type DebriefAssetLink = {
  id: string;
  action: string;
  notes: string | null;
  asset: {
    id: string;
    title: string;
    assetType: string;
    author: { id: string; name: string | null };
  };
};

type Debrief = {
  id: string;
  engagementId: string;
  summaryProblem: string | null;
  summaryApproach: string | null;
  summaryOutcome: string | null;
  whatWorkedJson: string[] | null;
  whatFailedJson: string[] | null;
  clientContext: string | null;
  newAssetsJson: string[] | null;
  sectorInsightsJson: string[] | null;
  submittedBy: string | null;
  reviewedBy: string | null;
  status: string;
  dueDate: string | null;
  submittedAt: string | null;
  assets: DebriefAssetLink[];
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: typeof Clock; label: string }> = {
  PENDING: { bg: "#FFF7ED", text: "#EA580C", icon: Clock, label: "Pending" },
  SUBMITTED: { bg: "#EFF6FF", text: "#3B82F6", icon: Send, label: "Submitted" },
  REVIEWED: { bg: "#ECFDF5", text: "#059669", icon: CheckCircle2, label: "Reviewed" },
  INSIGHTS_EXTRACTED: { bg: "#FAF5FF", text: "#9333EA", icon: Sparkles, label: "Insights Extracted" },
};

const STEPS = [
  { key: "problem", label: "Problem Summary", icon: Target },
  { key: "approach", label: "Approach Summary", icon: TrendingUp },
  { key: "outcome", label: "Outcome Summary", icon: CheckCircle2 },
  { key: "worked", label: "What Worked", icon: Lightbulb },
  { key: "failed", label: "What Failed", icon: XCircle },
  { key: "context", label: "Client Context", icon: Users },
  { key: "newAssets", label: "New Assets Created", icon: Sparkles },
  { key: "insights", label: "Sector Insights", icon: BarChart3 },
] as const;

export default function DebriefFlow({
  engagementId,
  engagementName,
}: {
  engagementId: string;
  engagementName: string;
}) {
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [summaryProblem, setSummaryProblem] = useState("");
  const [summaryApproach, setSummaryApproach] = useState("");
  const [summaryOutcome, setSummaryOutcome] = useState("");
  const [whatWorked, setWhatWorked] = useState<string[]>([]);
  const [whatFailed, setWhatFailed] = useState<string[]>([]);
  const [clientContext, setClientContext] = useState("");
  const [newAssets, setNewAssets] = useState<string[]>([]);
  const [sectorInsights, setSectorInsights] = useState<string[]>([]);

  const fetchDebrief = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${engagementId}/debrief`);
      if (res.ok) {
        const data = await res.json();
        if (data.debrief) {
          const d = data.debrief as Debrief;
          setDebrief(d);
          setSummaryProblem(d.summaryProblem ?? "");
          setSummaryApproach(d.summaryApproach ?? "");
          setSummaryOutcome(d.summaryOutcome ?? "");
          setWhatWorked((d.whatWorkedJson as string[]) ?? []);
          setWhatFailed((d.whatFailedJson as string[]) ?? []);
          setClientContext(d.clientContext ?? "");
          setNewAssets((d.newAssetsJson as string[]) ?? []);
          setSectorInsights((d.sectorInsightsJson as string[]) ?? []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [engagementId]);

  useEffect(() => {
    fetchDebrief();
  }, [fetchDebrief]);

  async function createDebrief() {
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${engagementId}/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchDebrief();
      }
    } finally {
      setCreating(false);
    }
  }

  async function saveDraft() {
    if (!debrief) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${engagementId}/debrief`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryProblem,
          summaryApproach,
          summaryOutcome,
          whatWorkedJson: whatWorked,
          whatFailedJson: whatFailed,
          clientContext,
          newAssetsJson: newAssets,
          sectorInsightsJson: sectorInsights,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDebrief(data.debrief);
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitDebrief() {
    if (!debrief) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${engagementId}/debrief`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryProblem,
          summaryApproach,
          summaryOutcome,
          whatWorkedJson: whatWorked,
          whatFailedJson: whatFailed,
          clientContext,
          newAssetsJson: newAssets,
          sectorInsightsJson: sectorInsights,
          status: "SUBMITTED",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDebrief(data.debrief);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (!debrief) {
    return (
      <div
        className="rounded-xl bg-white p-12 text-center"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <FileSearch className="mx-auto mb-3 text-gray-300" size={40} />
        <h3 className="text-sm font-semibold text-gray-700 mb-1">No Debrief Yet</h3>
        <p className="text-xs text-gray-500 mb-4">
          Capture learnings, outcomes, and insights from the {engagementName} engagement.
        </p>
        <button
          onClick={createDebrief}
          disabled={creating}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "#0F2744" }}
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Start Debrief
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[debrief.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;
  const isEditable = debrief.status === "PENDING" || debrief.status === "SUBMITTED";
  const step = STEPS[currentStep];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-xl bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Engagement Debrief</h3>
          <p className="text-xs text-gray-500">{engagementName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: statusConfig.bg, color: statusConfig.text }}
          >
            <StatusIcon size={10} />
            {statusConfig.label}
          </span>
          {isEditable && (
            <div className="flex items-center gap-2">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save Draft
              </button>
              <button
                onClick={submitDebrief}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                <Send size={12} /> Submit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div
        className="rounded-xl bg-white p-4"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            return (
              <button
                key={s.key}
                onClick={() => setCurrentStep(i)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
                style={{
                  background: isActive ? "#0F2744" : isCompleted ? "#F0F9FF" : "transparent",
                  color: isActive ? "#fff" : isCompleted ? "#0F2744" : "#9CA3AF",
                }}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div
        className="rounded-xl bg-white p-6"
        style={{ border: "1px solid #e5eaf0" }}
      >
        <div className="flex items-center gap-2 mb-4">
          {(() => {
            const Icon = step.icon;
            return <Icon size={16} style={{ color: "#0F2744" }} />;
          })()}
          <h4 className="text-sm font-semibold text-gray-900">{step.label}</h4>
          <span className="text-[10px] text-gray-400">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Problem / Approach / Outcome - text areas */}
        {step.key === "problem" && (
          <TextAreaStep
            value={summaryProblem}
            onChange={setSummaryProblem}
            placeholder="Describe the core problem or challenge the client was facing. What triggered the engagement?"
            disabled={!isEditable}
          />
        )}

        {step.key === "approach" && (
          <TextAreaStep
            value={summaryApproach}
            onChange={setSummaryApproach}
            placeholder="What methodology, frameworks, or approach did the team use? How was the work structured?"
            disabled={!isEditable}
          />
        )}

        {step.key === "outcome" && (
          <TextAreaStep
            value={summaryOutcome}
            onChange={setSummaryOutcome}
            placeholder="What were the key outcomes and deliverables? What impact did the engagement have?"
            disabled={!isEditable}
          />
        )}

        {step.key === "context" && (
          <TextAreaStep
            value={clientContext}
            onChange={setClientContext}
            placeholder="Describe the client context: industry dynamics, organisational culture, constraints, and relevant background."
            disabled={!isEditable}
          />
        )}

        {/* Dynamic lists */}
        {step.key === "worked" && (
          <DynamicListStep
            items={whatWorked}
            onChange={setWhatWorked}
            placeholder="Add something that worked well..."
            emptyMessage="No items added yet. What went well in this engagement?"
            disabled={!isEditable}
          />
        )}

        {step.key === "failed" && (
          <DynamicListStep
            items={whatFailed}
            onChange={setWhatFailed}
            placeholder="Add something that could be improved..."
            emptyMessage="No items added yet. What challenges or failures occurred?"
            disabled={!isEditable}
          />
        )}

        {step.key === "newAssets" && (
          <DynamicListStep
            items={newAssets}
            onChange={setNewAssets}
            placeholder="Describe a new asset created during this engagement..."
            emptyMessage="No new assets recorded. Were any frameworks, templates, or tools created?"
            disabled={!isEditable}
          />
        )}

        {step.key === "insights" && (
          <DynamicListStep
            items={sectorInsights}
            onChange={setSectorInsights}
            placeholder="Add a sector insight or learning..."
            emptyMessage="No insights recorded. What did you learn about the sector or market?"
            disabled={!isEditable}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> Previous
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: "#0F2744" }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : isEditable ? (
            <button
              onClick={submitDebrief}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Submit Debrief
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TextAreaStep({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={6}
      className="w-full px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none disabled:bg-gray-50 disabled:text-gray-500"
      style={{ border: "1px solid #e5eaf0" }}
    />
  );
}

function DynamicListStep({
  items,
  onChange,
  placeholder,
  emptyMessage,
  disabled,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  emptyMessage: string;
  disabled: boolean;
}) {
  const [newItem, setNewItem] = useState("");

  function addItem() {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem("");
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 text-sm text-gray-700"
            >
              <span className="text-xs font-medium text-gray-400 mt-0.5 flex-shrink-0">
                {i + 1}.
              </span>
              <span className="flex-1">{item}</span>
              {!disabled && (
                <button
                  onClick={() => removeItem(i)}
                  className="text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ border: "1px solid #e5eaf0" }}
          />
          <button
            onClick={addItem}
            disabled={!newItem.trim()}
            className="px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
