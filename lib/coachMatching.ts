/**
 * Coach matching algorithm for Maarova coaching recommendations.
 *
 * Scoring breakdown (100 points total):
 *   - Development focus match: 30 pts
 *   - Healthcare experience:   25 pts
 *   - Language match:          20 pts
 *   - Timezone proximity:      15 pts
 *   - Experience level:        10 pts
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface CoachCandidate {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialisms: string[];
  certifications: string[];
  country: string;
  city: string | null;
  yearsExperience: number;
  avatarUrl: string | null;
  languages: string[];
  timezone: string;
  healthcareExperience: boolean;
  developmentFocus: string[];
}

export interface UserMatchContext {
  /** Top development areas / coaching priorities from the user's report */
  coachingPriorities: string[];
  /** The organisation's country (e.g. "Nigeria") */
  orgCountry: string;
  /** The organisation type (e.g. "hospital", "clinic", "pharma") */
  orgType: string;
}

export interface ScoredCoach extends CoachCandidate {
  matchScore: number;
  matchRationale: string;
}

// ── Country-to-timezone mapping ────────────────────────────────────────────

const COUNTRY_TIMEZONES: Record<string, string> = {
  Nigeria: "Africa/Lagos",
  Ghana: "Africa/Accra",
  Kenya: "Africa/Nairobi",
  "South Africa": "Africa/Johannesburg",
  Egypt: "Africa/Cairo",
  Tanzania: "Africa/Dar_es_Salaam",
  Ethiopia: "Africa/Addis_Ababa",
  Rwanda: "Africa/Kigali",
  Uganda: "Africa/Kampala",
  Cameroon: "Africa/Douala",
  Senegal: "Africa/Dakar",
  "Cote d'Ivoire": "Africa/Abidjan",
  "United Kingdom": "Europe/London",
  "United States": "America/New_York",
};

/** Approximate UTC offset (hours) for common IANA timezones. */
const TZ_OFFSETS: Record<string, number> = {
  "Africa/Lagos": 1,
  "Africa/Accra": 0,
  "Africa/Nairobi": 3,
  "Africa/Johannesburg": 2,
  "Africa/Cairo": 2,
  "Africa/Dar_es_Salaam": 3,
  "Africa/Addis_Ababa": 3,
  "Africa/Kigali": 2,
  "Africa/Kampala": 3,
  "Africa/Douala": 1,
  "Africa/Dakar": 0,
  "Africa/Abidjan": 0,
  "Europe/London": 0,
  "Europe/Paris": 1,
  "Europe/Berlin": 1,
  "America/New_York": -5,
  "America/Chicago": -6,
  "America/Los_Angeles": -8,
  "Asia/Dubai": 4,
  "Asia/Kolkata": 5.5,
};

// ── Country-to-language mapping ────────────────────────────────────────────

const COUNTRY_LANGUAGES: Record<string, string[]> = {
  Nigeria: ["English", "Yoruba", "Hausa", "Igbo"],
  Ghana: ["English", "Twi"],
  Kenya: ["English", "Swahili"],
  "South Africa": ["English", "Afrikaans", "Zulu"],
  Egypt: ["Arabic", "English"],
  Tanzania: ["Swahili", "English"],
  Ethiopia: ["Amharic", "English"],
  Rwanda: ["Kinyarwanda", "English", "French"],
  Uganda: ["English", "Swahili"],
  Cameroon: ["French", "English"],
  Senegal: ["French", "Wolof"],
  "Cote d'Ivoire": ["French"],
};

const HEALTHCARE_ORG_TYPES = new Set([
  "hospital",
  "clinic",
  "healthcare",
  "health_system",
  "medical_centre",
  "medical_center",
  "pharma",
  "pharmaceutical",
  "nursing",
  "diagnostics",
]);

// ── Scoring functions ──────────────────────────────────────────────────────

function scoreLanguageMatch(
  coach: CoachCandidate,
  ctx: UserMatchContext
): { score: number; rationale: string } {
  const countryLangs = COUNTRY_LANGUAGES[ctx.orgCountry] ?? ["English"];
  const coachLangs = new Set(coach.languages.map((l) => l.toLowerCase()));

  // Check for non-English language overlap first (stronger signal)
  const sharedNonEnglish = countryLangs.filter(
    (l) => l !== "English" && coachLangs.has(l.toLowerCase())
  );
  if (sharedNonEnglish.length > 0) {
    return {
      score: 20,
      rationale: `Speaks ${sharedNonEnglish.join(", ")} (local language match)`,
    };
  }

  // English baseline
  if (coachLangs.has("english")) {
    return { score: 12, rationale: "Speaks English" };
  }

  return { score: 0, rationale: "No common language identified" };
}

