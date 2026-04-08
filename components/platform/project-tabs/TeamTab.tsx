"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  Star,
  Plus,
  Sparkles,
} from "lucide-react";
import StatusBadge from "../StatusBadge";
import ConsultantMatchingWidget from "../ConsultantMatchingWidget";
import type { Project } from "./types";
import { formatCompactCurrency, formatEnumLabel } from "@/lib/utils";

export default function TeamTab({ project, isEM, isConsultant = false }: { project: Project; isEM: boolean; isConsultant?: boolean }) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState(project.assignments);

  // Sync with server props when they change
  useEffect(() => { setAssignments(project.assignments); }, [project.assignments]);
  const [showStaffingForm, setShowStaffingForm] = useState(false);
  const [staffingForm, setStaffingForm] = useState({
    role: "", description: "", skillsRequired: "", hoursPerWeek: "20",
    duration: "", rateType: "MONTHLY", rateBudget: "", urgency: "normal",
  });
  const [staffingSaving, setStaffingSaving] = useState(false);
  const [staffingSuccess, setStaffingSuccess] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [nuruSuggesting, setNuruSuggesting] = useState(false);
  const [nuruBuildingProfiles, setNuruBuildingProfiles] = useState(false);
  const [nuruProfiles, setNuruProfiles] = useState<Array<{ role: string; description: string; skills: string[]; hoursPerWeek: number; rateType: string; rationale: string }>>([]);
  const [localStaffingRequests, setLocalStaffingRequests] = useState(project.staffingRequests);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [expressions, setExpressions] = useState<Array<{ id: string; note: string | null; status: string; consultant: { id: string; name: string; email: string; profile: { title: string; location: string; tier: string; yearsExperience: number } | null } }>>([]);
  const [loadingExpressions, setLoadingExpressions] = useState(false);
  const [actioningExpression, setActioningExpression] = useState<string | null>(null);

  async function toggleExpressions(requestId: string) {
    if (expandedRequestId === requestId) { setExpandedRequestId(null); return; }
    setExpandedRequestId(requestId);
    setLoadingExpressions(true);
    try {
      const res = await fetch(`/api/staffing/${requestId}/expressions`);
      if (res.ok) { const data = await res.json(); setExpressions(data.expressions ?? []); }
    } catch {}
    finally { setLoadingExpressions(false); }
  }

  async function handleExpressionAction(requestId: string, expressionId: string, action: string) {
    setActioningExpression(expressionId);
    try {
      await fetch(`/api/staffing/${requestId}/expressions`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expressionId, action }) });
      const res = await fetch(`/api/staffing/${requestId}/expressions`);
      if (res.ok) { const data = await res.json(); setExpressions(data.expressions ?? []); }
    } catch {}
    finally { setActioningExpression(null); }
  }

  // All available skills from taxonomy
  const ALL_SKILLS = [
    "Hospital Operations", "Revenue Cycle", "Clinical Governance", "Patient Safety", "Quality Improvement",
    "Financial Management", "Health Insurance (NHIS/HMO)", "Supply Chain", "Pharmacy Management",
    "Digital Health", "EMR/HIS", "Data Analytics", "Change Management", "HR Management",
    "Strategy & Planning", "Business Development", "Process Engineering", "Facilities Management",
    "Nursing Leadership", "Medical Director", "Health Policy", "M&E", "Epidemiology",
    "Marketing", "Legal & Compliance", "Risk Management", "Internal Audit", "Training & Development",
    "Capital Projects", "Architecture", "Biomedical Engineering", "Community Health",
  ];

  function handleSkillInput(value: string) {
    setSkillInput(value);
    if (value.length > 1) {
      setSkillSuggestions(ALL_SKILLS.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && !staffingForm.skillsRequired.includes(s)).slice(0, 5));
    } else {
      setSkillSuggestions([]);
    }
  }

  function addSkill(skill: string) {
    const current = staffingForm.skillsRequired ? staffingForm.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (!current.includes(skill)) {
      setStaffingForm((p) => ({ ...p, skillsRequired: [...current, skill].join(", ") }));
    }
    setSkillInput("");
    setSkillSuggestions([]);
  }

  async function nuruSuggestStaffing() {
    setNuruSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest-staffing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          serviceType: project.serviceType,
          description: project.description,
          existingTeam: project.assignments.map((a) => `${a.consultant.name} (${a.role})`),
        }),
      });
      if (res.ok) {
        const { suggestion } = await res.json();
        if (suggestion) {
          setStaffingForm((p) => ({
            ...p,
            role: suggestion.role || p.role,
            description: suggestion.description || p.description,
            skillsRequired: Array.isArray(suggestion.skills) ? suggestion.skills.join(", ") : p.skillsRequired,
            hoursPerWeek: suggestion.hoursPerWeek?.toString() || p.hoursPerWeek,
            rateType: suggestion.rateType || p.rateType,
          }));
        }
      }
    } catch {}
    finally { setNuruSuggesting(false); }
  }

  async function nuruBuildTeamProfiles() {
    setNuruBuildingProfiles(true);
    setNuruProfiles([]);
    try {
      const res = await fetch("/api/ai/suggest-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          serviceType: project.serviceType,
          description: project.description,
          deliverables: project.deliverables.map((d) => d.name),
          phases: project.phases.map((p) => p.name),
          existingTeam: project.assignments.map((a) => `${a.consultant.name} (${a.role})`),
          existingRequests: localStaffingRequests.map((sr) => sr.role),
        }),
      });
      if (res.ok) {
        const { profiles } = await res.json();
        setNuruProfiles(Array.isArray(profiles) ? profiles : []);
      }
    } catch {}
    finally { setNuruBuildingProfiles(false); }
  }

  function editFromProfile(profile: typeof nuruProfiles[0], idx: number) {
    setStaffingForm({
      role: profile.role,
      description: profile.description,
      skillsRequired: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
      hoursPerWeek: String(profile.hoursPerWeek || 20),
      duration: "",
      rateType: profile.rateType || "MONTHLY",
      rateBudget: "",
      urgency: "normal",
    });
    setShowStaffingForm(true);
    setNuruProfiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function createStaffingRequest(e: React.FormEvent) {
    e.preventDefault();
    setStaffingSaving(true);
    setStaffingSuccess(null);
    try {
      const res = await fetch("/api/staffing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          role: staffingForm.role,
          description: staffingForm.description,
          skillsRequired: staffingForm.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean),
          hoursPerWeek: parseInt(staffingForm.hoursPerWeek, 10),
          duration: staffingForm.duration || null,
          rateType: staffingForm.rateType,
          rateBudget: staffingForm.rateBudget ? parseFloat(staffingForm.rateBudget) : null,
          urgency: staffingForm.urgency,
        }),
      });
      if (!res.ok) throw new Error("Failed to create staffing request");
      setStaffingSuccess("Staffing request created. Consultants will be notified.");
      setStaffingForm({ role: "", description: "", skillsRequired: "", hoursPerWeek: "20", duration: "", rateType: "MONTHLY", rateBudget: "", urgency: "normal" });
      setShowStaffingForm(false);
      router.refresh();
      setTimeout(() => setStaffingSuccess(null), 5000);
    } catch {}
    finally { setStaffingSaving(false); }
  }

  async function removeConsultant(assignmentId: string) {
    if (!confirm("Remove this consultant from the project?")) return;
    setRemovingId(assignmentId);
    try {
      const res = await fetch(`/api/projects/${project.id}/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No consultants assigned yet.</p>
        </div>
      ) : (
        assignments.map((a) => {
          const approved = a.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT").length;
          const totalHours = a.timeEntries.reduce((sum, te) => sum + te.hours, 0);
          const p = a.consultant.consultantProfile;

          return (
            <div
              key={a.id}
              className="rounded-xl p-5"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                      style={{ background: "#0F2744" }}
                    >
                      {a.consultant.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{a.consultant.name}</p>
                      <p className="text-xs text-gray-500">{p?.title ?? a.role}</p>
                    </div>
                  </div>
                  {p && (
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={11} />
                        {p.location}
                        {p.isDiaspora && (
                          <span
                            className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: "#EFF6FF", color: "#3B82F6" }}
                          >
                            Diaspora
                          </span>
                        )}
                      </span>
                      {p.averageRating && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Star size={10} className="text-amber-400" />
                          {p.averageRating.toFixed(1)}
                        </span>
                      )}
                      <StatusBadge status={p.availabilityStatus} />
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {!isConsultant && a.rateAmount > 0 && (
                    <p className="text-sm font-semibold text-gray-900">
                      {a.rateCurrency === "USD"
                        ? `$${a.rateAmount}/${a.rateType === "HOURLY" ? "hr" : "mo"}`
                        : `${formatCompactCurrency(a.rateAmount, "NGN")}/${a.rateType === "HOURLY" ? "hr" : "mo"}`}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{a.role}</p>
                </div>
              </div>

              {/* Performance row */}
              <div
                className="mt-4 pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500"
                style={{ borderTop: "1px solid #f0f0f0" }}
              >
                <span>
                  <span className="font-semibold text-gray-800">{a.deliverables.length}</span> deliverables
                </span>
                <span>
                  <span className="font-semibold text-gray-800">{approved}</span> approved
                </span>
                <span>
                  <span className="font-semibold text-gray-800">{totalHours.toFixed(0)}h</span> logged
                </span>
                {p?.expertiseAreas && p.expertiseAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.expertiseAreas.slice(0, 3).map((area) => (
                      <span
                        key={area}
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                      >
                        {formatEnumLabel(area)}
                      </span>
                    ))}
                  </div>
                )}
                {isEM && (
                  <button
                    onClick={() => removeConsultant(a.id)}
                    disabled={removingId === a.id}
                    className="ml-auto text-[11px] text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {removingId === a.id ? "Removing..." : "Remove"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Staffing Request */}
      {isEM && (
        <div className="space-y-3">
          {staffingSuccess && (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{staffingSuccess}</div>
          )}

          {!showStaffingForm ? (
            <button
              onClick={() => setShowStaffingForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.01]"
              style={{ background: "#D4AF37", color: "#06090f" }}
            >
              <Plus size={14} />
              Post Staffing Request
            </button>
          ) : (
            <form
              onSubmit={createStaffingRequest}
              className="rounded-xl p-5 space-y-4"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>New Staffing Request</h3>
                  <p className="text-xs text-gray-400">Describe the role needed. Matching consultants will be notified and can express interest.</p>
                </div>
                <button
                  onClick={nuruSuggestStaffing}
                  disabled={nuruSuggesting}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  style={{ background: "#D4AF37" + "15", color: "#92400E", border: "1px solid " + "#D4AF37" + "40" }}
                >
                  <Sparkles size={12} />
                  {nuruSuggesting ? "Thinking..." : "Nuru: Auto-fill"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
                  <input required value={staffingForm.role} onChange={(e) => setStaffingForm((p) => ({ ...p, role: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} placeholder="e.g. Senior Operations Consultant" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Urgency</label>
                  <select value={staffingForm.urgency} onChange={(e) => setStaffingForm((p) => ({ ...p, urgency: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                <textarea required value={staffingForm.description} onChange={(e) => setStaffingForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "#e5eaf0" }} placeholder="What will this person do on the engagement?" />
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Skills Required</label>
                {/* Skill tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {staffingForm.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean).map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: "#0F2744" + "10", color: "#0F2744" }}>
                      {skill}
                      <button onClick={() => setStaffingForm((p) => ({ ...p, skillsRequired: p.skillsRequired.split(",").map((s) => s.trim()).filter((s) => s !== skill).join(", ") }))} className="text-gray-400 hover:text-red-400">x</button>
                    </span>
                  ))}
                </div>
                <input
                  value={skillInput}
                  onChange={(e) => handleSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && skillInput.trim()) { e.preventDefault(); addSkill(skillInput.trim()); } }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5eaf0" }}
                  placeholder="Type to search skills..."
                />
                {skillSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg" style={{ borderColor: "#e5eaf0" }}>
                    {skillSuggestions.map((s) => (
                      <button key={s} onClick={() => addSkill(s)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hours/Week *</label>
                  <input required type="number" value={staffingForm.hoursPerWeek} onChange={(e) => setStaffingForm((p) => ({ ...p, hoursPerWeek: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} min="5" max="60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate Type *</label>
                  <select value={staffingForm.rateType} onChange={(e) => setStaffingForm((p) => ({ ...p, rateType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }}>
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="FIXED_PROJECT">Fixed Project</option>
                    <option value="FIXED_DELIVERABLE">Per Deliverable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Budget (NGN)</label>
                  <input type="number" value={staffingForm.rateBudget} onChange={(e) => setStaffingForm((p) => ({ ...p, rateBudget: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} placeholder="Optional" />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={staffingSaving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
                  {staffingSaving ? "Creating..." : "Post Request"}
                </button>
                <button type="button" onClick={() => setShowStaffingForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border" style={{ borderColor: "#e5eaf0" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Existing Staffing Requests */}
      {localStaffingRequests.length > 0 && (
        <div className="rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: "#F9FAFB", borderBottom: "1px solid #e5eaf0" }}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Staffing Requests ({localStaffingRequests.length})
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
            {localStaffingRequests.map((sr) => {
              const statusColors: Record<string, { bg: string; text: string }> = {
                OPEN: { bg: "bg-blue-50", text: "text-blue-700" },
                IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700" },
                FILLED: { bg: "bg-green-50", text: "text-green-700" },
                CANCELLED: { bg: "bg-gray-100", text: "text-gray-500" },
              };
              const st = statusColors[sr.status] ?? statusColors.OPEN;
              const isExpanded = expandedRequestId === sr.id;
              return (
                <div key={sr.id} className="bg-white">
                  <button
                    onClick={() => sr.expressionCount > 0 ? toggleExpressions(sr.id) : undefined}
                    className={`w-full text-left px-5 py-3 ${sr.expressionCount > 0 ? "cursor-pointer hover:bg-gray-50" : ""} transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "#0F2744" }}>{sr.role}</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{sr.status}</span>
                        {sr.expressionCount > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                            {sr.expressionCount} interested {isExpanded ? "▾" : "▸"}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {sr.hoursPerWeek}h/wk | {sr.rateType.replace(/_/g, " ")}
                        {!isConsultant && sr.rateBudget ? ` | ${sr.rateCurrency} ${sr.rateBudget.toLocaleString()}` : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{sr.description}</p>
                    {sr.skillsRequired.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {sr.skillsRequired.slice(0, 5).map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{s}</span>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Expressions review (inline) */}
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t" style={{ borderColor: "#e5eaf0" }}>
                      {loadingExpressions ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                        </div>
                      ) : expressions.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3">No expressions loaded.</p>
                      ) : (
                        <div className="space-y-2 pt-3">
                          {expressions.map((exp) => (
                            <div key={exp.id} className="rounded-lg border p-3" style={{ borderColor: "#e5eaf0" }}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{exp.consultant.name}</p>
                                  <p className="text-[10px] text-gray-400">
                                    {exp.consultant.profile?.title ?? exp.consultant.email}
                                    {exp.consultant.profile ? ` | ${exp.consultant.profile.location} | ${exp.consultant.profile.tier} | ${exp.consultant.profile.yearsExperience}yr` : ""}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${exp.status === "INTERESTED" ? "bg-blue-50 text-blue-700" : exp.status === "SHORTLISTED" ? "bg-amber-50 text-amber-700" : exp.status === "SELECTED" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                  {exp.status}
                                </span>
                              </div>
                              {exp.note && <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded p-2">{exp.note}</p>}
                              {(exp.status === "INTERESTED" || exp.status === "SHORTLISTED") && (
                                <div className="flex gap-2 mt-2">
                                  {exp.status === "INTERESTED" && (
                                    <button onClick={() => handleExpressionAction(sr.id, exp.id, "SHORTLISTED")} disabled={actioningExpression === exp.id} className="text-[10px] font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">Shortlist</button>
                                  )}
                                  <button onClick={() => handleExpressionAction(sr.id, exp.id, "SELECTED")} disabled={actioningExpression === exp.id} className="text-[10px] font-medium px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">Select & Assign</button>
                                  <button onClick={() => handleExpressionAction(sr.id, exp.id, "PASSED")} disabled={actioningExpression === exp.id} className="text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-50">Pass</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nuru Team Builder */}
      {isEM && (
        <div className="rounded-xl" style={{ border: "1px solid #D4AF37" + "40", background: "#D4AF37" + "05" }}>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "#D4AF37" }} />
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Nuru Team Builder</h3>
                  <p className="text-[10px] text-gray-400">Analyzes your deliverables, phases, and existing team to suggest all roles needed</p>
                </div>
              </div>
              <button
                onClick={nuruBuildTeamProfiles}
                disabled={nuruBuildingProfiles}
                className="text-xs px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
                style={{ background: "#D4AF37" }}
              >
                {nuruBuildingProfiles ? "Analyzing Project..." : "Build Team Profiles"}
              </button>
            </div>

            {nuruProfiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500">{nuruProfiles.length} roles suggested. Click to post as staffing requests.</p>
                {nuruProfiles.map((profile, idx) => (
                  <div key={idx} className="bg-white rounded-lg border p-4" style={{ borderColor: "#e5eaf0" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{profile.role}</p>
                        <p className="text-xs text-gray-500 mt-1">{profile.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.skills.map((s, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#0F2744" + "10", color: "#0F2744" }}>{s}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1.5">{profile.hoursPerWeek}h/wk | {profile.rateType} | {profile.rationale}</p>
                      </div>
                      <button
                        onClick={() => editFromProfile(profile, idx)}
                        className="text-xs px-3 py-1.5 rounded-lg text-white font-medium shrink-0"
                        style={{ background: "#0F2744" }}
                      >
                        Edit &amp; Post
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Matching */}
      <ConsultantMatchingWidget
        projectId={project.id}
        projectServiceType={project.serviceType}
        projectStartDate={project.startDate}
        projectEndDate={project.endDate}
        isEM={isEM}
      />
    </div>
  );
}
