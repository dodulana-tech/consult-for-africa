"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  FileText,
  ChevronRight,
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  AlertCircle,
  Sparkles,
  Eye,
} from "lucide-react";
import ProposalGenerator from "@/components/platform/ProposalGenerator";

type ProposalSummary = {
  id: string;
  title: string;
  clientName: string;
  clientContact: string | null;
  serviceType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  status: string;
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  client: { id: string; name: string } | null;
};

type ProposalDetail = ProposalSummary & {
  content: string;
  challenges: string[];
  objectives: string[];
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  DRAFT: { label: "Draft", bg: "#F3F4F6", text: "#6B7280", icon: Edit3 },
  REVIEW: { label: "In Review", bg: "#FEF3C7", text: "#92400E", icon: Eye },
  SENT: { label: "Sent", bg: "#DBEAFE", text: "#1E40AF", icon: Send },
  ACCEPTED: { label: "Accepted", bg: "#D1FAE5", text: "#065F46", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", bg: "#FEE2E2", text: "#991B1B", icon: XCircle },
  EXPIRED: { label: "Expired", bg: "#F3F4F6", text: "#9CA3AF", icon: Clock },
};

const SERVICE_LABELS: Record<string, string> = {
  HOSPITAL_OPERATIONS: "Hospital Operations",
  TURNAROUND: "Turnaround Management",
  EMBEDDED_LEADERSHIP: "Embedded Leadership",
  CLINICAL_GOVERNANCE: "Clinical Governance",
  DIGITAL_HEALTH: "Digital Health",
  HEALTH_SYSTEMS: "Health Systems",
  DIASPORA_EXPERTISE: "Diaspora Expertise",
  EM_AS_SERVICE: "EM as a Service",
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: config.bg, color: config.text }}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type View = "list" | "generate" | "detail";

