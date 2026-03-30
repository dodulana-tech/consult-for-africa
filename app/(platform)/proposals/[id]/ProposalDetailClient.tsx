"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  AlertCircle,
  Eye,
  Download,
  Mail,
  Loader2,
  Save,
  X,
  Plus,
} from "lucide-react";

type ProposalDetail = {
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
  content: string;
  challenges: string[];
  objectives: string[];
  createdBy: { id: string; name: string };
  client: { id: string; name: string } | null;
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
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProposalDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editChallenges, setEditChallenges] = useState<string[]>([]);
  const [editObjectives, setEditObjectives] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proposals/${id}`);
        if (res.ok) {
          setDetail(await res.json());
        } else {
          setError("Proposal not found");
        }
      } catch {
        setError("Failed to load proposal");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const startEditing = useCallback(() => {
    if (!detail) return;
    setEditTitle(detail.title);
    setEditContent(detail.content);
    setEditChallenges([...detail.challenges]);
    setEditObjectives([...detail.objectives]);
    setEditing(true);
  }, [detail]);

  const saveEdits = useCallback(async () => {
    setSaveLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          challenges: editChallenges.filter((c) => c.trim()),
          objectives: editObjectives.filter((o) => o.trim()),
        }),
      });
      if (res.ok) {
        setDetail(await res.json());
        setEditing(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save changes");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaveLoading(false);
    }
  }, [id, editTitle, editContent, editChallenges, editObjectives]);

  const updateStatus = useCallback(async (newStatus: string) => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDetail(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update status");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  }, [id]);

  const deleteProposal = useCallback(async () => {
    if (!confirm("Delete this draft proposal?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/proposals");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  }, [id, router]);

  async function downloadPDF() {
    if (!detail) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/proposals/${detail.id}/pdf`);
      if (!res.ok) {
        setError("Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CFA_Proposal_${detail.clientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  function draftEmail() {
    if (!detail) return;
    const serviceLine = detail.serviceType ? `Service: ${SERVICE_LABELS[detail.serviceType] ?? detail.serviceType}\n` : "";
    const budgetLine = detail.budgetRange ? `Budget: ${detail.budgetRange}\n` : "";
    const timelineLine = detail.timeline ? `Timeline: ${detail.timeline}\n` : "";
    const subject = encodeURIComponent(`Proposal: ${detail.title} - Consult For Africa`);
    const body = encodeURIComponent(
      `Dear ${detail.clientContact || "Team"},\n\nPlease find attached our proposal for the above engagement.\n\nProposal: ${detail.title}\nClient: ${detail.clientName}\n${serviceLine}${budgetLine}${timelineLine}\nWe look forward to discussing this further.\n\nBest regards,\nConsult For Africa\nconsultforafrica.com`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  }

  if (loading) {
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
        <button onClick={() => router.push("/proposals")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back
        </button>
        <p className="text-sm text-red-500">{error || "Proposal not found"}</p>
      </div>
    );
  }

  const nextActions: Record<string, { label: string; status: string; style: Record<string, string> }[]> = {
    DRAFT: [{ label: "Submit for Review", status: "REVIEW", style: { background: "#FEF3C7", color: "#92400E" } }],
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
      <button onClick={() => router.push("/proposals")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
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
          <div className="flex-1 min-w-0 mr-3">
            {editing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-lg font-semibold text-gray-900 border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                style={{ borderColor: "#e5eaf0" }}
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">{detail.title}</h2>
            )}
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
        <div className="flex items-center gap-2 mt-4 pt-4 flex-wrap" style={{ borderTop: "1px solid #F3F4F6" }}>
          {editing ? (
            <>
              <button
                onClick={saveEdits}
                disabled={saveLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                {saveLoading ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                {saveLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#F3F4F6", color: "#374151" }}
              >
                <X size={11} /> Cancel
              </button>
            </>
          ) : (
            <>
              {(detail.status === "DRAFT" || detail.status === "REVIEW") && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "#F0F4FF", color: "#0F2744" }}
                >
                  <Edit3 size={11} /> Edit
                </button>
              )}
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
              <button
                onClick={downloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{ background: "#F0F4FF", color: "#0F2744" }}
              >
                {pdfLoading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                {pdfLoading ? "Generating..." : "Download PDF"}
              </button>
              <button
                onClick={draftEmail}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#FEF3C7", color: "#92400E" }}
              >
                <Mail size={11} /> Draft Email
              </button>
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
            </>
          )}
        </div>
      </div>

      {/* Challenges & Objectives */}
      {editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Challenges</h3>
            <div className="space-y-2">
              {editChallenges.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={c}
                    onChange={(e) => { const u = [...editChallenges]; u[i] = e.target.value; setEditChallenges(u); }}
                    className="flex-1 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                    style={{ borderColor: "#e5eaf0" }}
                  />
                  {editChallenges.length > 1 && (
                    <button onClick={() => setEditChallenges(editChallenges.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 px-1">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setEditChallenges([...editChallenges, ""])} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0F2744" }}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4" style={{ border: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Objectives</h3>
            <div className="space-y-2">
              {editObjectives.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={o}
                    onChange={(e) => { const u = [...editObjectives]; u[i] = e.target.value; setEditObjectives(u); }}
                    className="flex-1 text-sm border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
                    style={{ borderColor: "#e5eaf0" }}
                  />
                  {editObjectives.length > 1 && (
                    <button onClick={() => setEditObjectives(editObjectives.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 px-1">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setEditObjectives([...editObjectives, ""])} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0F2744" }}>
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
        </div>
      ) : (detail.challenges.length > 0 || detail.objectives.length > 0) ? (
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
      ) : null}

      {/* Content */}
      <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Proposal Content</h3>
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-sm text-gray-700 leading-relaxed border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0F2744]"
            style={{ borderColor: "#e5eaf0", minHeight: 400, resize: "vertical" }}
          />
        ) : (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {detail.content}
          </div>
        )}
      </div>
    </div>
  );
}
