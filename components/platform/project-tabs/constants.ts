import type { EngagementType, Tab } from "./types";

export const ENGAGEMENT_TYPE_COLORS: Record<EngagementType, string> = {
  PROJECT: "#3B82F6",
  RETAINER: "#8B5CF6",
  SECONDMENT: "#14B8A6",
  FRACTIONAL: "#F97316",
  TRANSFORMATION: "#22C55E",
  TRANSACTION: "#EAB308",
};

export const TABS_BY_TYPE: Record<EngagementType, Tab[]> = {
  PROJECT: ["overview", "tracks", "team", "deliverables", "timeline", "playbook", "debrief", "calls"],
  RETAINER: ["overview", "tracks", "team", "playbook", "debrief", "calls"],
  SECONDMENT: ["overview", "team", "debrief", "calls"],
  FRACTIONAL: ["overview", "debrief", "calls"],
  TRANSFORMATION: ["overview", "tracks", "transform", "team", "timeline", "playbook", "debrief", "calls"],
  TRANSACTION: ["overview", "timeline", "debrief", "calls"],
};

export function getVisibleTabs(engagementType: EngagementType): Tab[] {
  return TABS_BY_TYPE[engagementType] ?? TABS_BY_TYPE.PROJECT;
}
