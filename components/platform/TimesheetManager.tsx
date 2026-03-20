"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  AlertCircle,
  Send,
  Calendar,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatCompactCurrency, formatDate } from "@/lib/utils";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  hoursWorked: number | null;
  description: string;
  status: string;
  billableAmount: number | null;
  currency: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  consultant: { id: string; name: string; email: string };
  assignment: { project: { id: string; name: string }; rateAmount: number; rateType: string; rateCurrency: string };
}

interface Assignment {
  id: string;
  role: string;
  rateAmount: number;
  rateType: string;
  rateCurrency: string;
  estimatedHours: number | null;
  estimatedDays: number | null;
  project: { id: string; name: string };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function TimesheetManager({
  entries,
  myAssignments,
  isEM,
  userId,
}: {
  entries: TimeEntry[];
  myAssignments: Assignment[];
  isEM: boolean;
  userId: string;
}) {
  const [tab, setTab] = useState<"pending" | "history" | "log">(isEM ? "pending" : "log");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Log form state
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logAssignment, setLogAssignment] = useState(myAssignments[0]?.id ?? "");
  const [logDesc, setLogDesc] = useState("");
  const [logHours, setLogHours] = useState("");
  const [logMonth, setLogMonth] = useState(new Date().getMonth() + 1);
  const [logYear, setLogYear] = useState(new Date().getFullYear());
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);
  const [logError, setLogError] = useState("");
  const [actionError, setActionError] = useState("");

  const pending = entries.filter((e) => e.status === "PENDING");
  const approved = entries.filter((e) => e.status === "APPROVED");
  const paid = entries.filter((e) => e.status === "PAID");
  const rejected = entries.filter((e) => e.status === "REJECTED");

  const pendingGroups = useMemo(() => {
    const map = new Map<string, { consultant: TimeEntry["consultant"]; entries: TimeEntry[]; totalHours: number; totalUSD: number; totalNGN: number }>();
    for (const e of pending) {
      const key = e.consultant.id;
      if (!map.has(key)) {
        map.set(key, { consultant: e.consultant, entries: [], totalHours: 0, totalUSD: 0, totalNGN: 0 });
      }
      const g = map.get(key)!;
      g.entries.push(e);
      g.totalHours += e.hours;
      if (e.currency === "USD") g.totalUSD += e.billableAmount ?? 0;
      else g.totalNGN += e.billableAmount ?? 0;
    }
    return [...map.values()];
  }, [pending]);

  function toggleGroup(id: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function approveEntry(id: string) {
    setActionId(id);
    setActionError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/time-entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });
        if (!res.ok) { setActionError("Failed to approve entry. Try again."); return; }
        window.location.reload();
      } catch {
        setActionError("Network error. Try again.");
      } finally {
        setActionId(null);
      }
    });
  }

  function approveGroup(entryIds: string[]) {
    setActionError("");
    startTransition(async () => {
      try {
        for (const id of entryIds) {
          const res = await fetch(`/api/time-entries/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve" }),
          });
          if (!res.ok) { setActionError("One or more entries failed to approve."); return; }
        }
        window.location.reload();
      } catch {
        setActionError("Network error. Try again.");
      }
    });
  }

  function rejectEntry(id: string, name: string) {
    setRejectTarget({ id, name });
    setRejectReason("");
  }

  async function confirmReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/time-entries/${rejectTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", reason: rejectReason }),
        });
        if (!res.ok) { setActionError("Failed to return timesheet. Try again."); return; }
        setRejectTarget(null);
        window.location.reload();
      } catch {
        setActionError("Network error. Try again.");
      }
    });
  }

  const selectedAssignment = myAssignments.find((a) => a.id === logAssignment);
  const rateType = selectedAssignment?.rateType ?? "HOURLY";

  function getEstimatedAmount(): number | null {
    if (!selectedAssignment) return null;
    const rate = Number(selectedAssignment.rateAmount);
    switch (rateType) {
      case "HOURLY": {
        const h = parseFloat(logHours);
        return h > 0 ? rate * h : null;
      }
      case "DAILY":
        return rate;
      case "MONTHLY":
        return rate;
      default:
        return null;
    }
  }

  const estimatedAmount = getEstimatedAmount();

  function canSubmit(): boolean {
    if (!logAssignment || !logDesc.trim()) return false;
    switch (rateType) {
      case "HOURLY":
        return parseFloat(logHours) > 0;
      case "DAILY":
        return !!logDate;
      case "MONTHLY":
        return logMonth > 0 && logYear > 0;
      case "FIXED_PROJECT":
      case "FIXED_DELIVERABLE":
        return true;
      default:
        return false;
    }
  }

  async function logTime() {
    if (!canSubmit()) return;
    setLogLoading(true);
    setLogError("");
    try {
      const body: Record<string, unknown> = {
        assignmentId: logAssignment,
        date: logDate,
        description: logDesc,
      };
      if (rateType === "HOURLY") body.hours = parseFloat(logHours);
      if (rateType === "MONTHLY") {
        body.periodMonth = logMonth;
        body.periodYear = logYear;
      }
      if ((rateType === "FIXED_PROJECT" || rateType === "FIXED_DELIVERABLE") && logHours) body.hours = parseFloat(logHours);

      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setLogError(text || "Failed to submit. Please try again.");
        return;
      }
      setLogSuccess(true);
      setLogDesc("");
      setLogHours("");
      setTimeout(() => {
        setLogSuccess(false);
        window.location.reload();
      }, 1500);
    } catch {
      setLogError("Network error. Please try again.");
    } finally {
      setLogLoading(false);
    }
  }

  function rateTypeLabel(rt: string) {
    switch (rt) {
      case "HOURLY": return "Hourly";
      case "DAILY": return "Daily";
      case "MONTHLY": return "Monthly";
      case "FIXED_PROJECT": return "Fixed Project";
      case "FIXED_DELIVERABLE": return "Per Deliverable";
      default: return rt;
    }
  }

  function entryLabel(e: TimeEntry) {
    if (e.assignment.rateType === "MONTHLY" && e.periodMonth && e.periodYear) {
      return `${MONTHS[(e.periodMonth - 1) % 12]} ${e.periodYear}`;
    }
    if (e.assignment.rateType === "DAILY") return "1 day";
    return `${e.hours}h`;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl space-y-6">
        {/* Tabs */}
        <div
          className="flex gap-0.5 p-1 rounded-xl w-fit"
          style={{ background: "#F3F4F6" }}
        >
          {(isEM
            ? [
                { key: "pending", label: `Pending (${pending.length})` },
                { key: "history", label: "History" },
              ]
            : [
                { key: "log", label: "Log Time" },
                { key: "history", label: "My History" },
              ]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as "pending" | "history" | "log")}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#0F2744" : "#6B7280",
                boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* EM: Pending approvals */}
        {isEM && tab === "pending" && (
          <>
            {actionError && (
              <div className="rounded-lg p-3 text-sm text-red-600 flex items-center gap-2" style={{ background: "#FEF2F2" }}>
                <AlertCircle size={14} />
                {actionError}
              </div>
            )}
            {pending.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">All timesheets reviewed.</p>
              </div>
            ) : (
              pendingGroups.map((group) => (
                <div
                  key={group.consultant.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <div
                    className="flex items-start justify-between p-5"
                    style={{ background: "#F9FAFB", borderBottom: "1px solid #e5eaf0" }}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{group.consultant.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{group.entries.length} entries</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">{group.totalHours}h</p>
                      {group.totalUSD > 0 && (
                        <p className="text-sm font-semibold text-emerald-600">${group.totalUSD.toLocaleString()}</p>
                      )}
                      {group.totalNGN > 0 && (
                        <p className="text-sm font-semibold text-emerald-600">{"\u20A6"}{group.totalNGN.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white">
                    <button
                      onClick={() => toggleGroup(group.consultant.id)}
                      className="w-full px-5 py-3 flex items-center gap-2 text-xs text-gray-500 hover:bg-gray-50"
                    >
                      {expandedGroups.has(group.consultant.id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {expandedGroups.has(group.consultant.id) ? "Hide" : "Show"} entries
                    </button>

                    {expandedGroups.has(group.consultant.id) && (
                      <div className="px-5 pb-2 space-y-2">
                        {group.entries.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-start justify-between gap-4 py-2 border-t border-gray-50 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="text-gray-400 text-xs">
                                {formatDate(new Date(e.date))} · {e.assignment.project.name}
                                <span className="ml-1 text-gray-300">({rateTypeLabel(e.assignment.rateType)})</span>
                              </p>
                              <p className="text-gray-700 mt-0.5">{e.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-gray-800">{entryLabel(e)}</p>
                              {e.billableAmount != null && (
                                <p className="text-xs text-emerald-600">
                                  {e.currency === "USD" ? `$${e.billableAmount}` : `${"\u20A6"}${e.billableAmount.toLocaleString()}`}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 p-4" style={{ borderTop: "1px solid #F3F4F6" }}>
                      <button
                        onClick={() => approveGroup(group.entries.map((e) => e.id))}
                        disabled={isPending}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                        style={{ background: "#10B981", color: "#fff" }}
                      >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve All
                      </button>
                      <button
                        onClick={() => rejectEntry(group.entries[0].id, group.consultant.name)}
                        disabled={isPending}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
                      >
                        Return
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Consultant: Log time */}
        {!isEM && tab === "log" && (
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold text-gray-900">Log Time Entry</h3>

            {logSuccess && (
              <div className="rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2" style={{ background: "#ECFDF5" }}>
                <CheckCircle size={14} />
                Time entry submitted for approval.
              </div>
            )}

            {logError && (
              <div className="rounded-lg p-3 text-sm text-red-600 flex items-center gap-2" style={{ background: "#FEF2F2" }}>
                <AlertCircle size={14} />
                {logError}
              </div>
            )}

            {/* Project selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Project</label>
              <select
                value={logAssignment}
                onChange={(e) => { setLogAssignment(e.target.value); setLogHours(""); }}
                className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {myAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.project.name} ({a.role}) - {rateTypeLabel(a.rateType)}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate-type specific inputs */}
            {rateType === "HOURLY" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Hours worked</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0" }}
                  />
                </div>
              </div>
            )}

            {rateType === "DAILY" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                  style={{ border: "1px solid #e5eaf0" }}
                />
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Calendar size={10} />
                  1 day logged at daily rate
                </p>
              </div>
            )}

            {rateType === "MONTHLY" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Month</label>
                  <select
                    value={logMonth}
                    onChange={(e) => setLogMonth(Number(e.target.value))}
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0" }}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Year</label>
                  <select
                    value={logYear}
                    onChange={(e) => setLogYear(Number(e.target.value))}
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0" }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(rateType === "FIXED_PROJECT" || rateType === "FIXED_DELIVERABLE") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Hours (optional)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    placeholder="For tracking only"
                    className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                    style={{ border: "1px solid #e5eaf0" }}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">What did you work on?</label>
              <textarea
                value={logDesc}
                onChange={(e) => setLogDesc(e.target.value)}
                placeholder="Describe the work completed..."
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
              />
            </div>

            {estimatedAmount != null && selectedAssignment && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ background: "#ECFDF5" }}
              >
                <DollarSign size={14} className="text-emerald-600" />
                <span className="text-emerald-700 font-medium">
                  Estimated:{" "}
                  {selectedAssignment.rateCurrency === "USD"
                    ? `$${estimatedAmount.toFixed(2)}`
                    : `${"\u20A6"}${estimatedAmount.toLocaleString()}`}
                </span>
                <span className="text-emerald-500 text-xs ml-1">({rateTypeLabel(rateType)} rate)</span>
              </div>
            )}

            <button
              onClick={logTime}
              disabled={logLoading || !canSubmit()}
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {logLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit for Approval
            </button>
          </div>
        )}

        {/* History tab (both roles) */}
        {tab === "history" && (
          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <Clock size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No time entries yet.</p>
              </div>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl p-4 flex items-start justify-between gap-4"
                  style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusBadge status={e.status} />
                      <span className="text-xs text-gray-400">{e.assignment.project.name}</span>
                      <span className="text-xs text-gray-300">({rateTypeLabel(e.assignment.rateType)})</span>
                    </div>
                    <p className="text-sm text-gray-700">{e.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {!isEM && <span>{e.consultant.name}</span>}
                      <span>{formatDate(new Date(e.date))}</span>
                    </div>
                    {e.status === "REJECTED" && e.rejectionReason && (
                      <p className="mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                        Returned: {e.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-800">{entryLabel(e)}</p>
                    {e.billableAmount != null && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {e.currency === "USD" ? `$${e.billableAmount.toFixed(2)}` : `${"\u20A6"}${e.billableAmount.toLocaleString()}`}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reject modal */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="w-full max-w-md rounded-xl p-6 bg-white shadow-xl">
              <h3 className="font-semibold text-gray-900 mb-1">Return timesheet</h3>
              <p className="text-sm text-gray-500 mb-4">For {rejectTarget.name}</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for returning (required)..."
                rows={3}
                className="w-full text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none mb-4"
                style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectTarget(null)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "#F3F4F6", color: "#374151" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim() || isPending}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ background: "#EF4444", color: "#fff" }}
                >
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
