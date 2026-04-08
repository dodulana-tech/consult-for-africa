"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutGrid,
  Users,
  FileCheck,
  Flag,
  Phone,
  Activity,
  BookOpen,
  ClipboardList,
  Layers,
} from "lucide-react";
import TransformOS from "./project/TransformOS";
import PlaybookBuilder from "./project/PlaybookBuilder";
import DebriefFlow from "./project/DebriefFlow";
import BoardPackButton from "./project/BoardPackButton";
import {
  OverviewTab,
  TracksTab,
  TeamTab,
  DeliverablesTab,
  TimelineTab,
  CallsTab,
} from "./project-tabs";
import { getVisibleTabs } from "./project-tabs/constants";
import type { Tab, Project } from "./project-tabs/types";
import {
  budgetUtilization,
  daysRemaining,
  timelineProgress,
} from "@/lib/utils";

export default function ProjectTabs({
  project,
  userId,
  userRole,
}: {
  project: Project;
  userId: string;
  userRole: string;
}) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [delivFilter, setDelivFilter] = useState("all");
  const [updateContent, setUpdateContent] = useState("");
  const [updateType, setUpdateType] = useState("GENERAL");
  const [updateClientVisible, setUpdateClientVisible] = useState(false);
  const [posting, startPosting] = useTransition();
  const [updateError, setUpdateError] = useState("");

  const allTabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    { key: "tracks", label: "Tracks", icon: Layers },
    { key: "team", label: "Team", icon: Users },
    { key: "deliverables", label: "Deliverables", icon: FileCheck },
    { key: "timeline", label: "Timeline", icon: Flag },
    { key: "calls", label: "Calls", icon: Phone },
    { key: "transform", label: "Transform OS", icon: Activity },
    { key: "playbook", label: "Playbook", icon: BookOpen },
    { key: "debrief", label: "Debrief", icon: ClipboardList },
  ];
  const visibleKeys = getVisibleTabs(project.engagementType);
  const tabs = allTabs.filter((t) => visibleKeys.includes(t.key));

  const budgetPct = budgetUtilization(project.actualSpent, project.budgetAmount);
  const days = daysRemaining(new Date(project.endDate));
  const timelinePct = timelineProgress(new Date(project.startDate), new Date(project.endDate));
  const health = project.healthScore ?? 3;

  const completedDeliverables = project.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT").length;
  const pendingReview = project.deliverables.filter((d) => d.status === "SUBMITTED" || d.status === "IN_REVIEW").length;
  const completedMilestones = project.milestones.filter((m) => m.status === "COMPLETED").length;

  const isEM = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(userRole);
  const isConsultant = userRole === "CONSULTANT";

  async function postUpdate() {
    if (!updateContent.trim()) return;
    setUpdateError("");
    startPosting(async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/updates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: updateContent, type: updateType, clientVisible: updateClientVisible }),
        });
        if (!res.ok) { setUpdateError("Failed to post update. Try again."); return; }
        setUpdateContent("");
        setUpdateClientVisible(false);
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
        className="flex items-center gap-0.5 px-3 sm:px-6 shrink-0 overflow-x-auto scrollbar-none"
        style={{ background: "#fff", borderBottom: "1px solid #e5eaf0", WebkitOverflowScrolling: "touch" }}
      >
        <Link
          href="/projects"
          className="flex items-center gap-1.5 mr-2 sm:mr-4 text-xs text-gray-400 hover:text-gray-700 transition-colors py-3 sm:py-4 shrink-0"
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Back</span>
        </Link>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0"
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
            updateClientVisible={updateClientVisible}
            posting={posting}
            updateError={updateError}
            onContentChange={setUpdateContent}
            onTypeChange={setUpdateType}
            onClientVisibleChange={setUpdateClientVisible}
            onPost={postUpdate}
            isEM={isEM}
            isConsultant={isConsultant}
            userRole={userRole}
          />
        )}
        {tab === "tracks" && (
          <TracksTab project={project} isEM={isEM} />
        )}
        {tab === "team" && (
          <TeamTab project={project} isEM={isEM} isConsultant={isConsultant} />
        )}
        {tab === "deliverables" && (
          <DeliverablesTab
            project={project}
            filter={delivFilter}
            onFilterChange={setDelivFilter}
            filteredDeliverables={filteredDeliverables}
            isEM={isEM}
          />
        )}
        {tab === "timeline" && (
          <TimelineTab project={project} isEM={isEM} />
        )}
        {tab === "calls" && (
          <CallsTab project={project} isEM={isEM} />
        )}
        {tab === "transform" && project.engagementType === "TRANSFORMATION" && (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <BoardPackButton engagementId={project.id} />
            </div>
            <TransformOS
              engagementId={project.id}
              hospitalId={project.transformHospitalId ?? ""}
              equityPct={project.transformEquityPct ?? 0}
              dealStructure={project.transformDealStructure ?? "SWEAT"}
              entryValuation={project.transformEntryValuation ?? 0}
              exitMonths={project.transformExitMonths ?? 36}
              boardSeat={project.transformBoardSeat ?? false}
              stepInTrigger={project.transformStepInTrigger ?? null}
              isEM={isEM}
            />
          </div>
        )}
        {tab === "playbook" && (
          <PlaybookBuilder engagementId={project.id} isEM={isEM} />
        )}
        {tab === "debrief" && (
          <DebriefFlow engagementId={project.id} engagementName={project.name} isEM={isEM} />
        )}
      </main>
    </div>
  );
}
