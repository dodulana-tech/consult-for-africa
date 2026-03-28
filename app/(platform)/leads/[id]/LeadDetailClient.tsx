"use client";

import { useState } from "react";
import Link from "next/link";

interface LeadData {
  id: string;
  source: string;
  status: string;
  organizationName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactRole: string | null;
  organizationType: string | null;
  country: string | null;
  city: string | null;
  inboundMessage: string | null;
  inboundProjectType: string | null;
  maarovaStream: string | null;
  maarovaLeaderCount: number | null;
  maarovaTimeline: string | null;
  decisionMakers: Array<{ name: string; role: string }> | null;
  knownPainPoints: string[];
  recentNews: string | null;
  competitorPresence: string | null;
  estimatedSize: string | null;
  serviceLineHook: string | null;
  outreachAttempts: Array<{ date: string; channel: string; notes: string; response: string | null; loggedBy: string }> | null;
  outreachStrategy: string | null;
  qualificationScore: string | null;
  qualificationNotes: string | null;
  lostReason: string | null;
  assignedTo: { id: string; name: string } | null;
  existingClient: { id: string; name: string } | null;
  convertedToClient: { id: string; name: string } | null;
  referrals: Array<{ id: string; name: string; email: string; notes: string | null; referrer: { name: string } }>;
  discoveryCalls: Array<{ id: string; status: string; aiSummary: string | null; createdAt: string; aiServiceLineMatch: string[] }>;
  createdAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "bg-blue-50", text: "text-blue-700" },
  RESEARCHING: { bg: "bg-purple-50", text: "text-purple-700" },
  OUTREACH: { bg: "bg-amber-50", text: "text-amber-700" },
  RESPONDED: { bg: "bg-green-50", text: "text-green-700" },
  DISCOVERY_SCHEDULED: { bg: "bg-green-50", text: "text-green-700" },
  PROPOSAL_SENT: { bg: "bg-blue-50", text: "text-blue-700" },
  CONVERTED: { bg: "bg-green-50", text: "text-green-800" },
  LOST: { bg: "bg-red-50", text: "text-red-700" },
  HOT: { bg: "bg-red-50", text: "text-red-700" },
  WARM: { bg: "bg-amber-50", text: "text-amber-700" },
  COLD: { bg: "bg-blue-50", text: "text-blue-700" },
};

