import type { ConsultantAssessment, ConsultantAssessmentResponse } from "@prisma/client";

export interface IntegrityFlag {
  type: "TAB_SWITCH" | "PASTE_EVENT" | "TIMING_ANOMALY" | "LENGTH_ANOMALY";
  severity: "low" | "medium" | "high";
  detail: string;
}

export interface IntegrityReport {
  overallScore: number;
  flags: IntegrityFlag[];
  tabSwitchRisk: "low" | "medium" | "high";
  pasteRisk: "low" | "medium" | "high";
  timingRisk: "low" | "medium" | "high";
  summary: string;
}

type AssessmentWithResponses = ConsultantAssessment & {
  responses: ConsultantAssessmentResponse[];
};

function classifyTabSwitches(total: number): "low" | "medium" | "high" {
  if (total <= 2) return "low";
  if (total <= 5) return "medium";
  return "high";
}

function classifyPasteEvents(total: number): "low" | "medium" | "high" {
  if (total === 0) return "low";
  if (total <= 2) return "medium";
  return "high";
}

/**
 * Compute a behavioural integrity report from raw assessment signals.
 * This is a deterministic, client-side check (no AI involved).
 */
export function analyseIntegrity(assessment: AssessmentWithResponses): IntegrityReport {
  const flags: IntegrityFlag[] = [];

  const totalTabSwitches = assessment.tabSwitchCount;
  const totalPasteEvents = assessment.pasteEventCount;

  // -- Tab switch flags --
  const tabSwitchRisk = classifyTabSwitches(totalTabSwitches);
  if (tabSwitchRisk === "medium") {
    flags.push({
      type: "TAB_SWITCH",
      severity: "medium",
      detail: `Candidate switched tabs ${totalTabSwitches} times during the assessment.`,
    });
  } else if (tabSwitchRisk === "high") {
    flags.push({
      type: "TAB_SWITCH",
      severity: "high",
      detail: `Candidate switched tabs ${totalTabSwitches} times, which is unusually high.`,
    });
  }

  // -- Paste event flags --
  const pasteRisk = classifyPasteEvents(totalPasteEvents);
  if (pasteRisk === "medium") {
    flags.push({
      type: "PASTE_EVENT",
      severity: "medium",
      detail: `${totalPasteEvents} paste event(s) detected. Could be pasting own notes.`,
    });
  } else if (pasteRisk === "high") {
    flags.push({
      type: "PASTE_EVENT",
      severity: "high",
      detail: `${totalPasteEvents} paste events detected, suggesting external content was brought in.`,
    });
  }

  // -- Per-response timing and length checks --
  let timingRisk: "low" | "medium" | "high" = "low";

  for (const resp of assessment.responses) {
    const words = resp.wordCount ?? 0;
    const seconds = resp.timeSpentSec ?? 0;

    // Timing anomaly: >300 words in <60 seconds is physically impossible
    if (words > 300 && seconds > 0 && seconds < 60) {
      timingRisk = "high";
      flags.push({
        type: "TIMING_ANOMALY",
        severity: "high",
        detail: `Response "${resp.questionId}" has ${words} words written in ${seconds}s. This exceeds realistic typing speed.`,
      });
    } else if (words > 200 && seconds > 0 && seconds < 45) {
      if (timingRisk !== "high") timingRisk = "medium";
      flags.push({
        type: "TIMING_ANOMALY",
        severity: "medium",
        detail: `Response "${resp.questionId}" has ${words} words in ${seconds}s, which is faster than typical typing.`,
      });
    }

    // Length anomaly: quick-fire answers (60 sec limit) should not exceed 150 words
    if (resp.part === "quickfire" && words > 150) {
      flags.push({
        type: "LENGTH_ANOMALY",
        severity: "medium",
        detail: `Quick-fire response "${resp.questionId}" has ${words} words, exceeding the expected limit for a 60-second answer.`,
      });
    }
  }

  // -- Overall score --
  // Start at 100 and deduct based on severity
  let overallScore = 100;
  for (const flag of flags) {
    switch (flag.severity) {
      case "low":
        overallScore -= 5;
        break;
      case "medium":
        overallScore -= 12;
        break;
      case "high":
        overallScore -= 22;
        break;
    }
  }
  overallScore = Math.max(0, Math.min(100, overallScore));

  // -- Summary --
  const parts: string[] = [];
  if (flags.length === 0) {
    parts.push("No integrity concerns detected.");
  } else {
    const highCount = flags.filter((f) => f.severity === "high").length;
    const medCount = flags.filter((f) => f.severity === "medium").length;
    if (highCount > 0) {
      parts.push(`${highCount} high-severity flag(s) detected.`);
    }
    if (medCount > 0) {
      parts.push(`${medCount} medium-severity flag(s).`);
    }
  }

  if (tabSwitchRisk === "high") {
    parts.push("Frequent tab switching suggests external reference use.");
  }
  if (pasteRisk === "high") {
    parts.push("Multiple paste events indicate possible copy-paste from external sources.");
  }
  if (timingRisk === "high") {
    parts.push("At least one response was written faster than humanly possible.");
  }

  return {
    overallScore,
    flags,
    tabSwitchRisk,
    pasteRisk,
    timingRisk,
    summary: parts.join(" "),
  };
}
