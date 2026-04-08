"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  Clock,
  Star,
  ChevronRight,
  Loader2,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import StatusBadge from "../StatusBadge";
import { DeliverableFeeEditor, AssignDeliverableDropdown } from "./DeliverableHelpers";
import type { Project, Deliverable } from "./types";
import { formatDate, timeAgo } from "@/lib/utils";

export default function DeliverablesTab({
  project,
  filter,
  onFilterChange,
  filteredDeliverables,
  isEM,
}: {
  project: Project;
  filter: string;
  onFilterChange: (f: string) => void;
  filteredDeliverables: Deliverable[];
  isEM: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDeliv, setNewDeliv] = useState({ name: "", description: "", dueDate: "", assignmentId: "" });
  const [extraDeliverables, setExtraDeliverables] = useState<Deliverable[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSuggestion, setPricingSuggestion] = useState<{
    estimatedHours: number;
    complexityLevel: string;
    suggestedPriceNGN: { low: number; mid: number; high: number };
    suggestedPriceUSD: { low: number; mid: number; high: number };
    recommendedTier: string;
    rationale: string;
  } | null>(null);

  async function getPricing() {
    if (!newDeliv.name.trim()) return;
    setPricingLoading(true);
    setPricingSuggestion(null);
    try {
      const res = await fetch("/api/ai/price-deliverable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableName: newDeliv.name,
          description: newDeliv.description,
          serviceType: project.serviceType,
        }),
      });
      if (res.ok) {
        const { pricing } = await res.json();
        setPricingSuggestion(pricing);
      }
    } catch {}
    finally { setPricingLoading(false); }
  }
  const [suggestions, setSuggestions] = useState<{ name: string; description: string }[]>([]);
  const [addingSuggestion, setAddingSuggestion] = useState<number | null>(null);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<number>>(new Set());

  const allDeliverables = [...extraDeliverables, ...filteredDeliverables];

  async function createDeliverable() {
    if (!newDeliv.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeliv),
      });
      if (res.ok) {
        const { deliverable } = await res.json();
        setExtraDeliverables((prev) => [deliverable, ...prev]);
        setNewDeliv({ name: "", description: "", dueDate: "", assignmentId: "" });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function suggestDeliverables() {
    setSuggesting(true);
    setSuggestions([]);
    setAddedSuggestions(new Set());
    try {
      const res = await fetch(`/api/projects/${project.id}/deliverables/suggest`, { method: "POST" });
      if (res.ok) {
        const { suggestions: data } = await res.json();
        setSuggestions(data);
      }
    } finally {
      setSuggesting(false);
    }
  }

  async function addSuggested(s: { name: string; description: string }, idx: number) {
    setAddingSuggestion(idx);
    try {
      const res = await fetch(`/api/projects/${project.id}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name, description: s.description }),
      });
      if (res.ok) {
        const { deliverable } = await res.json();
        setExtraDeliverables((prev) => [deliverable, ...prev]);
        setAddedSuggestions((prev) => new Set([...prev, idx]));
      }
    } finally {
      setAddingSuggestion(null);
    }
  }

  const filters = [
    { key: "all", label: "All", count: project.deliverables.length },
    {
      key: "pending",
      label: "Pending Review",
      count: project.deliverables.filter((d) => d.status === "SUBMITTED" || d.status === "IN_REVIEW").length,
    },
    {
      key: "approved",
      label: "Approved",
      count: project.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT").length,
    },
    {
      key: "revision",
      label: "Needs Revision",
      count: project.deliverables.filter((d) => d.status === "NEEDS_REVISION").length,
    },
  ];

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === f.key ? "#0F2744" : "#fff",
                color: filter === f.key ? "#fff" : "#6B7280",
                border: filter === f.key ? "1px solid #0F2744" : "1px solid #e5eaf0",
              }}
            >
              {f.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: filter === f.key ? "rgba(255,255,255,0.2)" : "#F3F4F6",
                  color: filter === f.key ? "#fff" : "#9CA3AF",
                }}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
        {isEM && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
            style={{ background: showForm ? "#F3F4F6" : "#0F2744", color: showForm ? "#374151" : "#fff" }}
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? "Cancel" : "Add Deliverable"}
          </button>
        )}
      </div>

      {/* Add deliverable form */}
      {showForm && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">New Deliverable</p>
            <button
              onClick={suggestDeliverables}
              disabled={suggesting}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {suggesting ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={9} />}
              {suggesting ? "Analyzing..." : "Suggest with Nuru"}
            </button>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400">{suggestions.length} deliverables suggested for this project</p>
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start justify-between gap-2 rounded-lg px-3 py-2" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{s.description}</p>
                  </div>
                  {addedSuggestions.has(i) ? (
                    <span className="text-[10px] font-semibold text-emerald-600 shrink-0">Added</span>
                  ) : (
                    <button
                      onClick={() => addSuggested(s, i)}
                      disabled={addingSuggestion === i}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0 disabled:opacity-50"
                      style={{ background: "#0F2744", color: "#fff" }}
                    >
                      {addingSuggestion === i ? <Loader2 size={10} className="animate-spin" /> : "Add"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-1" style={{ borderTop: suggestions.length > 0 ? "1px solid #e5eaf0" : "none" }}>
            {suggestions.length > 0 && <p className="text-[10px] text-gray-400 mb-2">Or add manually:</p>}
            <input
              value={newDeliv.name}
              onChange={(e) => setNewDeliv((f) => ({ ...f, name: e.target.value }))}
              placeholder="Deliverable name *"
              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
              style={{ border: "1px solid #e5eaf0", background: "#fff" }}
            />
          </div>
          <textarea
            value={newDeliv.description}
            onChange={(e) => setNewDeliv((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            rows={2}
            className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Due date</label>
              <input
                type="date"
                value={newDeliv.dueDate}
                onChange={(e) => setNewDeliv((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Assign to</label>
              <select
                value={newDeliv.assignmentId}
                onChange={(e) => setNewDeliv((f) => ({ ...f, assignmentId: e.target.value }))}
                className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              >
                <option value="">Unassigned</option>
                {project.assignments.map((a) => (
                  <option key={a.id} value={a.id}>{a.consultant.name} ({a.role})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={createDeliverable}
              disabled={!newDeliv.name.trim() || saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {saving ? "Creating..." : "Create Deliverable"}
            </button>
            <button
              onClick={getPricing}
              disabled={!newDeliv.name.trim() || pricingLoading}
              className="px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: "#D4AF37" + "15", color: "#92400E", border: "1px solid " + "#D4AF37" + "40" }}
            >
              <Sparkles size={12} />
              {pricingLoading ? "Analyzing..." : "Nuru: Suggest Pricing"}
            </button>
          </div>

          {/* Pricing suggestion */}
          {pricingSuggestion && (
            <div className="mt-3 rounded-lg p-4" style={{ background: "#D4AF37" + "08", border: "1px solid " + "#D4AF37" + "25" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} style={{ color: "#D4AF37" }} />
                <span className="text-xs font-semibold" style={{ color: "#0F2744" }}>Nuru Pricing Suggestion</span>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-2">
                <div><p className="text-[10px] text-gray-500">Hours Est.</p><p className="text-sm font-bold" style={{ color: "#0F2744" }}>{pricingSuggestion.estimatedHours}h</p></div>
                <div><p className="text-[10px] text-gray-500">Complexity</p><p className="text-sm font-bold" style={{ color: "#0F2744" }}>{pricingSuggestion.complexityLevel}</p></div>
                <div><p className="text-[10px] text-gray-500">NGN Range</p><p className="text-xs font-medium" style={{ color: "#0F2744" }}>{"\u20A6"}{pricingSuggestion.suggestedPriceNGN.low.toLocaleString()} - {"\u20A6"}{pricingSuggestion.suggestedPriceNGN.high.toLocaleString()}</p></div>
                <div><p className="text-[10px] text-gray-500">Rec. Tier</p><p className="text-sm font-bold" style={{ color: "#0F2744" }}>{pricingSuggestion.recommendedTier}</p></div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{pricingSuggestion.rationale}</p>
            </div>
          )}
        </div>
      )}

      {allDeliverables.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <FileCheck size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No deliverables in this category.</p>
        </div>
      ) : (
        allDeliverables.map((d) => (
          <div
            key={d.id}
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusBadge status={d.status} />
                  {d.reviewScore && (
                    <span className="text-xs flex items-center gap-1 text-amber-600">
                      <Star size={11} className="text-amber-400" />
                      {d.reviewScore}/10
                    </span>
                  )}
                  {d.version > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                      v{d.version}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{d.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{d.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                  {d.assignment ? (
                    <span className="inline-flex items-center gap-1">
                      {d.assignment.consultant.name}
                      {isEM && <AssignDeliverableDropdown deliverableId={d.id} projectId={project.id} assignments={project.assignments} currentAssignmentId={d.assignment?.id ?? null} onAssigned={() => window.location.reload()} />}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      Unassigned
                      {isEM && <AssignDeliverableDropdown deliverableId={d.id} projectId={project.id} assignments={project.assignments} currentAssignmentId={null} onAssigned={() => window.location.reload()} />}
                    </span>
                  )}
                  {d.dueDate && (
                    <>
                      <span>·</span>
                      <span className={`flex items-center gap-0.5 ${d.dueDate && new Date(d.dueDate) < new Date() && d.status !== "APPROVED" && d.status !== "DELIVERED_TO_CLIENT" ? "text-red-500 font-medium" : ""}`}>
                        <Clock size={9} />
                        {d.dueDate && new Date(d.dueDate) < new Date() && d.status !== "APPROVED" && d.status !== "DELIVERED_TO_CLIENT" ? "Overdue" : `Due ${formatDate(new Date(d.dueDate!))}`}
                      </span>
                    </>
                  )}
                  {d.submittedAt && (
                    <>
                      <span>·</span>
                      <span>Submitted {timeAgo(new Date(d.submittedAt))}</span>
                    </>
                  )}
                </div>
                {d.reviewNotes && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    {d.reviewNotes}
                  </p>
                )}

                {/* Deliverable fee - EM only */}
                {isEM && <DeliverableFeeEditor deliverable={d} projectServiceType={project.serviceType} budgetSensitivity={project.budgetSensitivity} consultantTierMin={project.consultantTierMin} consultantTierMax={project.consultantTierMax} />}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {(d.status === "SUBMITTED" || d.status === "IN_REVIEW" || d.status === "NEEDS_REVISION") && (
                  <Link
                    href={`/deliverables/${d.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "#D4AF37", color: "#06090f" }}
                  >
                    Review
                    <ChevronRight size={12} />
                  </Link>
                )}
                {d.status === "DRAFT" && (
                  <Link
                    href={`/deliverables/${d.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "#F3F4F6", color: "#374151" }}
                  >
                    Manage
                    <ChevronRight size={12} />
                  </Link>
                )}
                {isEM && d.status === "DRAFT" && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${d.name}"?`)) return;
                      const res = await fetch(`/api/deliverables/${d.id}`, { method: "DELETE" });
                      if (res.ok) {
                        setExtraDeliverables((prev) => prev.filter((x) => x.id !== d.id));
                        project.deliverables = project.deliverables.filter((x) => x.id !== d.id);
                        onFilterChange(filter);
                      }
                    }}
                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
