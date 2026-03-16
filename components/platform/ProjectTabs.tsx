"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutGrid,
  Users,
  FileCheck,
  Flag,
  Briefcase,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  Star,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Circle,
  XCircle,
  Send,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import ConsultantMatchingWidget from "./ConsultantMatchingWidget";
import ProjectRiskAnalysis from "./ProjectRiskAnalysis";
import ProjectStatusEditor from "./ProjectStatusEditor";
import HealthScoreBar from "./project/HealthScoreBar";
import DeliverablesPipeline from "./project/DeliverablesPipeline";
import TeamWorkload from "./project/TeamWorkload";
import RiskRegister from "./project/RiskRegister";
import PhaseTracker from "./project/PhaseTracker";
import FinancialPL from "./project/FinancialPL";
import ImpactMetrics from "./project/ImpactMetrics";
import ProjectFrameworks from "./project/ProjectFrameworks";
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  timeAgo,
  budgetUtilization,
  daysRemaining,
  timelineProgress,
  healthBg,
  healthColor,
} from "@/lib/utils";

type Tab = "overview" | "team" | "deliverables" | "timeline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsultantProfile {
  title: string;
  location: string;
  isDiaspora: boolean;
  expertiseAreas: string[];
  tier: string;
  averageRating: number | null;
  availabilityStatus: string;
  hourlyRateUSD: number | null;
  monthlyRateNGN: number | null;
}

interface Assignment {
  id: string;
  role: string;
  responsibilities: string;
  status: string;
  rateAmount: number;
  rateCurrency: string;
  rateType: string;
  estimatedHours: number | null;
  consultant: {
    id: string;
    name: string;
    email: string;
    consultantProfile: ConsultantProfile | null;
  };
  deliverables: { status: string }[];
  timeEntries: { hours: number; billableAmount: number | null; currency: string }[];
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: string;
  completionDate: string | null;
  order: number;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
  status: string;
  dueDate?: string | null;
  submittedAt: string | null;
  reviewScore: number | null;
  reviewNotes: string | null;
  version: number;
  assignmentId?: string | null;
  assignment: { id?: string; consultant: { name: string } } | null;
}

interface ProjectUpdate {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  createdBy: { name: string };
}

interface PhaseGate {
  id: string;
  name: string;
  passed: boolean;
  passedAt: string | null;
  notes: string | null;
}

interface Phase {
  id: string;
  name: string;
  description: string | null;
  order: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "SKIPPED";
  percentComplete: number;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  createdAt: string;
  gates: PhaseGate[];
}

interface RiskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "RED" | "AMBER" | "GREEN";
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigation: string | null;
  status: "OPEN" | "MITIGATING" | "RESOLVED" | "ACCEPTED";
  resolvedAt: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  riskLevel: string;
  healthScore: number | null;
  budgetAmount: number;
  budgetCurrency: "NGN" | "USD";
  actualSpent: number;
  startDate: string;
  endDate: string;
  serviceType: string;
  notes: string | null;
  client: { name: string; primaryContact: string; email: string; phone: string };
  engagementManager: { id: string; name: string; email: string };
  assignments: Assignment[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  updates: ProjectUpdate[];
  phases: Phase[];
  risks: RiskItem[];
}

