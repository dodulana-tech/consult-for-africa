/**
 * The Mezo private practice instrument.
 *
 * Defined once, in one shape, because three things read it: the form renders
 * from it, the API validates against it, and the admin view labels answers
 * with it. A question added here appears in all three without further work,
 * and an answer can never be stored under an option that no longer exists.
 *
 * The questions exist to settle things Mezo has not settled: what a session is
 * worth, whether doctors want to rent by the session or hold a retainer, and
 * whether a monthly fee is worth paying at all. So the money questions offer
 * a refusal as a real option rather than a smallest band, since "I would not
 * pay a monthly fee" is the answer most worth knowing.
 */

export type MezoQuestionType = "single" | "multi" | "text" | "textarea";

export interface MezoQuestion {
  id: string;
  prompt: string;
  help?: string;
  type: MezoQuestionType;
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Section heading rendered above this question, when it opens one. */
  section?: string;
}

export const MEZO_SURVEY: MezoQuestion[] = [
  {
    section: "Where you are now",
    id: "seesPrivatePatients",
    prompt: "Do you see private patients at the moment?",
    type: "single",
    required: true,
    options: [
      { value: "none", label: "Not at all" },
      { value: "occasional", label: "Occasionally, informally" },
      { value: "regular", label: "Regularly, at someone else's facility" },
      { value: "own_practice", label: "I run my own practice" },
    ],
  },
  {
    id: "barriers",
    prompt: "What has kept you from doing more of it?",
    help: "Choose as many as apply.",
    type: "multi",
    required: true,
    options: [
      { value: "space", label: "Nowhere suitable to see them" },
      { value: "patients", label: "No steady flow of patients" },
      { value: "time", label: "My current post leaves no room" },
      { value: "contract", label: "My contract restricts private practice" },
      { value: "capital", label: "The cost of setting up" },
      { value: "admin", label: "Billing, records and HMO paperwork" },
      { value: "staff", label: "No reception or nursing support" },
      { value: "not_started", label: "Nothing in particular, I have simply not started" },
    ],
  },

  {
    section: "The room",
    id: "sessionalAppetite",
    prompt:
      "If a fully serviced consulting room opened in your city, how often would you use it?",
    help: "Serviced meaning reception, records, cleaning and a nurse on site.",
    type: "single",
    required: true,
    options: [
      { value: "weekly", label: "Weekly or more often" },
      { value: "monthly", label: "A few times a month" },
      { value: "occasional", label: "Once a month, or for particular cases" },
      { value: "none", label: "I would not use one" },
    ],
  },
  {
    id: "sessionTimes",
    prompt: "Which sessions would you actually take?",
    help: "Choose as many as apply.",
    type: "multi",
    required: false,
    options: [
      { value: "weekday_evening", label: "Weekday evenings" },
      { value: "saturday", label: "Saturdays" },
      { value: "weekday_day", label: "Weekday daytime" },
      { value: "sunday", label: "Sundays" },
      { value: "flexible", label: "Whenever a patient books me" },
    ],
  },
  {
    id: "sessionBudget",
    prompt: "What would a four hour session in that room be worth to you?",
    help: "The room, the equipment, the front desk and the billing, all included.",
    type: "single",
    required: true,
    options: [
      { value: "under_10k", label: "Under N10,000" },
      { value: "10_25k", label: "N10,000 to N25,000" },
      { value: "25_50k", label: "N25,000 to N50,000" },
      { value: "50_100k", label: "N50,000 to N100,000" },
      { value: "over_100k", label: "Over N100,000" },
      { value: "revenue_share_only", label: "I would only do this on a share of revenue" },
    ],
  },
  {
    id: "billingPreference",
    prompt: "Which arrangement would you rather have?",
    type: "single",
    required: true,
    options: [
      { value: "per_session", label: "Pay for each session I use" },
      { value: "retainer", label: "A monthly retainer for guaranteed slots" },
      { value: "revenue_share", label: "A share of what I earn, nothing upfront" },
      { value: "unsure", label: "I would need to see the numbers first" },
    ],
  },

  {
    section: "Your patients",
    id: "consultationFee",
    prompt: "What do you charge, or would you charge, for a private consultation?",
    type: "single",
    required: true,
    options: [
      { value: "under_10k", label: "Under N10,000" },
      { value: "10_20k", label: "N10,000 to N20,000" },
      { value: "20_35k", label: "N20,000 to N35,000" },
      { value: "35_50k", label: "N35,000 to N50,000" },
      { value: "over_50k", label: "Over N50,000" },
    ],
  },
  {
    id: "weeklyPatients",
    prompt: "How many private patients could you realistically see in a week?",
    type: "single",
    required: true,
    options: [
      { value: "1_5", label: "1 to 5" },
      { value: "6_10", label: "6 to 10" },
      { value: "11_20", label: "11 to 20" },
      { value: "over_20", label: "More than 20" },
    ],
  },
  {
    id: "hmo",
    prompt: "Where do HMO patients sit in your practice?",
    type: "single",
    required: true,
    options: [
      { value: "no_hmo", label: "I do not see HMO patients" },
      { value: "yes_fine", label: "I do, and payment timing is not a problem" },
      { value: "yes_slow", label: "I do, and slow settlement is a real problem" },
      { value: "would_if_paid", label: "I would take more if settlement were reliable" },
    ],
  },
  // Membership and take rate are asked separately on purpose. An earlier draft
  // offered "I would rather pay a commission" as one of the monthly fee bands,
  // which forced a choice between two things that are independent: a standing
  // fee buys access, a take rate prices the transaction, and a real model can
  // charge both, either or neither. Conflated, the answer to each was
  // unreadable.
  {
    id: "membershipBudget",
    prompt:
      "Mezo can list you where patients search, run your schedule and chase your money. What would a standing monthly fee for that be worth, separately from anything you earn?",
    type: "single",
    required: true,
    options: [
      { value: "none", label: "I would not pay a standing monthly fee" },
      { value: "upto_5k", label: "Up to N5,000" },
      { value: "5_15k", label: "N5,000 to N15,000" },
      { value: "15_50k", label: "N15,000 to N50,000" },
      { value: "over_50k", label: "Over N50,000" },
    ],
  },
  {
    id: "takeRate",
    prompt: "And on each consultation you are paid for, what would you accept Mezo taking?",
    type: "single",
    required: true,
    options: [
      { value: "nothing", label: "Nothing, a monthly fee should cover it" },
      { value: "upto_5", label: "Up to 5%" },
      { value: "5_10", label: "5 to 10%" },
      { value: "10_20", label: "10 to 20%" },
      { value: "flat_per_booking", label: "A flat fee per booking rather than a percentage" },
    ],
  },

  {
    section: "Practicalities",
    id: "practiceCity",
    prompt: "Which city or area would you practise in?",
    type: "text",
    required: true,
    placeholder: "For example Ikeja, Lagos",
  },
  {
    id: "teleconsult",
    prompt: "Would you consult remotely as well as in person?",
    type: "single",
    required: true,
    options: [
      { value: "both", label: "Yes, both" },
      { value: "in_person", label: "In person only" },
      { value: "remote_only", label: "Remotely only" },
    ],
  },
  {
    id: "startTimeline",
    prompt: "When could you realistically start?",
    type: "single",
    required: true,
    options: [
      { value: "now", label: "Now" },
      { value: "1_3_months", label: "Within 1 to 3 months" },
      { value: "3_6_months", label: "Within 3 to 6 months" },
      { value: "6_12_months", label: "Within 6 to 12 months" },
      { value: "exploring", label: "I am looking, not planning" },
    ],
  },
  {
    id: "notes",
    prompt: "What would make this an easy yes for you?",
    help: "Optional, and the most useful box on the page.",
    type: "textarea",
    required: false,
    placeholder: "Anything we have not asked about",
  },
];