export default function ProposalsList() {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProposalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setView("detail");
    setDetailLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/proposals/${id}`);
      if (res.ok) {
        setDetail(await res.json());
      } else {
        setError("Failed to load proposal");
      }
    } catch {
      setError("Network error");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (newStatus: string) => {
      if (!selectedId) return;
      setActionLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/proposals/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          const updated = await res.json();
          setDetail(updated);
          setProposals((prev) =>
            prev.map((p) => (p.id === selectedId ? { ...p, status: updated.status, sentAt: updated.sentAt, respondedAt: updated.respondedAt } : p)),
          );
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to update status");
        }
      } catch {
        setError("Network error");
      } finally {
        setActionLoading(false);
      }
    },
    [selectedId],
  );

  const deleteProposal = useCallback(async () => {
    if (!selectedId || !confirm("Delete this draft proposal?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/proposals/${selectedId}`, { method: "DELETE" });
      if (res.ok) {
        setProposals((prev) => prev.filter((p) => p.id !== selectedId));
        setView("list");
        setDetail(null);
        setSelectedId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  }, [selectedId]);

  const filtered = statusFilter === "ALL" ? proposals : proposals.filter((p) => p.status === statusFilter);

  // Generate view
  if (view === "generate") {
    return (
      <div className="max-w-2xl">
        <button
          onClick={() => {
            setView("list");
            fetchProposals();
          }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} />
          Back to proposals
        </button>
        <div
          className="rounded-xl p-4 mb-6 flex items-start gap-3"
          style={{ background: "#F0F4FF", border: "1px solid #C7D7FF" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#0F2744" }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Generate with Nuru</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter discovery call notes and client context. Nuru generates a complete proposal draft you can review and send.
            </p>
          </div>
        </div>
        <ProposalGenerator />
      </div>
    );
  }

  // Detail view
  if (view === "detail") {
    if (detailLoading) {
      return (
        <div className="max-w-3xl animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-32 bg-gray-50 rounded" />
          <div className="h-64 bg-gray-50 rounded-xl" />
        </div>
      );
    }
    if (!detail) {
      return (
        <div className="max-w-3xl">
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft size={14} /> Back
          </button>
          <p className="text-sm text-red-500">{error || "Proposal not found"}</p>
        </div>
      );
    }

    const nextActions: Record<string, { label: string; status: string; style: Record<string, string> }[]> = {
      DRAFT: [
        { label: "Submit for Review", status: "REVIEW", style: { background: "#FEF3C7", color: "#92400E" } },
      ],
      REVIEW: [
        { label: "Return to Draft", status: "DRAFT", style: { background: "#F3F4F6", color: "#374151" } },
        { label: "Mark as Sent", status: "SENT", style: { background: "#0F2744", color: "#FFFFFF" } },
      ],
      SENT: [
        { label: "Accepted", status: "ACCEPTED", style: { background: "#D1FAE5", color: "#065F46" } },
        { label: "Rejected", status: "REJECTED", style: { background: "#FEE2E2", color: "#991B1B" } },
      ],
    };

    const actions = nextActions[detail.status] ?? [];

    return (
      <div className="max-w-3xl">
        <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back to proposals
        </button>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600 mb-4" style={{ background: "#FEF2F2" }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Header */}
        <div className="rounded-xl bg-white p-5 mb-4" style={{ border: "1px solid #e5eaf0" }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{detail.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{detail.clientName}</p>
            </div>
            <StatusBadge status={detail.status} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {detail.serviceType && (
              <div>
                <span className="text-gray-400 block">Service</span>
                <span className="text-gray-700 font-medium">{SERVICE_LABELS[detail.serviceType] ?? detail.serviceType}</span>
              </div>
            )}
            {detail.budgetRange && (
              <div>
                <span className="text-gray-400 block">Budget</span>
                <span className="text-gray-700 font-medium">{detail.budgetRange}</span>
              </div>
            )}
            {detail.timeline && (
              <div>
                <span className="text-gray-400 block">Timeline</span>
                <span className="text-gray-700 font-medium">{detail.timeline}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 block">Created</span>
              <span className="text-gray-700 font-medium">{formatDate(detail.createdAt)}</span>
            </div>
            {detail.sentAt && (
              <div>
                <span className="text-gray-400 block">Sent</span>
                <span className="text-gray-700 font-medium">{formatDate(detail.sentAt)}</span>
              </div>
            )}
            {detail.respondedAt && (
              <div>
                <span className="text-gray-400 block">Response</span>
                <span className="text-gray-700 font-medium">{formatDate(detail.respondedAt)}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 block">Author</span>
              <span className="text-gray-700 font-medium">{detail.createdBy.name}</span>
            </div>
            {detail.clientContact && (
              <div>
                <span className="text-gray-400 block">Contact</span>
                <span className="text-gray-700 font-medium">{detail.clientContact}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {(actions.length > 0 || detail.status === "DRAFT") && (
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
              {actions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => updateStatus(action.status)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                  style={action.style}
                >
                  {action.label}
                </button>
              ))}
              {detail.status === "DRAFT" && (
                <button
                  onClick={deleteProposal}
                  disabled={actionLoading}
                  className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 disabled:opacity-50"
                  style={{ background: "#FEF2F2" }}
                >
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Challenges & Objectives */}
        {(detail.challenges.length > 0 || detail.objectives.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {detail.challenges.length > 0 && (
              <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Challenges</h3>
                <ul className="space-y-1">
                  {detail.challenges.map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-300 mt-0.5">&#8226;</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.objectives.length > 0 && (
              <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Objectives</h3>
                <ul className="space-y-1">
                  {detail.objectives.map((o, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-300 mt-0.5">&#8226;</span> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Proposal Content</h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {detail.content}
          </div>
        </div>
      </div>
    );
  }

  // List view
  const statusCounts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("ALL")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: statusFilter === "ALL" ? "#0F2744" : "#F3F4F6",
              color: statusFilter === "ALL" ? "#FFFFFF" : "#6B7280",
            }}
          >
            All ({proposals.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = statusCounts[key] || 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: statusFilter === key ? config.bg : "#F3F4F6",
                  color: statusFilter === key ? config.text : "#6B7280",
                }}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setView("generate")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#0F2744" }}
        >
          <Plus size={14} />
          New Proposal
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white p-4 animate-pulse" style={{ border: "1px solid #e5eaf0" }}>
              <div className="h-4 w-48 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center" style={{ border: "1px solid #e5eaf0" }}>
          <FileText size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600">
            {proposals.length === 0 ? "No proposals yet" : "No proposals match this filter"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {proposals.length === 0
              ? "Generate your first proposal with Nuru to get started."
              : "Try selecting a different status filter."}
          </p>
          {proposals.length === 0 && (
            <button
              onClick={() => setView("generate")}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#0F2744" }}
            >
              <Sparkles size={14} /> Generate Proposal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => openDetail(p.id)}
              className="w-full rounded-xl bg-white p-4 text-left hover:shadow-sm transition-shadow flex items-center gap-4 group"
              style={{ border: "1px solid #e5eaf0" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#F0F4FF" }}
              >
                <FileText size={16} style={{ color: "#0F2744" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{p.clientName}</span>
                  {p.serviceType && (
                    <>
                      <span className="text-gray-200">|</span>
                      <span>{SERVICE_LABELS[p.serviceType] ?? p.serviceType}</span>
                    </>
                  )}
                  <span className="text-gray-200">|</span>
                  <span>{formatDate(p.createdAt)}</span>
                  {p.createdBy && (
                    <>
                      <span className="text-gray-200">|</span>
                      <span>{p.createdBy.name}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
