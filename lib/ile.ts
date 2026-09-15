import { randomBytes, createHash } from "crypto";

/**
 * ilé shared constants and helpers.
 *
 * ilé is a residential eldercare business. The home is the core. Care in the
 * family's own home is what we can deliver today, and it is also how the home
 * gets filled, so the waiting list carries both kinds of family and keeps them
 * distinguishable.
 */

export const ILE_BRAND = {
  navy: "#0B3C5D",
  deepNavy: "#081521",
  gold: "#D4AF37",
  teal: "#1F7A8C",
  cream: "#FBF6E6",
  light: "#C9D6E0",
  ink: "#1F2937",
  muted: "#6B7280",
} as const;

/** Early joiners are offered founding-family status. This is that cohort size. */
export const FOUNDING_FAMILY_LIMIT = 100;

export const ILE_CONTACT_EMAIL = "hello@consultforafrica.com";

/**
 * The exact wording a family agrees to when they join the list. Stored verbatim
 * on the row so the lawful basis under the Nigeria Data Protection Act 2023 is
 * provable later without archaeology on old page markup.
 */
export const ILE_CONSENT_TEXT =
  "I agree that ilé may hold the details I have given and contact me about care " +
  "for my family, including when places in the home become available. I understand " +
  "I can ask ilé to delete my details at any time.";

// ─── Enum labels ──────────────────────────────────────────────────────────────
// One source of truth, used by the public form, the confirmation email and the
// admin list, so the three never drift apart.

export const RELATIONSHIP_LABELS = {
  PARENT: "My parent",
  GRANDPARENT: "My grandparent",
  SPOUSE: "My husband or wife",
  OTHER_RELATIVE: "Another relative",
  SELF: "Myself",
  PROFESSIONAL: "A patient or client of mine",
} as const;

export const INTEREST_LABELS = {
  RESIDENTIAL: "A place in the home, when it opens",
  HOME_CARE: "Care at home, as soon as possible",
  BOTH: "Both. Care now, a place later",
  UNDECIDED: "Not sure yet, I am finding out",
} as const;

export const CARE_NEED_LABELS = {
  COMPANIONSHIP: "Company and help around the house",
  PERSONAL_CARE: "Washing, dressing, help moving about",
  SKILLED_NURSING: "Nursing care, wounds, medication",
  DEMENTIA_SUPPORT: "Memory loss or dementia",
  POST_HOSPITAL: "Recovering after a hospital stay",
  END_OF_LIFE: "Comfort and care at the end of life",
  NOT_SURE: "I am not sure what is needed",
} as const;

export const URGENCY_LABELS = {
  NOW: "We need help now",
  WITHIN_3_MONTHS: "Within the next three months",
  WITHIN_6_MONTHS: "Within the next six months",
  PLANNING_AHEAD: "Planning ahead, nothing urgent",
} as const;

export const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  ASSESSED: "Assessed",
  PILOT_CLIENT: "Pilot client",
  RESIDENT: "Resident",
  NOT_PROCEEDING: "Not proceeding",
} as const;

/**
 * Urgency ordering for the admin list. A family that needs help now is a
 * different conversation from one planning two years ahead, and the list is
 * worked in this order.
 */
export const URGENCY_RANK: Record<keyof typeof URGENCY_LABELS, number> = {
  NOW: 0,
  WITHIN_3_MONTHS: 1,
  WITHIN_6_MONTHS: 2,
  PLANNING_AHEAD: 3,
};

/**
 * A short, human-readable referral code. Unambiguous alphabet: no O/0, no I/1,
 * because these get read aloud on the phone and typed from a WhatsApp message.
 */
export function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

/**
 * Hash an IP for abuse tracing. We never store the raw address: it is personal
 * data under the NDPA and it buys us nothing that the hash does not.
 */
export function hashIp(ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET ?? "ile";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