function scoreTimezone(
  coach: CoachCandidate,
  ctx: UserMatchContext
): { score: number; rationale: string } {
  const userTz =
    COUNTRY_TIMEZONES[ctx.orgCountry] ?? "Africa/Lagos";
  const userOffset = TZ_OFFSETS[userTz] ?? 1;
  const coachOffset = TZ_OFFSETS[coach.timezone] ?? 0;

  const diff = Math.abs(userOffset - coachOffset);

  if (diff === 0) return { score: 15, rationale: "Same timezone" };
  if (diff <= 1) return { score: 12, rationale: "Within 1 hour timezone difference" };
  if (diff <= 2) return { score: 9, rationale: "Within 2 hours timezone difference" };
  if (diff <= 3) return { score: 6, rationale: "Within 3 hours timezone difference" };
  if (diff <= 5) return { score: 3, rationale: `${diff} hours timezone difference` };
  return { score: 0, rationale: `${diff} hours timezone difference` };
}

function scoreHealthcareExperience(
  coach: CoachCandidate,
  ctx: UserMatchContext
): { score: number; rationale: string } {
  const isHealthcareOrg = HEALTHCARE_ORG_TYPES.has(
    ctx.orgType.toLowerCase().replace(/\s+/g, "_")
  );

  if (!isHealthcareOrg) {
    // If not a healthcare org, this dimension matters less but still a positive
    if (coach.healthcareExperience) {
      return { score: 10, rationale: "Has healthcare coaching experience" };
    }
    return { score: 10, rationale: "" };
  }

  // Healthcare org: strong preference for healthcare experience
  if (coach.healthcareExperience) {
    return { score: 25, rationale: "Healthcare coaching experience (relevant to your organisation)" };
  }
  return { score: 5, rationale: "No specific healthcare coaching experience" };
}

function scoreDevelopmentFocusMatch(
  coach: CoachCandidate,
  ctx: UserMatchContext
): { score: number; rationale: string } {
  if (!ctx.coachingPriorities.length || !coach.developmentFocus.length) {
    return { score: 10, rationale: "" };
  }

  const coachFocus = new Set(
    coach.developmentFocus.map((f) => f.toLowerCase().replace(/[\s_-]+/g, ""))
  );
  const userPriorities = ctx.coachingPriorities.map((p) =>
    p.toLowerCase().replace(/[\s_-]+/g, "")
  );

  const matched = userPriorities.filter((p) => coachFocus.has(p));
  const matchRatio = matched.length / userPriorities.length;
  const score = Math.round(matchRatio * 30);

  if (matched.length === 0) {
    return { score: 5, rationale: "" };
  }

  // Convert back to readable form
  const readableMatches = ctx.coachingPriorities.filter((p) =>
    coachFocus.has(p.toLowerCase().replace(/[\s_-]+/g, ""))
  );

  return {
    score,
    rationale: `Specialises in ${readableMatches.join(", ")}`,
  };
}

function scoreExperience(
  coach: CoachCandidate
): { score: number; rationale: string } {
  const capped = Math.min(coach.yearsExperience, 20);
  const score = Math.round((capped / 20) * 10);

  if (coach.yearsExperience >= 15) {
    return { score, rationale: `${coach.yearsExperience} years of coaching experience` };
  }
  if (coach.yearsExperience >= 8) {
    return { score, rationale: `${coach.yearsExperience} years of coaching experience` };
  }
  return { score, rationale: "" };
}

// ── Main scoring function ──────────────────────────────────────────────────

export function scoreCoach(
  coach: CoachCandidate,
  ctx: UserMatchContext
): ScoredCoach {
  const language = scoreLanguageMatch(coach, ctx);
  const timezone = scoreTimezone(coach, ctx);
  const healthcare = scoreHealthcareExperience(coach, ctx);
  const devFocus = scoreDevelopmentFocusMatch(coach, ctx);
  const experience = scoreExperience(coach);

  const matchScore =
    language.score +
    timezone.score +
    healthcare.score +
    devFocus.score +
    experience.score;

  // Build rationale from non-empty parts
  const rationaleItems = [
    devFocus.rationale,
    healthcare.rationale,
    language.rationale,
    timezone.rationale,
    experience.rationale,
  ].filter(Boolean);

  const matchRationale =
    rationaleItems.length > 0
      ? rationaleItems.join(". ") + "."
      : "General coaching match.";

  return {
    ...coach,
    matchScore,
    matchRationale,
  };
}

/**
 * Score and rank a list of coaches for a given user context.
 * Returns { recommended: top 3, others: remaining }, all sorted by score descending.
 */
export function rankCoaches(
  coaches: CoachCandidate[],
  ctx: UserMatchContext
): { recommended: ScoredCoach[]; others: ScoredCoach[] } {
  const scored = coaches
    .map((c) => scoreCoach(c, ctx))
    .sort((a, b) => b.matchScore - a.matchScore);

  return {
    recommended: scored.slice(0, 3),
    others: scored.slice(3),
  };
}
