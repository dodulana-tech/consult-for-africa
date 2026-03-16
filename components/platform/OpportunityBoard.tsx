"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Clock,
  Briefcase,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Send,
  X,
  Inbox,
} from "lucide-react";

interface Opportunity {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  serviceType: string;
  createdBy: string;
  role: string;
  description: string;
  skillsRequired: string[];
  hoursPerWeek: number;
  duration: string | null;
  urgency: string;
  expressionCount: number;
  hasExpressed: boolean;
  rateType: string;
  createdAt: string;
}

interface PendingAssignment {
  id: string;
  role: string;
  responsibilities: string;
  projectId: string;
  projectName: string;
  clientName: string;
  serviceType: string;
  estimatedHoursPerWeek: number | null;
  rateAmount: number;
  rateCurrency: string;
  rateType: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

const URGENCY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: "#FEF2F2", color: "#DC2626", label: "Urgent" },
  urgent: { bg: "#FEF3C7", color: "#D97706", label: "High Priority" },
  normal: { bg: "#F3F4F6", color: "#6B7280", label: "Normal" },
};

export default function OpportunityBoard({
  opportunities,
  pendingAssignments,
  isConsultant,
}: {
  opportunities: Opportunity[];
  pendingAssignments: PendingAssignment[];
  isConsultant: boolean;
}) {
  const router = useRouter();
  const [expressing, setExpressing] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [expressed, setExpressed] = useState<Set<string>>(
    new Set(opportunities.filter((o) => o.hasExpressed).map((o) => o.id))
  );
  const [responding, setResponding] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState<string | null>(null);

  async function expressInterest(requestId: string) {
    setExpressing(requestId);
    try {
      const res = await fetch(`/api/staffing/${requestId}/express-interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteInput }),
      });
      if (res.ok) {
        setExpressed((prev) => new Set([...prev, requestId]));
        setNoteInput("");
      }
    } finally {
      setExpressing(null);
    }
  }

  async function respondToAssignment(assignmentId: string, action: "accept" | "decline") {
    setResponding(assignmentId);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: declineReason }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed");
      }
    } finally {
      setResponding(null);
      setShowDecline(null);
      setDeclineReason("");
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl space-y-6">

        {/* Pending assignment requests (consultant must accept/decline) */}
        {isConsultant && pendingAssignments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Inbox size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Assignment Requests</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                Action Required
              </span>
            </div>
            <div className="space-y-3">
              {pendingAssignments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl p-5"
                  style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-blue-900">{a.role}</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        {a.projectName} · {a.clientName} · {a.serviceType}
                      </p>
                      <p className="text-xs text-blue-600 mt-2 leading-relaxed line-clamp-3">
                        {a.responsibilities}
                      </p>
                      <div className="flex gap-3 mt-2 text-[10px] text-blue-500">
                        {a.estimatedHoursPerWeek && (
                          <span className="flex items-center gap-1">
                            <Clock size={9} /> {a.estimatedHoursPerWeek}h/week
                          </span>
                        )}
                        <span>{a.rateType}</span>
                      </div>
                    </div>
                  </div>

                  {showDecline === a.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Please share why you're declining (required)..."
                        rows={2}
                        className="w-full text-xs rounded-lg px-3 py-2 resize-none focus:outline-none bg-white"
                        style={{ border: "1px solid #BFDBFE" }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => respondToAssignment(a.id, "decline")}
                          disabled={!declineReason.trim() || responding === a.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                          style={{ background: "#DC2626" }}
                        >
                          {responding === a.id ? <Loader2 size={11} className="animate-spin" /> : "Confirm Decline"}
                        </button>
                        <button
                          onClick={() => { setShowDecline(null); setDeclineReason(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => respondToAssignment(a.id, "accept")}
                        disabled={responding === a.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: "#10B981" }}
                      >
                        {responding === a.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                        Accept Assignment
                      </button>
                      <button
                        onClick={() => setShowDecline(a.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-gray-600"
                        style={{ background: "#F3F4F6" }}
                      >
                        <X size={11} />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open opportunities */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-yellow-500" />
            <h2 className="text-sm font-semibold text-gray-900">
              {isConsultant ? "Open Opportunities" : "Staffing Requests"}
            </h2>
            <span className="text-xs text-gray-400">({opportunities.length})</span>
          </div>

          {opportunities.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {isConsultant
                  ? "No open opportunities right now. Check back soon."
                  : "No open staffing requests. Create one from a project page."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => {
                const urgStyle = URGENCY_STYLES[opp.urgency] ?? URGENCY_STYLES.normal;
                const alreadyExpressed = expressed.has(opp.id);

                return (
                  <div
                    key={opp.id}
                    className="rounded-xl p-5"
                    style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: urgStyle.bg, color: urgStyle.color }}
                          >
                            {urgStyle.label}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {opp.expressionCount} interested
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{opp.role}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {opp.projectName} · {opp.clientName} · {opp.serviceType}
                        </p>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">
                          {opp.description}
                        </p>

                        {opp.skillsRequired.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {opp.skillsRequired.map((skill) => (
                              <span
                                key={skill}
                                className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: "#F0F4FF", color: "#0F2744" }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={9} /> {opp.hoursPerWeek}h/week
                          </span>
                          {opp.duration && <span>{opp.duration}</span>}
                          <span>{opp.rateType.replace(/_/g, " ")}</span>
                          <span>Posted by {opp.createdBy}</span>
                        </div>
                      </div>

                      {/* Action */}
                      {isConsultant && (
                        <div className="shrink-0">
                          {alreadyExpressed ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle size={13} /> Interested
                            </span>
                          ) : (
                            <button
                              onClick={() => expressInterest(opp.id)}
                              disabled={expressing === opp.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                              style={{ background: "#0F2744" }}
                            >
                              {expressing === opp.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Send size={11} />
                              )}
                              I&apos;m Interested
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
