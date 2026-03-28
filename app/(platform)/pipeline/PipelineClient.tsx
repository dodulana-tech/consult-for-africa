"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEnumLabel } from "@/lib/utils";

type Tab = "leads" | "discovery" | "proposals" | "staffing" | "expansions";

interface LeadItem {
  id: string;
  source: string;
  status: string;
  organizationName: string;
  contactName: string;
  contactEmail: string | null;
  organizationType: string | null;
  qualificationScore: string | null;
  serviceLineHook: string | null;
  estimatedSize: string | null;
  assignedTo: { name: string } | null;
  discoveryCallCount: number;
  createdAt: string;
}

interface Props {
  leads: LeadItem[];
  discoveryCalls: Array<{
    id: string;
    organizationName: string;
    contactName: string;
    status: string;
    aiServiceLineMatch: string[];
    conductedBy: { name: string };
    convertedToClient: { id: string; name: string } | null;
    createdAt: string;
  }>;
  proposals: Array<{
    id: string;
    title: string;
    clientName: string;
    serviceType: string | null;
    status: string;
    budgetRange: string | null;
    createdAt: string;
    createdBy: { name: string };
  }>;
  staffingRequests: Array<{
    id: string;
    role: string;
    skillsRequired: string[];
    status: string;
    urgency: string;
    engagement: { id: string; name: string; client: { name: string } };
    createdBy: { name: string };
    createdAt: string;
  }>;
  expansionRequests: Array<{
    id: string;
    suggestedService: string;
    rationale: string;
    status: string;
    client: { id: string; name: string };
    createdAt: string;
  }>;
  stats: { activeLeads: number; activeDiscovery: number; activeProposals: number; openStaffing: number; pendingExpansions: number };
  isElevated: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: "bg-blue-50", text: "text-blue-700" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700" },
  NO_SHOW: { bg: "bg-red-50", text: "text-red-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600" },
  REVIEW: { bg: "bg-blue-50", text: "text-blue-700" },
  SENT: { bg: "bg-amber-50", text: "text-amber-700" },
  ACCEPTED: { bg: "bg-green-50", text: "text-green-700" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700" },
  EXPIRED: { bg: "bg-gray-100", text: "text-gray-500" },
  OPEN: { bg: "bg-blue-50", text: "text-blue-700" },
  PROPOSED: { bg: "bg-purple-50", text: "text-purple-700" },
  HIGH: { bg: "bg-red-50", text: "text-red-700" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700" },
  LOW: { bg: "bg-gray-100", text: "text-gray-600" },
  NEW: { bg: "bg-blue-50", text: "text-blue-700" },
  RESEARCHING: { bg: "bg-purple-50", text: "text-purple-700" },
  OUTREACH: { bg: "bg-amber-50", text: "text-amber-700" },
  RESPONDED: { bg: "bg-green-50", text: "text-green-700" },
  DISCOVERY_SCHEDULED: { bg: "bg-green-50", text: "text-green-700" },
  PROPOSAL_SENT: { bg: "bg-blue-50", text: "text-blue-700" },
  LOST: { bg: "bg-red-50", text: "text-red-700" },
  HOT: { bg: "bg-red-50", text: "text-red-700" },
  WARM: { bg: "bg-amber-50", text: "text-amber-700" },
  COLD: { bg: "bg-blue-50", text: "text-blue-700" },
  NOT_FIT: { bg: "bg-gray-100", text: "text-gray-500" },
};

function Badge({ status }: { status: string }) {
  const st = STATUS_STYLES[status] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function PipelineClient({ leads, discoveryCalls, proposals, staffingRequests, expansionRequests, stats, isElevated }: Props) {
  const [tab, setTab] = useState<Tab>("leads");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "leads", label: "Leads", count: stats.activeLeads },
    { key: "discovery", label: "Discovery Calls", count: stats.activeDiscovery },
    { key: "proposals", label: "Proposals", count: stats.activeProposals },
    { key: "staffing", label: "Staffing Needs", count: stats.openStaffing },
    { key: "expansions", label: "Expansions", count: stats.pendingExpansions },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl border p-4 text-left transition-all ${tab === t.key ? "ring-2 ring-blue-200" : "hover:shadow-sm"}`}
            style={{ borderColor: tab === t.key ? "#0F2744" : "#e5eaf0" }}
          >
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>{t.count}</p>
            <p className="text-xs text-gray-500">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b overflow-x-auto" style={{ borderColor: "#e5eaf0" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === t.key
                ? "border-current"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
            style={tab === t.key ? { color: "#0F2744" } : {}}
          >
            {t.label}
          </button>
        ))}
        {isElevated && tab === "leads" && (
          <Link
            href="/leads/new"
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: "#0F2744" }}
          >
            New Lead
          </Link>
        )}
        {isElevated && tab === "discovery" && (
          <Link
            href="/discovery-calls/new"
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: "#0F2744" }}
          >
            New Discovery Call
          </Link>
        )}
        {tab === "proposals" && (
          <Link
            href="/proposals"
            className="ml-auto text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            View all
          </Link>
        )}
      </div>

      {/* Leads tab */}
      {tab === "leads" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No leads yet.</p>
              <p className="text-xs text-gray-300 mt-1">Leads are created from website enquiries, demo requests, referrals, or manual entry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Score</th>
                  <th className="px-4 py-3 hidden md:table-cell">Service Line</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="hover:underline">
                        <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{lead.organizationName}</p>
                      </Link>
                      <p className="text-xs text-gray-400">{lead.contactName}{lead.contactEmail ? ` | ${lead.contactEmail}` : ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {lead.source.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3"><Badge status={lead.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lead.qualificationScore ? <Badge status={lead.qualificationScore} /> : <span className="text-xs text-gray-300">Unscored</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lead.serviceLineHook ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 truncate max-w-[120px] inline-block">
                          {lead.serviceLineHook.split(" ").slice(0, 3).join(" ")}
                        </span>
                      ) : <span className="text-xs text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{lead.assignedTo?.name ?? <span className="text-gray-300">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Discovery Calls tab */}
      {tab === "discovery" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          {discoveryCalls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No discovery calls yet.</p>
              {isElevated && (
                <Link href="/discovery-calls/new" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  Schedule your first call
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Service Lines</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {discoveryCalls.map((call) => (
                  <tr key={call.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <Link href={`/discovery-calls/${call.id}`} className="hover:underline">
                        <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{call.organizationName}</p>
                      </Link>
                      {call.convertedToClient && (
                        <span className="text-xs text-green-600">Converted</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{call.contactName}</td>
                    <td className="px-4 py-3"><Badge status={call.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {call.aiServiceLineMatch.slice(0, 2).map((sl, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 truncate max-w-[100px]">
                            {sl.split(" ").slice(0, 2).join(" ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(call.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Proposals tab */}
      {tab === "proposals" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No proposals yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
                  <th className="px-4 py-3">Proposal</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Budget</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <Link href={`/proposals/${p.id}`} className="text-sm font-medium hover:underline" style={{ color: "#0F2744" }}>
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.clientName}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{p.budgetRange ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Staffing tab */}
      {tab === "staffing" && (
        <StaffingTab staffingRequests={staffingRequests} isElevated={isElevated} />
      )}

      {/* Expansions tab */}
      {tab === "expansions" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          {expansionRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No pending expansion requests.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Suggested Service</th>
                  <th className="px-4 py-3 hidden md:table-cell">Rationale</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {expansionRequests.map((er) => (
                  <tr key={er.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-4 py-3">
                      <Link href={`/clients/${er.client.id}`} className="text-sm font-medium hover:underline" style={{ color: "#0F2744" }}>
                        {er.client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{er.suggestedService}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 max-w-[300px] truncate">{er.rationale}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(er.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Staffing Tab with Expression Review ───

interface ExpressionData {
  id: string;
  note: string | null;
  status: string;
  matchScore: number | null;
  createdAt: string;
  consultant: {
    id: string;
    name: string;
    email: string;
    profile: {
      title: string;
      location: string;
      tier: string;
      yearsExperience: number;
      expertiseAreas: string[];
      availabilityStatus: string;
      averageRating: number | null;
    } | null;
  };
}

function StaffingTab({ staffingRequests, isElevated }: { staffingRequests: Props["staffingRequests"]; isElevated: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<ExpressionData[]>([]);
  const [loadingExpressions, setLoadingExpressions] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadExpressions(requestId: string) {
    if (expandedId === requestId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(requestId);
    setLoadingExpressions(true);
    try {
      const res = await fetch(`/api/staffing/${requestId}/expressions`);
      const data = await res.json();
      setExpressions(data.expressions ?? []);
    } catch {}
    finally { setLoadingExpressions(false); }
  }

  async function handleAction(requestId: string, expressionId: string, action: string) {
    setActionLoading(expressionId);
    try {
      await fetch(`/api/staffing/${requestId}/expressions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expressionId, action }),
      });
      // Reload expressions
      const res = await fetch(`/api/staffing/${requestId}/expressions`);
      const data = await res.json();
      setExpressions(data.expressions ?? []);
    } catch {}
    finally { setActionLoading(null); }
  }

  if (staffingRequests.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#e5eaf0" }}>
        <p className="text-gray-400 text-sm">No open staffing requests.</p>
        <p className="text-xs text-gray-300 mt-1">Staffing requests are created from project team tabs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {staffingRequests.map((sr) => {
        const isExpanded = expandedId === sr.id;
        return (
          <div key={sr.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
            <button
              onClick={() => isElevated && loadExpressions(sr.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>{sr.role}</span>
                  <Badge status={sr.urgency} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <Link href={`/projects/${sr.engagement.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                    {sr.engagement.name}
                  </Link>
                  {" | "}{sr.engagement.client.name}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(sr.skillsRequired ?? []).slice(0, 4).map((s, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{s}</span>
                  ))}
                </div>
              </div>
              {isElevated && (
                <span className="text-xs text-gray-400 shrink-0">
                  {isExpanded ? "Hide" : "Review"} expressions
                </span>
              )}
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 border-t" style={{ borderColor: "#e5eaf0" }}>
                {loadingExpressions ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                  </div>
                ) : expressions.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No consultants have expressed interest yet.</p>
                ) : (
                  <div className="space-y-3 pt-4">
                    <p className="text-xs font-semibold text-gray-500">{expressions.length} interested consultant{expressions.length !== 1 ? "s" : ""}</p>
                    {expressions.map((exp) => {
                      const p = exp.consultant.profile;
                      return (
                        <div key={exp.id} className="rounded-lg border p-4" style={{ borderColor: "#e5eaf0" }}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{exp.consultant.name}</p>
                              <p className="text-xs text-gray-500">{p?.title ?? exp.consultant.email}</p>
                              {p && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                  <span>{p.location}</span>
                                  <span>{p.yearsExperience}yr exp</span>
                                  <span className="capitalize">{p.tier.toLowerCase()}</span>
                                  {p.averageRating && <span>{p.averageRating.toFixed(1)} rating</span>}
                                </div>
                              )}
                            </div>
                            <Badge status={exp.status} />
                          </div>

                          {exp.note && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded p-2">{exp.note}</p>
                          )}

                          {p?.expertiseAreas && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.expertiseAreas.slice(0, 4).map((area, i) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{formatEnumLabel(area)}</span>
                              ))}
                            </div>
                          )}

                          {exp.status === "INTERESTED" && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAction(sr.id, exp.id, "SHORTLISTED")}
                                disabled={actionLoading === exp.id}
                                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => handleAction(sr.id, exp.id, "SELECTED")}
                                disabled={actionLoading === exp.id}
                                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                              >
                                Select & Assign
                              </button>
                              <button
                                onClick={() => handleAction(sr.id, exp.id, "PASSED")}
                                disabled={actionLoading === exp.id}
                                className="text-xs font-medium px-2.5 py-1 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              >
                                Pass
                              </button>
                            </div>
                          )}
                          {exp.status === "SHORTLISTED" && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAction(sr.id, exp.id, "SELECTED")}
                                disabled={actionLoading === exp.id}
                                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                              >
                                Select & Assign
                              </button>
                              <button
                                onClick={() => handleAction(sr.id, exp.id, "PASSED")}
                                disabled={actionLoading === exp.id}
                                className="text-xs font-medium px-2.5 py-1 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              >
                                Pass
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
