"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DiscoveryCallData {
  id: string;
  organizationName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  organizationType: string | null;
  scheduledAt: string | null;
  conductedAt: string | null;
  duration: number | null;
  status: string;
  rawNotes: string | null;
  problemsIdentified: string[];
  goalsStated: string[];
  stakeholders: string[];
  budgetSignals: string | null;
  urgencyLevel: string | null;
  currentState: string | null;
  aiSummary: string | null;
  aiServiceLineMatch: string[];
  aiSuggestedScope: string | null;
  aiFollowUpActions: string[];
  aiRedFlags: string[];
  convertedToClientId: string | null;
  convertedToClient: { id: string; name: string } | null;
  conductedBy: { id: string; name: string };
}

interface NuruAnalysis {
  summary: string;
  serviceLineMatches: string[];
  suggestedScope: string;
  followUpActions: string[];
  suggestedQuestions: string[];
  redFlags: string[];
  estimatedEngagementSize: string;
  readinessScore: number;
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none";
const inputStyle = { borderColor: "#e5eaf0" };

export default function DiscoveryCallDetail({
  call: initialCall,
  isElevated,
}: {
  call: DiscoveryCallData;
  isElevated: boolean;
}) {
  const router = useRouter();
  const [call, setCall] = useState(initialCall);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NuruAnalysis | null>(null);
  const [converting, setConverting] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [rawNotes, setRawNotes] = useState(call.rawNotes ?? "");
  const [problems, setProblems] = useState<string[]>(call.problemsIdentified);
  const [goals, setGoals] = useState<string[]>(call.goalsStated);
  const [stakeholders, setStakeholders] = useState<string[]>(call.stakeholders);
  const [budgetSignals, setBudgetSignals] = useState(call.budgetSignals ?? "");
  const [urgencyLevel, setUrgencyLevel] = useState(call.urgencyLevel ?? "");
  const [currentState, setCurrentState] = useState(call.currentState ?? "");
  const [newProblem, setNewProblem] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newStakeholder, setNewStakeholder] = useState("");

  // Convert form
  const [convertForm, setConvertForm] = useState({
    clientName: call.organizationName,
    email: call.contactEmail ?? "",
    phone: call.contactPhone ?? "",
    address: "",
    projectName: "",
    serviceType: "",
    budgetAmount: "",
  });