export default function LeadDetailClient({ lead: initialLead }: { lead: LeadData }) {
  const [lead, setLead] = useState(initialLead);
  const [qualifying, setQualifying] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachForm, setOutreachForm] = useState({ channel: "EMAIL", notes: "", response: "" });
  const [outreachSaving, setOutreachSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runQualification() {
    setQualifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/qualify`, { method: "POST" });
      if (!res.ok) throw new Error("Qualification failed");
      // Refresh lead
      const refreshRes = await fetch(`/api/leads/${lead.id}`);
      const data = await refreshRes.json();
      setLead(data.lead);
    } catch (err) {
      console.error("Lead qualification failed:", err);
      setError("Unable to qualify this lead. Please try again.");
    } finally {
      setQualifying(false);
    }
  }

  async function logOutreach(e: React.FormEvent) {
    e.preventDefault();
    setOutreachSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outreachForm),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLead(data.lead);
      setOutreachForm({ channel: "EMAIL", notes: "", response: "" });
      setShowOutreach(false);
    } catch (err) {
      console.error("Outreach log failed:", err);
      setError("Unable to save outreach. Please try again.");
    } finally { setOutreachSaving(false); }
  }

  async function updateStatus(status: string) {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
      }
    } catch {}
  }

  const qualScore = lead.qualificationScore;
  const attempts = (lead.outreachAttempts ?? []) as Array<{ date: string; channel: string; notes: string; response: string | null; loggedBy: string }>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Pipeline
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>{lead.organizationName}</h1>
            <p className="text-sm text-gray-500">
              {lead.contactName}{lead.contactRole ? `, ${lead.contactRole}` : ""}
              {lead.country ? ` | ${lead.city ? `${lead.city}, ` : ""}${lead.country}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[lead.status]?.bg ?? "bg-gray-100"} ${STATUS_STYLES[lead.status]?.text ?? "text-gray-600"}`}>
              {lead.status.replace(/_/g, " ")}
            </span>
            {qualScore && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[qualScore]?.bg ?? "bg-gray-100"} ${STATUS_STYLES[qualScore]?.text ?? "text-gray-600"}`}>
                {qualScore}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Lead info + outreach */}
        <div className="lg:col-span-3 space-y-4">
          {/* Source + inbound context */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{lead.source.replace(/_/g, " ")}</span>
              <span className="text-xs text-gray-400">Added {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            {lead.inboundMessage && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Inbound Message</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{lead.inboundMessage}</p>
              </div>
            )}
            {lead.maarovaStream && (
              <div className="flex gap-4 text-xs text-gray-500 mb-2">
                <span>Stream: <span className="font-medium text-gray-700">{lead.maarovaStream}</span></span>
                {lead.maarovaLeaderCount && <span>Leaders: <span className="font-medium text-gray-700">{lead.maarovaLeaderCount}</span></span>}
                {lead.maarovaTimeline && <span>Timeline: <span className="font-medium text-gray-700">{lead.maarovaTimeline}</span></span>}
              </div>
            )}
            {lead.contactEmail && <p className="text-xs text-gray-400">{lead.contactEmail}{lead.contactPhone ? ` | ${lead.contactPhone}` : ""}</p>}
          </div>

          {/* Pain points */}
          {lead.knownPainPoints.length > 0 && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Known Pain Points</p>
              <div className="space-y-1">
                {lead.knownPainPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 mt-0.5">-</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outreach history */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outreach History ({attempts.length})</p>
              <button onClick={() => setShowOutreach(!showOutreach)} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F2744" }}>
                {showOutreach ? "Cancel" : "Log Outreach"}
              </button>
            </div>

            {showOutreach && (
              <form onSubmit={logOutreach} className="mb-4 p-4 rounded-lg space-y-3" style={{ background: "#F9FAFB" }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Channel</label>
                    <select value={outreachForm.channel} onChange={(e) => setOutreachForm((p) => ({ ...p, channel: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }}>
                      <option value="EMAIL">Email</option>
                      <option value="CALL">Call</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="IN_PERSON">In Person</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Response (if any)</label>
                    <input value={outreachForm.response} onChange={(e) => setOutreachForm((p) => ({ ...p, response: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} placeholder="What did they say?" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Notes *</label>
                  <textarea required value={outreachForm.notes} onChange={(e) => setOutreachForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "#e5eaf0" }} placeholder="What was sent/discussed?" />
                </div>
                <button type="submit" disabled={outreachSaving} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "#D4AF37" }}>
                  {outreachSaving ? "Saving..." : "Log"}
                </button>
              </form>
            )}

            {attempts.length === 0 ? (
              <p className="text-xs text-gray-400">No outreach attempts logged yet.</p>
            ) : (
              <div className="space-y-3">
                {attempts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0" style={{ borderColor: "#e5eaf0" }}>
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-500">{a.channel.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="font-medium text-gray-600">{a.channel}</span>
                        <span>{new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        <span>by {a.loggedBy}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{a.notes}</p>
                      {a.response && (
                        <p className="text-xs text-green-700 mt-1 bg-green-50 rounded px-2 py-1 inline-block">Response: {a.response}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discovery calls linked */}
          {lead.discoveryCalls.length > 0 && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Discovery Calls</p>
              {lead.discoveryCalls.map((dc) => (
                <Link key={dc.id} href={`/discovery-calls/${dc.id}`} className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[dc.status]?.bg ?? "bg-gray-100"} ${STATUS_STYLES[dc.status]?.text ?? "text-gray-600"}`}>
                    {dc.status}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(dc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  {dc.aiSummary && <span className="text-xs text-gray-400 truncate max-w-[300px]">{dc.aiSummary.substring(0, 80)}...</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/discovery-calls/new?leadId=${lead.id}`} className="text-xs font-semibold px-4 py-2 rounded-lg text-white" style={{ background: "#0F2744" }}>
              Schedule Discovery Call
            </Link>
            {lead.status !== "LOST" && (
              <button onClick={() => updateStatus("LOST")} className="text-xs font-medium px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50" style={{ borderColor: "#e5eaf0" }}>
                Mark as Lost
              </button>
            )}
          </div>
        </div>

        {/* Right: Nuru Intelligence Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-5 sticky top-6" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #0F2744, #1a3a5c)" }}>N</div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "#0F2744" }}>Nuru Intelligence</h3>
                <p className="text-[10px] text-gray-400">Lead Research & Qualification</p>
              </div>
            </div>

            <button onClick={runQualification} disabled={qualifying} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white mb-4 disabled:opacity-50" style={{ background: qualifying ? "#6B7280" : "#D4AF37" }}>
              {qualifying ? "Researching..." : lead.qualificationScore ? "Re-qualify" : "Qualify Lead"}
            </button>

            {/* Qualification results */}
            {lead.qualificationScore && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${STATUS_STYLES[lead.qualificationScore]?.bg ?? "bg-gray-100"} ${STATUS_STYLES[lead.qualificationScore]?.text ?? "text-gray-600"}`}>
                    {lead.qualificationScore}
                  </span>
                  {lead.estimatedSize && <span className="text-xs text-gray-500">{lead.estimatedSize}</span>}
                </div>

                {lead.qualificationNotes && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Assessment</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{lead.qualificationNotes}</p>
                  </div>
                )}

                {lead.serviceLineHook && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Service Line</p>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{lead.serviceLineHook}</span>
                  </div>
                )}

                {lead.outreachStrategy && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Outreach Angle</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{lead.outreachStrategy}</p>
                  </div>
                )}

                {(lead.decisionMakers as Array<{ name: string; role: string }> | null)?.length ? (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Decision Makers</p>
                    <div className="space-y-1">
                      {(lead.decisionMakers as Array<{ name: string; role: string }>).map((dm, i) => (
                        <p key={i} className="text-xs text-gray-600">
                          {dm.name ? `${dm.name} - ` : ""}{dm.role}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {lead.recentNews && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Research Notes</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{lead.recentNews}</p>
                  </div>
                )}

                {lead.competitorPresence && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Competitive Landscape</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{lead.competitorPresence}</p>
                  </div>
                )}
              </div>
            )}

            {!lead.qualificationScore && (
              <p className="text-xs text-gray-400 text-center py-4">Click "Qualify Lead" to get Nuru's research and qualification assessment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
