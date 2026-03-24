/**
 * Rejection segment classifier.
 * Given AI screening data from a TalentApplication, determines which
 * rejection email template and Academy pathway to offer.
 */

export type RejectionSegment =
  | "JUNIOR"
  | "WRONG_FIT"
  | "WEAK_COMMS"
  | "NOT_READY"
  | "INTEGRITY_FLAGS";

export interface RejectionSegmentInfo {
  segment: RejectionSegment;
  label: string;
  description: string;
  academyOffer: string;
  reapplyEligible: boolean;
}

const SEGMENT_INFO: Record<RejectionSegment, Omit<RejectionSegmentInfo, "segment">> = {
  JUNIOR: {
    label: "Junior (< 2 years experience)",
    description:
      "Early-career applicant. Will be offered the Intern/SIWES pathway and free Foundation Academy access.",
    academyOffer: "Free Foundation tracks + Intern/SIWES pathway information",
    reapplyEligible: true,
  },
  WRONG_FIT: {
    label: "Specialty gap",
    description:
      "Experienced professional but lacking alignment with CFA service lines or healthcare consulting specifically.",
    academyOffer: "Free Foundation tracks + paid Specialist tracks to bridge the gap",
    reapplyEligible: true,
  },
  WEAK_COMMS: {
    label: "Communication gap",
    description:
      "Needs to strengthen executive-level communication and presentation skills for premium consulting.",
    academyOffer:
      "Free Foundation tracks (includes Professional Standards) + Maarova assessment and coaching",
    reapplyEligible: true,
  },
  NOT_READY: {
    label: "Not yet ready",
    description:
      "Needs broader development across multiple areas before being engagement-ready.",
    academyOffer: "Free Foundation tracks as general upskilling",
    reapplyEligible: true,
  },
  INTEGRITY_FLAGS: {
    label: "Integrity concerns",
    description:
      "Application flagged for potential integrity issues. Standard decline with no specific pathway offer.",
    academyOffer: "General Academy awareness only",
    reapplyEligible: false,
  },
};

export function classifyRejection(app: {
  yearsExperience: number;
  aiScoreBreakdown: Record<string, number> | null;
  aiConcerns: string[];
}): RejectionSegment {
  // Priority: integrity first, then specific gaps, then fallback
  if (
    app.aiConcerns.some((c) =>
      /integrity|fraud|ethics|misrepresent|dishonest|fabricat/i.test(c)
    )
  ) {
    return "INTEGRITY_FLAGS";
  }

  if (app.yearsExperience < 2) {
    return "JUNIOR";
  }

  const bd = app.aiScoreBreakdown;
  if (bd) {
    // Each dimension is scored 0-20. Below 8 is a clear gap.
    if (bd.specialty_fit <= 8 || bd.africa_context <= 8) return "WRONG_FIT";
    if (bd.communication <= 8) return "WEAK_COMMS";
  }

  return "NOT_READY";
}

export function getSegmentInfo(segment: RejectionSegment): RejectionSegmentInfo {
  return { segment, ...SEGMENT_INFO[segment] };
}