/** Question ids lifted into their own columns for the admin view. */
export const MEZO_SUMMARY_FIELDS = [
  "seesPrivatePatients",
  "sessionalAppetite",
  "sessionBudget",
  "billingPreference",
  "membershipBudget",
  "takeRate",
  "consultationFee",
  "practiceCity",
  "startTimeline",
] as const;

/** Human label for a stored answer value, for the admin view. */
export function labelFor(questionId: string, value: string): string {
  const q = MEZO_SURVEY.find((x) => x.id === questionId);
  return q?.options?.find((o) => o.value === value)?.label ?? value;
}

export interface MezoValidationResult {
  ok: boolean;
  errors: string[];
  /** Answers keyed by question id, with unknown keys and options stripped. */
  clean: Record<string, string | string[]>;
}

/**
 * Validate a submitted payload against the instrument.
 *
 * Rejects unknown option values rather than storing them, so the admin view
 * can never be handed a value it has no label for, and a tampered form cannot
 * write arbitrary strings into the research data.
 */
export function validateMezoSurvey(input: unknown): MezoValidationResult {
  const errors: string[] = [];
  const clean: Record<string, string | string[]> = {};

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Answers are missing."], clean };
  }
  const body = input as Record<string, unknown>;

  for (const q of MEZO_SURVEY) {
    const raw = body[q.id];

    if (q.type === "multi") {
      const values = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
      const allowed = values.filter((v) => q.options?.some((o) => o.value === v));
      if (q.required && allowed.length === 0) {
        errors.push(`${q.prompt} needs at least one answer.`);
        continue;
      }
      if (allowed.length > 0) clean[q.id] = allowed;
      continue;
    }

    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (q.required) errors.push(`${q.prompt} needs an answer.`);
      continue;
    }

    if (q.type === "single" && !q.options?.some((o) => o.value === value)) {
      errors.push(`${q.prompt} has an answer we do not recognise.`);
      continue;
    }

    // Free text is capped so a paste cannot balloon the row.
    clean[q.id] = q.type === "text" || q.type === "textarea" ? value.slice(0, 2000) : value;
  }

  return { ok: errors.length === 0, errors, clean };
}
