// ─── CadreHealth: 12-Dimension Hospital Review Framework ───
// Comprehensive review system designed for Nigerian healthcare facilities

export interface ReviewSubQuestion {
  id: string;
  text: string;
  helpText?: string;
  type: "SCALE" | "YES_NO" | "CHOICE" | "TEXT";
  options?: string[];
  reverseScored?: boolean;
}

export interface ReviewDimension {
  key: string;
  label: string;
  description: string;
  ratingField: string;
  subQuestions: ReviewSubQuestion[];
  shortFormQuestion: string;
}

export const REVIEW_DIMENSIONS: ReviewDimension[] = [
  // ── 1. Compensation & Financial Reliability ──
  {
    key: "compensation",
    label: "Compensation & Financial Reliability",
    description: "Salary fairness, pay timeliness, allowances, and locum policy",
    ratingField: "compensationRating",
    shortFormQuestion: "comp_1",
    subQuestions: [
      {
        id: "comp_1",
        text: "My salary is fair for my role and workload",
        type: "SCALE",
      },
      {
        id: "comp_2",
        text: "Are you paid on time?",
        type: "YES_NO",
      },
      {
        id: "comp_3",
        text: "If not paid on time, how long are typical delays?",
        helpText: "Select the range that best describes your experience",
        type: "CHOICE",
        options: ["0", "1-2", "3-5", "6+"],
      },
      {
        id: "comp_4",
        text: "Allowances (housing, transport, hazard) are paid as promised",
        type: "SCALE",
      },
      {
        id: "comp_5",
        text: "There is a clear and fair locum/moonlighting policy",
        type: "SCALE",
      },
    ],
  },

  // ── 2. Inter-Cadre Relationships ──
  {
    key: "interCadre",
    label: "Inter-Cadre Relationships",
    description: "Teamwork between doctors, nurses, and other cadres",
    ratingField: "interCadreRating",
    shortFormQuestion: "inter_1",
    subQuestions: [
      {
        id: "inter_1",
        text: "Different cadres (doctors, nurses, pharmacists, etc.) treat each other with respect",
        type: "SCALE",
      },
      {
        id: "inter_2",
        text: "Teamwork across cadres is effective during patient care",
        type: "SCALE",
      },
      {
        id: "inter_3",
        text: "Have you witnessed bullying or belittling between different cadres?",
        type: "YES_NO",
      },
      {
        id: "inter_4",
        text: "Junior staff feel comfortable speaking up about patient safety concerns",
        type: "SCALE",
      },
    ],
  },

  // ── 3. Management & Leadership ──
  {
    key: "management",
    label: "Management & Leadership",
    description: "CMD competence, transparency, admin effectiveness",
    ratingField: "managementRating",
    shortFormQuestion: "mgmt_1",
    subQuestions: [
      {
        id: "mgmt_1",
        text: "Hospital leadership communicates decisions clearly",
        type: "SCALE",
      },
      {
        id: "mgmt_2",
        text: "Management is transparent about the hospital's finances and direction",
        type: "SCALE",
      },
      {
        id: "mgmt_3",
        text: "There is favouritism in how opportunities and duties are assigned",
        type: "SCALE",
        reverseScored: true,
      },
      {
        id: "mgmt_4",
        text: "The administrative staff (HR, finance, records) are effective",
        type: "SCALE",
      },
      {
        id: "mgmt_5",
        text: "Staff concerns and grievances are taken seriously",
        type: "SCALE",
      },
    ],
  },

  // ── 4. Fairness, Inclusion & Discrimination ──
  {
    key: "fairness",
    label: "Fairness, Inclusion & Discrimination",
    description: "Merit-based decisions, ethnic, religious, and gender equity",
    ratingField: "fairnessRating",
    shortFormQuestion: "fair_1",
    subQuestions: [
      {
        id: "fair_1",
        text: "Promotions and opportunities are based on merit, not connections",
        type: "SCALE",
      },
      {
        id: "fair_2",
        text: "Have you witnessed ethnic discrimination at this facility?",
        type: "YES_NO",
      },
      {
        id: "fair_3",
        text: "Have you witnessed religious discrimination at this facility?",
        type: "YES_NO",
      },
      {
        id: "fair_4",
        text: "Have you witnessed gender discrimination at this facility?",
        type: "YES_NO",
      },
      {
        id: "fair_5",
        text: "Staff from all backgrounds have equal access to training and resources",
        type: "SCALE",
      },
    ],
  },

  // ── 5. Safety, Harassment & Dignity ──
  {
    key: "safety",
    label: "Safety, Harassment & Dignity",
    description: "Physical safety, verbal abuse, sexual harassment, retaliation",
    ratingField: "safetyRating",
    shortFormQuestion: "safe_1",
    subQuestions: [
      {
        id: "safe_1",
        text: "I feel physically safe at work (security, lighting, emergency protocols)",
        type: "SCALE",
      },
      {
        id: "safe_2",
        text: "Have you witnessed verbal abuse or intimidation of staff?",
        type: "YES_NO",
      },
      {
        id: "safe_3",
        text: "Have you witnessed sexual harassment at this facility?",
        type: "YES_NO",
      },
      {
        id: "safe_4",
        text: "Staff who raise complaints are protected from retaliation",
        type: "SCALE",
      },
      {
        id: "safe_5",
        text: "Patients and their relatives treat staff with respect",
        type: "SCALE",
      },
    ],
  },

  // ── 6. Workload & Staffing ──
  {
    key: "workload",
    label: "Workload & Staffing",
    description: "Patient load, call frequency, post-call rest, staffing levels",
    ratingField: "workloadRating",
    shortFormQuestion: "work_1",
    subQuestions: [
      {
        id: "work_1",
        text: "The patient-to-staff ratio is manageable",
        type: "SCALE",
      },
      {
        id: "work_2",
        text: "What is the typical duration of a call duty shift?",
        type: "CHOICE",
        options: ["<12hrs", "12-24hrs", "24-36hrs", "36hrs+"],
      },
      {
        id: "work_3",
        text: "Do you get post-call time off?",
        type: "CHOICE",
        options: ["ALWAYS", "SOMETIMES", "NEVER"],
      },
      {
        id: "work_4",
        text: "There are ghost workers or absentee staff affecting workload",
        type: "SCALE",
        reverseScored: true,
      },
      {
        id: "work_5",
        text: "Call duty rosters are distributed fairly",
        type: "SCALE",
      },
    ],
  },

  // ── 7. Facilities & Equipment ──
  {
    key: "equipment",
    label: "Facilities & Equipment",
    description: "Equipment availability, power, water, PPE, call rooms, internet",
    ratingField: "equipmentRating",
    shortFormQuestion: "equip_1",
    subQuestions: [
      {
        id: "equip_1",
        text: "Essential medical equipment is available and functional",
        type: "SCALE",
      },
      {
        id: "equip_2",
        text: "Power supply (grid + backup generator) is reliable",
        type: "SCALE",
      },
      {
        id: "equip_3",
        text: "Running water is consistently available",
        type: "SCALE",
      },
      {
        id: "equip_4",
        text: "PPE (gloves, masks, gowns) is adequately supplied",
        type: "SCALE",
      },
      {
        id: "equip_5",
        text: "On-call rooms are clean and have basic amenities",
        type: "SCALE",
      },
      {
        id: "equip_6",
        text: "Internet access is available for clinical and admin work",
        type: "SCALE",
      },
    ],
  },

  // ── 8. Professional Development ──
  {
    key: "training",
    label: "Professional Development",
    description: "Exam leave, conference sponsorship, mentorship, training programmes",
    ratingField: "trainingRating",
    shortFormQuestion: "train_1",
    subQuestions: [
      {
        id: "train_1",
        text: "This facility supports my professional growth and learning",
        type: "SCALE",
      },
      {
        id: "train_2",
        text: "Exam/study leave is granted when needed",
        type: "SCALE",
      },
      {
        id: "train_3",
        text: "The facility sponsors or supports conference attendance",
        type: "SCALE",
      },
      {
        id: "train_4",
        text: "There is effective mentorship from senior colleagues",
        type: "SCALE",
      },
      {
        id: "train_5",
        text: "A library or learning resources are available",
        type: "SCALE",
      },
    ],
  },

  // ── 9. Work-Life Balance ──
  {
    key: "worklife",
    label: "Work-Life Balance",
    description: "Annual leave, off-duty freedom, roster stability, parental leave",
    ratingField: "worklifeRating",
    shortFormQuestion: "wl_1",
    subQuestions: [
      {
        id: "wl_1",
        text: "I am able to maintain a reasonable work-life balance here",
        type: "SCALE",
      },
      {
        id: "wl_2",
        text: "Annual leave is respected and not frequently cancelled",
        type: "SCALE",
      },
      {
        id: "wl_3",
        text: "When off duty, I am genuinely free from work demands",
        type: "SCALE",
      },
      {
        id: "wl_4",
        text: "Duty rosters are published in advance and rarely changed last minute",
        type: "SCALE",
      },
      {
        id: "wl_5",
        text: "Maternity/paternity leave policies are adequate",
        type: "SCALE",
      },
    ],
  },

  // ── 10. Clinical Governance & Patient Care ──
  {
    key: "clinicalGovernance",
    label: "Clinical Governance & Patient Care",
    description: "Protocols, learning from errors, drug supply, referral pathways",
    ratingField: "clinicalGovernanceRating",
    shortFormQuestion: "clin_1",
    subQuestions: [
      {
        id: "clin_1",
        text: "Clinical protocols and guidelines are in place and followed",
        type: "SCALE",
      },
      {
        id: "clin_2",
        text: "Medical errors and near-misses are reviewed to improve care, not to punish",
        type: "SCALE",
      },
      {
        id: "clin_3",
        text: "Essential drugs and consumables are reliably in stock",
        type: "SCALE",
      },
      {
        id: "clin_4",
        text: "Referral pathways to other facilities work effectively",
        type: "SCALE",
      },
      {
        id: "clin_5",
        text: "Would you bring a family member here for treatment?",
        helpText: "This reflects your confidence in the clinical standards",
        type: "CHOICE",
        options: ["YES", "NO", "DEPENDS"],
      },
    ],
  },

  // ── 11. Institutional Integrity ──
  {
    key: "integrity",
    label: "Institutional Integrity",
    description: "Financial transparency, procurement practices, revenue pressure",
    ratingField: "integrityRating",
    shortFormQuestion: "integ_1",
    subQuestions: [
      {
        id: "integ_1",
        text: "This facility operates with transparency and accountability",
        type: "SCALE",
      },
      {
        id: "integ_2",
        text: "Procurement of equipment and supplies follows proper processes",
        type: "SCALE",
      },
      {
        id: "integ_3",
        text: "Staff are pressured to generate revenue in ways that compromise care",
        type: "SCALE",
        reverseScored: true,
      },
      {
        id: "integ_4",
        text: "There is a culture of informal payments or settlements to get things done",
        type: "SCALE",
        reverseScored: true,
      },
    ],
  },

  // ── 12. Overall & Recommendation ──
  {
    key: "overall",
    label: "Overall & Recommendation",
    description: "Overall rating, colleague recommendation, trend direction",
    ratingField: "overallRating",
    shortFormQuestion: "overall_1",
    subQuestions: [
      {
        id: "overall_1",
        text: "Overall, how would you rate this facility as a place to work?",
        helpText: "Consider everything: compensation, culture, facilities, growth",
        type: "SCALE",
      },
      {
        id: "overall_2",
        text: "Would you recommend this facility to a patient?",
        type: "CHOICE",
        options: ["YES", "NO", "WITH_RESERVATIONS"],
      },
      {
        id: "overall_3",
        text: "How is the situation at this facility trending?",
        helpText: "Compared to when you started or over the past year",
        type: "CHOICE",
        options: ["IMPROVING", "SAME", "DECLINING"],
      },
      {
        id: "overall_4",
        text: "What is the single best thing about working here?",
        type: "TEXT",
      },
      {
        id: "overall_5",
        text: "What is the single worst thing about working here?",
        type: "TEXT",
      },
    ],
  },
];