  const saveNotes = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/discovery-calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawNotes,
          problemsIdentified: problems,
          goalsStated: goals,
          stakeholders,
          budgetSignals,
          urgencyLevel,
          currentState,
          status: call.status === "SCHEDULED" ? "IN_PROGRESS" : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) setCall(data.call);
    } catch {}
    finally { setSaving(false); }
  }, [call.id, call.status, rawNotes, problems, goals, stakeholders, budgetSignals, urgencyLevel, currentState]);

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    await saveNotes();
    try {
      const res = await fetch(`/api/discovery-calls/${call.id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data.analysis);
      setCall(data.call);
    } catch (err) {
      console.error("Discovery call analysis failed:", err);
      setError("Unable to run the analysis. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setConverting(true);
    setError(null);
    try {
      const res = await fetch(`/api/discovery-calls/${call.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convertForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      router.push(`/clients/${data.client.id}`);
    } catch (err) {
      console.error("Discovery call conversion failed:", err);
      setError("Unable to convert this call. Please try again.");
    } finally {
      setConverting(false);
    }
  }

  async function completeCall() {
    setSaving(true);
    await saveNotes();
    try {
      const res = await fetch(`/api/discovery-calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const data = await res.json();
      if (res.ok) setCall(data.call);
    } catch {}
    finally { setSaving(false); }
  }

  const isCompleted = call.status === "COMPLETED";
  const isConverted = !!call.convertedToClientId;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/discovery-calls" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Discovery Calls
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>{call.organizationName}</h1>
            <p className="text-sm text-gray-500">
              {call.contactName}
              {call.organizationType && <> | <span className="capitalize">{call.organizationType.replace(/_/g, " ")}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isCompleted && (
              <button
                onClick={completeCall}
                disabled={saving}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                Mark Complete
              </button>
            )}
            {isCompleted && !isConverted && isElevated && (
              <button
                onClick={() => setShowConvert(!showConvert)}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
                style={{ background: "#0F2744" }}
              >
                {showConvert ? "Cancel" : "Convert to Project"}
              </button>
            )}
            {isConverted && call.convertedToClient && (
              <Link
                href={`/clients/${call.convertedToClient.id}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
              >
                View Client: {call.convertedToClient.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>}

      {/* Convert form */}
      {showConvert && (
        <form onSubmit={handleConvert} className="bg-white rounded-xl border p-5 mb-6 space-y-4" style={{ borderColor: "#e5eaf0" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Convert to Client and Project</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Client Name</label>
              <input value={convertForm.clientName} onChange={(e) => setConvertForm((p) => ({ ...p, clientName: e.target.value }))} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Email *</label>
              <input required type="email" value={convertForm.email} onChange={(e) => setConvertForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Phone</label>
              <input value={convertForm.phone} onChange={(e) => setConvertForm((p) => ({ ...p, phone: e.target.value }))} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Project Name</label>
              <input value={convertForm.projectName} onChange={(e) => setConvertForm((p) => ({ ...p, projectName: e.target.value }))} className={inputClass} style={inputStyle} placeholder={`${call.organizationName} Engagement`} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Address</label>
              <input value={convertForm.address} onChange={(e) => setConvertForm((p) => ({ ...p, address: e.target.value }))} className={inputClass} style={inputStyle} />
            </div>
          </div>
          <button type="submit" disabled={converting} className="text-sm px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: "#0F2744" }}>
            {converting ? "Converting..." : "Create Client + Project"}
          </button>
        </form>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel: Notes */}
        <div className="lg:col-span-3 space-y-4">
          {/* Current state */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current State</label>
            <textarea
              value={currentState}
              onChange={(e) => setCurrentState(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              style={inputStyle}
              placeholder="How does the client describe their current situation?"
            />
          </div>

          {/* Problems */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Problems Identified</label>
            <div className="space-y-1.5 mb-3">
              {problems.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-red-400 text-xs">-</span>
                  <span className="text-sm text-gray-700 flex-1">{p}</span>
                  <button onClick={() => setProblems((prev) => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-xs">x</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newProblem} onChange={(e) => setNewProblem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newProblem.trim()) { e.preventDefault(); setProblems((prev) => [...prev, newProblem.trim()]); setNewProblem(""); } }} className={`${inputClass} flex-1`} style={inputStyle} placeholder="Add a problem..." />
              <button onClick={() => { if (newProblem.trim()) { setProblems((prev) => [...prev, newProblem.trim()]); setNewProblem(""); } }} className="text-xs px-3 py-2 rounded-lg border font-medium" style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>Add</button>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Goals Stated</label>
            <div className="space-y-1.5 mb-3">
              {goals.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">-</span>
                  <span className="text-sm text-gray-700 flex-1">{g}</span>
                  <button onClick={() => setGoals((prev) => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 text-xs">x</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newGoal.trim()) { e.preventDefault(); setGoals((prev) => [...prev, newGoal.trim()]); setNewGoal(""); } }} className={`${inputClass} flex-1`} style={inputStyle} placeholder="Add a goal..." />
              <button onClick={() => { if (newGoal.trim()) { setGoals((prev) => [...prev, newGoal.trim()]); setNewGoal(""); } }} className="text-xs px-3 py-2 rounded-lg border font-medium" style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>Add</button>
            </div>
          </div>

          {/* Stakeholders + Budget + Urgency */}
          <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: "#e5eaf0" }}>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Stakeholders</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {stakeholders.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                    {s}
                    <button onClick={() => setStakeholders((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400">x</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newStakeholder} onChange={(e) => setNewStakeholder(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newStakeholder.trim()) { e.preventDefault(); setStakeholders((prev) => [...prev, newStakeholder.trim()]); setNewStakeholder(""); } }} className={`${inputClass} flex-1`} style={inputStyle} placeholder="Add stakeholder name..." />
                <button onClick={() => { if (newStakeholder.trim()) { setStakeholders((prev) => [...prev, newStakeholder.trim()]); setNewStakeholder(""); } }} className="text-xs px-3 py-2 rounded-lg border font-medium" style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>Add</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Budget Signals</label>
                <input value={budgetSignals} onChange={(e) => setBudgetSignals(e.target.value)} className={inputClass} style={inputStyle} placeholder="Any budget indicators..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Urgency</label>
                <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="">Not assessed</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Raw notes */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#e5eaf0" }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Raw Notes</label>
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              rows={10}
              className={`${inputClass} resize-none font-mono text-xs`}
              style={inputStyle}
              placeholder="Free-form notes during the call..."
            />
          </div>

          {/* Save button */}
          <button
            onClick={saveNotes}
            disabled={saving}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            {saving ? "Saving..." : "Save Notes"}
          </button>
        </div>

        {/* Right panel: Nuru */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5 sticky top-6" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #0F2744, #1a3a5c)" }}>
                N
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "#0F2744" }}>Nuru</h3>
                <p className="text-[10px] text-gray-400">C4A Intelligence</p>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white mb-4 disabled:opacity-50 transition-all hover:scale-[1.01]"
              style={{ background: analyzing ? "#6B7280" : "#D4A574" }}
            >
              {analyzing ? "Analyzing..." : "Analyze Notes"}
            </button>

            {/* Analysis results */}
            {(analysis || call.aiSummary) && (
              <div className="space-y-4">
                {/* Service line matches */}
                {(analysis?.serviceLineMatches ?? call.aiServiceLineMatch).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Line Match</p>
                    <div className="space-y-1">
                      {(analysis?.serviceLineMatches ?? call.aiServiceLineMatch).map((sl, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-green-500">&#10003;</span>
                          <span className="text-gray-700">{sl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {(analysis?.summary ?? call.aiSummary) && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Summary</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{analysis?.summary ?? call.aiSummary}</p>
                  </div>
                )}

                {/* Engagement size + readiness */}
                {analysis && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3" style={{ background: "#F9FAFB" }}>
                      <p className="text-[10px] text-gray-500">Est. Size</p>
                      <p className="text-sm font-bold" style={{ color: "#0F2744" }}>{analysis.estimatedEngagementSize}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "#F9FAFB" }}>
                      <p className="text-[10px] text-gray-500">Readiness</p>
                      <p className="text-sm font-bold" style={{ color: "#0F2744" }}>{analysis.readinessScore}/10</p>
                    </div>
                  </div>
                )}

                {/* Suggested questions */}
                {analysis?.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Questions to Ask</p>
                    <div className="space-y-1.5">
                      {analysis.suggestedQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-blue-400 mt-0.5">?</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Red flags */}
                {(analysis?.redFlags ?? call.aiRedFlags).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Red Flags</p>
                    <div className="space-y-1.5">
                      {(analysis?.redFlags ?? call.aiRedFlags).map((rf, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                          <span className="mt-0.5">&#9888;</span>
                          <span>{rf}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up actions */}
                {(analysis?.followUpActions ?? call.aiFollowUpActions).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Next Steps</p>
                    <div className="space-y-1.5">
                      {(analysis?.followUpActions ?? call.aiFollowUpActions).map((a, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-gray-400 mt-0.5">{i + 1}.</span>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested scope */}
                {(analysis?.suggestedScope ?? call.aiSuggestedScope) && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Suggested Scope</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{analysis?.suggestedScope ?? call.aiSuggestedScope}</p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!analysis && !call.aiSummary && (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">Add notes, problems, and goals, then click Analyze to get Nuru's insights.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
