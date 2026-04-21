"use client";

import { useState } from "react";
import {
  Briefcase,
  Calendar,
  FileCheck,
  Flag,
  Send,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "../StatusBadge";
import ProjectStatusEditor from "../ProjectStatusEditor";
import HealthScoreBar from "../project/HealthScoreBar";
import DeliverablesPipeline from "../project/DeliverablesPipeline";
import PhaseTracker from "../project/PhaseTracker";
import RiskRegister from "../project/RiskRegister";
import ImpactMetrics from "../project/ImpactMetrics";
import ProjectFrameworks from "../project/ProjectFrameworks";
import ProjectRiskAnalysis from "../ProjectRiskAnalysis";
import TeamWorkload from "../project/TeamWorkload";
import FinancialPL from "../project/FinancialPL";
import { MetricCard } from "./SharedComponents";
import { ENGAGEMENT_TYPE_COLORS } from "./constants";
import type { Project } from "./types";
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  timeAgo,
} from "@/lib/utils";

export default function OverviewTab({
  project,
  budgetPct,
  days,
  timelinePct,
  health,
  completedDeliverables,
  completedMilestones,
  updateContent,
  updateType,
  updateClientVisible,
  posting,
  updateError,
  onContentChange,
  onTypeChange,
  onClientVisibleChange,
  onPost,
  isEM,
  isConsultant,
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
  updateClientVisible: boolean;
  posting: boolean;
  updateError: string;
  onContentChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onClientVisibleChange: (v: boolean) => void;
  onPost: () => void;
  isEM: boolean;
  isConsultant: boolean;
  userRole: string;
}) {
  const isDirectorPlus = ["DIRECTOR", "PARTNER", "ADMIN"].includes(userRole);
  const [showChangeEM, setShowChangeEM] = useState(false);
  const [newEMId, setNewEMId] = useState("");
  const [emList, setEmList] = useState<{ id: string; name: string }[]>([]);
  const [changingEM, setChangingEM] = useState(false);

  async function handleChangeEM() {
    if (!newEMId) return;
    setChangingEM(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementManagerId: newEMId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {}
    finally { setChangingEM(false); }
  }

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
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: ENGAGEMENT_TYPE_COLORS[project.engagementType] + "18",
                color: ENGAGEMENT_TYPE_COLORS[project.engagementType],
              }}
            >
              {project.engagementType.replace(/_/g, " ")}
            </span>
            <StatusBadge status={project.riskLevel} />
            <span className="text-xs text-gray-400">{project.serviceType.replace(/_/g, " ")}</span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs text-gray-500">
              {project.client.name} · EM: {project.engagementManager?.name ?? "Unassigned"}
              {isDirectorPlus && (
                <button
                  onClick={() => {
                    setShowChangeEM(!showChangeEM);
                    if (emList.length === 0) {
                      fetch("/api/users?emEligible=true")
                        .then((r) => r.json())
                        .then((data) => setEmList(data.users ?? []))
                        .catch(() => {});
                    }
                  }}
                  className="ml-1.5 text-[10px] text-blue-600 hover:underline"
                >
                  (change)
                </button>
              )}
            </span>
            {showChangeEM && isDirectorPlus && (
              <div className="flex items-center gap-2 mt-1">
                <select value={newEMId} onChange={(e) => setNewEMId(e.target.value)} className="text-xs border rounded px-2 py-1" style={{ borderColor: "#e5eaf0" }}>
                  <option value="">Select new EM...</option>
                  {emList.map((em) => <option key={em.id} value={em.id}>{em.name}</option>)}
                </select>
                <button onClick={handleChangeEM} disabled={!newEMId || changingEM} className="text-[10px] px-2 py-1 rounded text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
                  {changingEM ? "..." : "Assign"}
                </button>
                <button onClick={() => setShowChangeEM(false)} className="text-[10px] text-gray-400">Cancel</button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-3xl">{project.description}</p>

          {/* Latest updates below description */}
          {project.updates.length > 0 && (
            <div className="mt-3 space-y-2 max-w-3xl">
              {project.updates.slice(0, 3).map((u) => (
                <div key={u.id} className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      background:
                        u.type === "ISSUE" ? "#EF4444"
                        : u.type === "CLIENT_FEEDBACK" ? "#3B82F6"
                        : u.type === "MILESTONE_COMPLETED" ? "#10B981"
                        : u.type === "TEAM_CHANGE" ? "#8B5CF6"
                        : "#D4AF37",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background:
                            u.type === "ISSUE" ? "#FEE2E2"
                            : u.type === "CLIENT_FEEDBACK" ? "#DBEAFE"
                            : u.type === "MILESTONE_COMPLETED" ? "#D1FAE5"
                            : u.type === "TEAM_CHANGE" ? "#EDE9FE"
                            : "#F3F4F6",
                          color:
                            u.type === "ISSUE" ? "#991B1B"
                            : u.type === "CLIENT_FEEDBACK" ? "#1E40AF"
                            : u.type === "MILESTONE_COMPLETED" ? "#065F46"
                            : u.type === "TEAM_CHANGE" ? "#5B21B6"
                            : "#6B7280",
                        }}
                      >
                        {u.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">{u.createdBy?.name ?? "C4A"}</span>
                      <span className="text-gray-200 text-[10px]">·</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(new Date(u.createdAt))}</span>
                      {u.clientVisible && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          client visible
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 leading-snug mt-0.5">{u.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline update form */}
          <div className="mt-3 max-w-3xl">
            <textarea
              value={updateContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Post a project update..."
              rows={1}
              className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none mb-2"
              style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
              onFocus={(e) => { e.currentTarget.rows = 3; }}
              onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.rows = 1; }}
            />
            <div className="flex items-center gap-2">
              <select
                value={updateType}
                onChange={(e) => onTypeChange(e.target.value)}
                className="text-xs rounded-lg px-2 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", color: "#374151" }}
              >
                <option value="GENERAL">General</option>
                <option value="MILESTONE_COMPLETED">Milestone</option>
                <option value="WORK_STREAM_UPDATE">Work Stream</option>
                <option value="ISSUE">Issue</option>
                <option value="CLIENT_FEEDBACK">Client Feedback</option>
                <option value="TEAM_CHANGE">Team Change</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateClientVisible}
                  onChange={(e) => onClientVisibleChange(e.target.checked)}
                  className="rounded border-gray-300 text-[#0F2744] focus:ring-[#0F2744]"
                />
                Visible to client
              </label>
              <button
                onClick={onPost}
                disabled={!updateContent.trim() || posting}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 shrink-0"
                style={{ background: "#0F2744", color: "#fff" }}
              >
                {posting ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                Post
              </button>
            </div>
            {updateError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                {updateError}
              </p>
            )}
          </div>
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
      <div className={`grid grid-cols-2 ${isConsultant ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
        {!isConsultant && (
          <MetricCard
            label="Budget Used"
            value={`${budgetPct}%`}
            sub={`${formatCompactCurrency(project.actualSpent, project.budgetCurrency)} of ${formatCompactCurrency(project.budgetAmount, project.budgetCurrency)}`}
            color={budgetPct > 90 ? "#EF4444" : budgetPct > 75 ? "#F59E0B" : "#10B981"}
            icon={Briefcase}
          />
        )}
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
        {/* Left column (2/3 width) */}
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

        {/* Right column (1/3 width) */}
        <div className="space-y-5">
          {/* Team Workload - hidden from consultants (shows rates) */}
          {!isConsultant && (
            <TeamWorkload assignments={project.assignments} />
          )}

          {/* Financial P&L - hidden from consultants */}
          {!isConsultant && (
            <FinancialPL
              projectId={project.id}
              budgetAmount={project.budgetAmount}
              actualSpent={project.actualSpent}
              budgetCurrency={project.budgetCurrency}
              canManage={canManageFinancials}
            />
          )}

          {/* Activity feed */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>

            {project.updates.length === 0 ? (
              <p className="text-xs text-gray-400">No updates yet. Post one above.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {project.updates.map((u) => (
                  <div key={u.id} className="flex items-start gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{
                        background:
                          u.type === "ISSUE" ? "#EF4444"
                          : u.type === "CLIENT_FEEDBACK" ? "#3B82F6"
                          : u.type === "MILESTONE_COMPLETED" ? "#10B981"
                          : u.type === "TEAM_CHANGE" ? "#8B5CF6"
                          : "#D4AF37",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 leading-snug">{u.content}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            background:
                              u.type === "ISSUE" ? "#FEE2E2"
                              : u.type === "CLIENT_FEEDBACK" ? "#DBEAFE"
                              : u.type === "MILESTONE_COMPLETED" ? "#D1FAE5"
                              : u.type === "TEAM_CHANGE" ? "#EDE9FE"
                              : "#F3F4F6",
                            color:
                              u.type === "ISSUE" ? "#991B1B"
                              : u.type === "CLIENT_FEEDBACK" ? "#1E40AF"
                              : u.type === "MILESTONE_COMPLETED" ? "#065F46"
                              : u.type === "TEAM_CHANGE" ? "#5B21B6"
                              : "#6B7280",
                          }}
                        >
                          {u.type.replace(/_/g, " ").toLowerCase()}
                        </span>
                        <span className="text-[10px] text-gray-400">{u.createdBy?.name ?? "C4A"}</span>
                        <span className="text-gray-200 text-[10px]">·</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(new Date(u.createdAt))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal notes - hidden from consultants */}
          {!isConsultant && project.notes && (
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

      {/* Type-specific panels - hidden from consultants (contain fees, deal terms) */}
      {!isConsultant && project.engagementType === "RETAINER" && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0", borderLeft: "4px solid #8B5CF6" }}
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Retainer Details</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Monthly Fee</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.retainerMonthlyFee != null
                  ? formatCurrency(project.retainerMonthlyFee, project.budgetCurrency)
                  : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Hours Pool</span>
              <div className="mt-0.5">
                <p className="text-sm font-semibold text-gray-900">
                  {project.retainerHoursPool != null ? `${project.retainerHoursPool} hrs/month` : "Not set"}
                </p>
                {project.retainerHoursPool != null && (() => {
                  const consumed = project.assignments.reduce(
                    (sum, a) => sum + a.timeEntries.reduce((s, t) => s + t.hours, 0), 0
                  );
                  const pct = Math.min(100, Math.round((consumed / project.retainerHoursPool) * 100));
                  return (
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                        <span>{consumed.toFixed(1)} consumed</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct > 90 ? "#EF4444" : pct > 75 ? "#F59E0B" : "#8B5CF6",
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Auto-Renew</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.retainerAutoRenew != null ? (project.retainerAutoRenew ? "Yes" : "No") : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Notice Period</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.retainerNoticePeriodDays != null ? `${project.retainerNoticePeriodDays} days` : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isConsultant && project.engagementType === "SECONDMENT" && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0", borderLeft: "4px solid #14B8A6" }}
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Secondment Details</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Monthly Fee</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.secondeeMonthlyFee != null
                  ? formatCurrency(project.secondeeMonthlyFee, project.budgetCurrency)
                  : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Client Line Manager</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.secondeeClientLineManager ?? "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Recall Clause</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.secondeeRecallClauseDays != null ? `${project.secondeeRecallClauseDays} days` : "Not set"}
              </p>
            </div>
          </div>
          <div
            className="mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
            style={{ background: "#14B8A618", color: "#0F766E" }}
          >
            <AlertTriangle size={13} />
            Secondment recall can be initiated by C4A partner.
          </div>
        </div>
      )}

      {!isConsultant && project.engagementType === "FRACTIONAL" && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0", borderLeft: "4px solid #F97316" }}
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Fractional Placement</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Placed Individual</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.fractionalPlacedName ?? "Not set"}
              </p>
              {project.fractionalRoleTitle && (
                <p className="text-[10px] text-gray-400 mt-0.5">{project.fractionalRoleTitle}</p>
              )}
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Commission</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.fractionalCommissionPct != null ? `${project.fractionalCommissionPct}%` : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Monthly Arrangement Fee</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.fractionalArrangementFee != null
                  ? formatCurrency(project.fractionalArrangementFee, project.budgetCurrency)
                  : "Not set"}
              </p>
            </div>
          </div>
          <div
            className="mt-4 flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
            style={{ background: "#F9731618", color: "#C2410C" }}
          >
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            Placed individual is not a C4A employee. Arrangement is broker-only.
          </div>
        </div>
      )}

      {!isConsultant && project.engagementType === "TRANSFORMATION" && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0", borderLeft: "4px solid #22C55E" }}
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Transformation Deal</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Equity</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transformEquityPct != null ? `${project.transformEquityPct}%` : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Deal Structure</span>
              <p className="mt-0.5">
                {project.transformDealStructure ? (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#22C55E18", color: "#22C55E" }}
                  >
                    {project.transformDealStructure}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-gray-900">Not set</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Entry Valuation</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transformEntryValuation != null
                  ? formatCurrency(project.transformEntryValuation, project.budgetCurrency)
                  : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Board Seat</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transformBoardSeat != null ? (project.transformBoardSeat ? "Yes" : "No") : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Exit Timeline</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transformExitMonths != null ? (() => {
                  const startDate = new Date(project.startDate);
                  const exitDate = new Date(startDate);
                  exitDate.setMonth(exitDate.getMonth() + project.transformExitMonths!);
                  const now = new Date();
                  const monthsRemaining = Math.max(0, Math.round((exitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                  return `${monthsRemaining} months remaining`;
                })() : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isConsultant && project.engagementType === "TRANSACTION" && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1px solid #e5eaf0", borderLeft: "4px solid #EAB308" }}
        >
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Transaction Advisory</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Mandate Type</span>
              <p className="mt-0.5">
                {project.transactionMandateType ? (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "#EAB30818", color: "#A16207" }}
                  >
                    {project.transactionMandateType.replace(/_/g, " ")}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-gray-900">Not set</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Target Company</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transactionTargetCompany ?? "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Deal Size Estimate</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transactionDealSize != null
                  ? formatCurrency(project.transactionDealSize, project.budgetCurrency)
                  : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Success Fee</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transactionSuccessFeePct != null ? `${project.transactionSuccessFeePct}%` : "Not set"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Close Date</span>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {project.transactionCloseDate
                  ? formatDate(new Date(project.transactionCloseDate))
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