// ─── Helpers ───

export function getDimensionByKey(key: string): ReviewDimension | undefined {
  return REVIEW_DIMENSIONS.find((d) => d.key === key);
}

export function getDimensionByRatingField(field: string): ReviewDimension | undefined {
  return REVIEW_DIMENSIONS.find((d) => d.ratingField === field);
}

/** All dimension rating field names for the review model */
export const ALL_RATING_FIELDS = REVIEW_DIMENSIONS.map((d) => d.ratingField);

/** Dimensions excluding "overall" (used when showing category breakdown) */
export const CATEGORY_DIMENSIONS = REVIEW_DIMENSIONS.filter((d) => d.key !== "overall");

/** Map sub-question IDs to their binary DB field (for direct-save questions) */
export const BINARY_QUESTION_MAP: Record<string, string> = {
  comp_2: "paidOnTime",
  comp_3: "salaryDelayMonths",
  inter_3: "witnessedInterCadreBullying",
  fair_2: "witnessedEthnicDiscrimination",
  fair_3: "witnessedReligiousDiscrimination",
  fair_4: "witnessedGenderDiscrimination",
  safe_2: "witnessedVerbalAbuse",
  safe_3: "witnessedSexualHarassment",
  work_2: "callDuration",
  work_3: "getPostCallOff",
  clin_5: "wouldBringFamilyHere",
  overall_2: "wouldRecommendToPatient",
  overall_3: "situationTrend",
  overall_4: "bestThing",
  overall_5: "worstThing",
};