export default function ProjectTabs({
  project,
  userId,
  userRole,
}: {
  project: Project;
  userId: string;
  userRole: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [delivFilter, setDelivFilter] = useState("all");
  const [updateContent, setUpdateContent] = useState("");
  const [updateType, setUpdateType] = useState("GENERAL");
  const [posting, startPosting] = useTransition();
  const [updateError, setUpdateError] = useState("");

  const tabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    { key: "team", label: "Team", icon: Users },
    { key: "deliverables", label: "Deliverables", icon: FileCheck },
    { key: "timeline", label: "Timeline", icon: Flag },
  ];

  const budgetPct = budgetUtilization(project.actualSpent, project.budgetAmount);
  const days = daysRemaining(new Date(project.endDate));
  const timelinePct = timelineProgress(new Date(project.startDate), new Date(project.endDate));
  const health = project.healthScore ?? 3;

  const completedDeliverables = project.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT").length;
  const pendingReview = project.deliverables.filter((d) => d.status === "SUBMITTED" || d.status === "IN_REVIEW").length;
  const completedMilestones = project.milestones.filter((m) => m.status === "COMPLETED").length;

  async function postUpdate() {
    if (!updateContent.trim()) return;
    setUpdateError("");
    startPosting(async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/updates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: updateContent, type: updateType }),
        });
        if (!res.ok) { setUpdateError("Failed to post update. Try again."); return; }
        setUpdateContent("");
        window.location.reload();
      } catch {
        setUpdateError("Network error. Try again.");
      }
    });
  }

  const filteredDeliverables =
    delivFilter === "all"
      ? project.deliverables
      : project.deliverables.filter((d) => {
          if (delivFilter === "pending") return d.status === "SUBMITTED" || d.status === "IN_REVIEW";
          if (delivFilter === "approved") return d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT";
          if (delivFilter === "revision") return d.status === "NEEDS_REVISION";
          return true;
        });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab bar */}
      <div
        className="flex items-center gap-0.5 px-6 shrink-0"
        style={{ background: "#fff", borderBottom: "1px solid #e5eaf0" }}
      >
        <Link
          href="/projects"
          className="flex items-center gap-1.5 mr-4 text-xs text-gray-400 hover:text-gray-700 transition-colors py-4"
        >
          <ArrowLeft size={13} />
          Back
        </Link>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={{
              borderColor: tab === key ? "#D4AF37" : "transparent",
              color: tab === key ? "#0F2744" : "#6B7280",
            }}
          >
            <Icon size={14} />
            {label}
            {key === "deliverables" && pendingReview > 0 && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "#FEF3C7", color: "#D97706" }}
              >
                {pendingReview}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto p-6">
        {tab === "overview" && (
          <OverviewTab
            project={project}
            budgetPct={budgetPct}
            days={days}
            timelinePct={timelinePct}
            health={health}
            completedDeliverables={completedDeliverables}
            completedMilestones={completedMilestones}
            updateContent={updateContent}
            updateType={updateType}
            posting={posting}
            updateError={updateError}
            onContentChange={setUpdateContent}
            onTypeChange={setUpdateType}
            onPost={postUpdate}
            isEM={["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(userRole)}
            userRole={userRole}
          />
        )}
        {tab === "team" && (
          <TeamTab
            project={project}
            isEM={["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(userRole)}
          />
        )}
        {tab === "deliverables" && (
          <DeliverablesTab
            project={project}
            filter={delivFilter}
            onFilterChange={setDelivFilter}
            filteredDeliverables={filteredDeliverables}
          />
        )}
        {tab === "timeline" && <TimelineTab project={project} />}
      </main>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  project,
  budgetPct,
  days,
  timelinePct,
  health,
  completedDeliverables,
  completedMilestones,
  updateContent,
  updateType,
  posting,
  updateError,
  onContentChange,
  onTypeChange,
  onPost,
  isEM,
  userRole,
}: {
  project: Project;
  budgetPct: number;
  days: number;
  timelinePct: number;
  health: number;
  completedDeliverables: number;
  completedMilestones: number;
  updateContent: string;
  updateType: string;
  posting: boolean;
  updateError: string;
  onContentChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onPost: () => void;
  isEM: boolean;
  userRole: string;
}) {
  const deliverablesPct =
    project.deliverables.length > 0
      ? Math.round((completedDeliverables / project.deliverables.length) * 100)
      : 0;

  const qualityAvg =
    project.deliverables.filter((d) => d.reviewScore !== null).length > 0
      ? project.deliverables
          .filter((d) => d.reviewScore !== null)
          .reduce((s, d) => s + (d.reviewScore ?? 0), 0) /
        project.deliverables.filter((d) => d.reviewScore !== null).length
      : null;

  const canManageFinancials = ["PARTNER", "ADMIN", "DIRECTOR"].includes(userRole);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header strip */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={project.status} />
            <StatusBadge status={project.riskLevel} />
            <span className="text-xs text-gray-400">{project.serviceType.replace(/_/g, " ")}</span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-gray-500">
              {project.client.name} · EM: {project.engagementManager.name}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-3xl">{project.description}</p>
        </div>
        {isEM && (
          <ProjectStatusEditor
            projectId={project.id}
            currentStatus={project.status}
            currentRiskLevel={project.riskLevel}
            currentHealthScore={project.healthScore}
          />
        )}
      </div>

      {/* Key metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Budget Used"
          value={`${budgetPct}%`}
          sub={`${formatCompactCurrency(project.actualSpent, project.budgetCurrency)} of ${formatCompactCurrency(project.budgetAmount, project.budgetCurrency)}`}
          color={budgetPct > 90 ? "#EF4444" : budgetPct > 75 ? "#F59E0B" : "#10B981"}
          icon={Briefcase}
        />
        <MetricCard
          label="Timeline"
          value={days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
          sub={`${timelinePct}% elapsed`}
          color={days < 0 ? "#EF4444" : days < 14 ? "#F59E0B" : "#10B981"}
          icon={Calendar}
        />
        <MetricCard
          label="Deliverables"
          value={`${completedDeliverables}/${project.deliverables.length}`}
          sub={`${deliverablesPct}% approved`}
          color="#3B82F6"
          icon={FileCheck}
        />
        <MetricCard
          label="Milestones"
          value={`${completedMilestones}/${project.milestones.length}`}
          sub="completed"
          color="#8B5CF6"
          icon={Flag}
        />
      </div>

      {/* Main 2-column grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-5">
          {/* Health + Pipeline side by side */}
          <div className="grid sm:grid-cols-2 gap-5">
            <HealthScoreBar
              healthScore={project.healthScore}
              budgetPct={budgetPct}
              timelinePct={timelinePct}
              daysRemaining={days}
              deliverablesPct={deliverablesPct}
              qualityAvg={qualityAvg}
            />
            <DeliverablesPipeline deliverables={project.deliverables} />
          </div>

          {/* Phase Tracker */}
          <PhaseTracker
            projectId={project.id}
            initialPhases={project.phases}
            canEdit={isEM}
          />

          {/* Risk Register */}
          <RiskRegister
            projectId={project.id}
            initialRisks={project.risks}
            canEdit={isEM}
          />

          {/* Impact Metrics */}
          <ImpactMetrics projectId={project.id} canEdit={isEM} />

          {/* Analysis Frameworks */}
          <ProjectFrameworks projectId={project.id} canEdit={isEM} />

          {/* AI Risk Analysis */}
          <ProjectRiskAnalysis projectId={project.id} isEM={isEM} />
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-5">
          {/* Team Workload */}
          <TeamWorkload assignments={project.assignments} />

          {/* Financial P&L */}
          <FinancialPL
            projectId={project.id}
            budgetAmount={project.budgetAmount}
            actualSpent={project.actualSpent}
            budgetCurrency={project.budgetCurrency}
            canManage={canManageFinancials}
          />

          {/* Activity feed */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>

            {project.updates.length === 0 ? (
              <p className="text-xs text-gray-400">No updates yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {project.updates.map((u) => (
                  <div key={u.id} className="flex items-start gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: "#D4AF37" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 leading-snug">{u.content}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400">{u.createdBy.name}</span>
                        <span className="text-gray-200 text-[10px]">·</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(new Date(u.createdAt))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Post update form */}
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
              <textarea
                value={updateContent}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Post an update..."
                rows={2}
                className="w-full text-xs rounded-lg px-3 py-2 resize-none focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
              />
              <div className="flex items-center gap-2 mt-1.5">
                <select
                  value={updateType}
                  onChange={(e) => onTypeChange(e.target.value)}
                  className="text-[10px] rounded-lg px-2 py-1 focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", color: "#374151" }}
                >
                  <option value="GENERAL">General</option>
                  <option value="MILESTONE_COMPLETED">Milestone</option>
                  <option value="ISSUE">Issue</option>
                  <option value="CLIENT_FEEDBACK">Client Feedback</option>
                  <option value="TEAM_CHANGE">Team Change</option>
                </select>
                <button
                  onClick={onPost}
                  disabled={!updateContent.trim() || posting}
                  className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold disabled:opacity-50"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  {posting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                  Post
                </button>
              </div>
              {updateError && (
                <p className="mt-1.5 text-[10px] text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} />
                  {updateError}
                </p>
              )}
            </div>
          </div>

          {/* Internal notes */}
          {project.notes && (
            <div
              className="rounded-xl p-4 text-xs text-gray-600 leading-relaxed"
              style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
            >
              <span className="font-semibold text-amber-700 mr-1.5">Notes:</span>
              {project.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab({ project, isEM }: { project: Project; isEM: boolean }) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState(project.assignments);

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
                  <p className="text-sm font-semibold text-gray-900">
                    {a.rateCurrency === "USD"
                      ? `$${a.rateAmount}/${a.rateType === "HOURLY" ? "hr" : "mo"}`
                      : `${formatCompactCurrency(a.rateAmount, "NGN")}/${a.rateType === "HOURLY" ? "hr" : "mo"}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.role}</p>
                </div>
              </div>

              {/* Performance row */}
              <div
                className="mt-4 pt-4 flex items-center gap-6 text-xs text-gray-500"
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
                {p?.expertiseAreas && (
                  <div className="flex flex-wrap gap-1">
                    {p.expertiseAreas.slice(0, 3).map((area) => (
                      <span
                        key={area}
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                      >
                        {area}
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

// ─── Deliverables Tab ─────────────────────────────────────────────────────────

function DeliverablesTab({
  project,
  filter,
  onFilterChange,
  filteredDeliverables,
}: {
  project: Project;
  filter: string;
  onFilterChange: (f: string) => void;
  filteredDeliverables: Deliverable[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDeliv, setNewDeliv] = useState({ name: "", description: "", dueDate: "", assignmentId: "" });
  const [extraDeliverables, setExtraDeliverables] = useState<Deliverable[]>([]);
  const [suggesting, setSuggesting] = useState(false);
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
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
          style={{ background: showForm ? "#F3F4F6" : "#0F2744", color: showForm ? "#374151" : "#fff" }}
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? "Cancel" : "Add Deliverable"}
        </button>
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
          <button
            onClick={createDeliverable}
            disabled={!newDeliv.name.trim() || saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            {saving ? "Creating..." : "Create Deliverable"}
          </button>
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
                    <span>{d.assignment.consultant.name}</span>
                  ) : (
                    <span className="text-amber-500">Unassigned</span>
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
                {d.status === "DRAFT" && (
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

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({ project }: { project: Project }) {
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));

  return (
    <div className="max-w-2xl space-y-6">
      {/* Progress bar */}
      <div
        className="rounded-xl p-5"
        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
      >
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>{formatDate(startDate)}</span>
          <span className="font-medium text-gray-700">Today</span>
          <span>{formatDate(endDate)}</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full">
          {(() => {
            const pct = timelineProgress(startDate, endDate);
            return (
              <>
                <div
                  className="absolute h-full rounded-full"
                  style={{ width: `${pct}%`, background: "#0F2744" }}
                />
                <div
                  className="absolute w-3 h-3 rounded-full -mt-0.5 border-2 border-white shadow-sm"
                  style={{ left: `calc(${pct}% - 6px)`, background: "#D4AF37" }}
                />
              </>
            );
          })()}
        </div>
      </div>

      {/* Milestones */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #e5eaf0" }}
      >
        {project.milestones.length === 0 ? (
          <div className="bg-white p-10 text-center">
            <Flag size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No milestones defined yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 bg-white">
            {project.milestones.map((m, i) => {
              const due = new Date(m.dueDate);
              const overdue = due < new Date() && m.status !== "COMPLETED" && m.status !== "SKIPPED";
              const milestonePos = Math.min(
                100,
                Math.max(0, ((due.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100)
              );

              const iconMap: Record<string, typeof CheckCircle2> = {
                COMPLETED: CheckCircle2,
                DELAYED: XCircle,
                SKIPPED: XCircle,
                IN_PROGRESS: Circle,
                PENDING: Circle,
              };
              const Icon = iconMap[m.status] ?? Circle;
              const iconColor =
                m.status === "COMPLETED"
                  ? "#10B981"
                  : m.status === "DELAYED" || overdue
                  ? "#EF4444"
                  : m.status === "IN_PROGRESS"
                  ? "#3B82F6"
                  : "#D1D5DB";

              return (
                <div key={m.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <Icon size={18} style={{ color: iconColor }} />
                    {i < project.milestones.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className={overdue ? "text-red-500 font-medium" : ""}>
                        Due {formatDate(due)}
                      </span>
                      {m.completionDate && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600">
                            Completed {formatDate(new Date(m.completionDate))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: typeof Briefcase;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color }} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function BudgetBar({
  spent,
  total,
  currency,
  pct,
}: {
  spent: number;
  total: number;
  currency: "NGN" | "USD";
  pct: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Budget</span>
        <span className={`font-medium ${pct > 90 ? "text-red-600" : pct > 75 ? "text-amber-600" : "text-gray-700"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: pct > 90 ? "#EF4444" : pct > 75 ? "#F59E0B" : "#10B981",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{formatCompactCurrency(spent, currency)}</span>
        <span>{formatCompactCurrency(total, currency)}</span>
      </div>
    </div>
  );
}
