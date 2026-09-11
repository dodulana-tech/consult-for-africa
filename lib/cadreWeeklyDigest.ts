import { prisma } from "@/lib/prisma";
import { greetingFor } from "@/lib/cadreSalutation";
import { nextCatalystEvent, type DfcCatalystEvent } from "@/lib/cadreHealth/dfcCatalystEvents";
import { randomBytes } from "crypto";
import type { CadreDigestAsk } from "@prisma/client";

/**
 * The weekly digest.
 *
 * This is not a newsletter. It is the mechanism by which the database fills.
 * Every issue is a trade: the member gets something only they could get, and
 * gives back one thing that becomes next week's content for somebody else.
 *
 * Fixed positions so it becomes a habit, rotating content so no two issues are
 * the same email:
 *
 *   1. Only you        something true about this person and nobody else
 *   2. The ask         exactly one, with the yield shown so it reads as a countdown
 *   3. The Catalyst    the next DFC session, and nothing at all once it has run
 *   4. The prize       five free Maarova assessments a week, earned not given
 *   5. The showcase    a member who opted in, or a specialty, for status
 *
 * Everything expensive is computed once in buildWeekContext and shared across
 * the whole send. buildDigestForProfessional runs no queries at all, which is
 * what makes 829 recipients finish inside a cron window.
 */

// ─── The ask rotation ────────────────────────────────────────────────────────

/**
 * Six weeks, the same ask for everybody each week. Deliberately shared: a
 * common ask makes the countdown real, where a per-person rotation would make
 * "twelve more and we can publish Lagos on its own" meaningless.
 */
export const ASK_CYCLE: CadreDigestAsk[] = [
  "SALARY",
  "FACILITY_REVIEW",
  "MEZO_INTEREST",
  "CONFIRM_SPECIALTY",
  "REFER_COLLEAGUE",
  "SHOWCASE_CONSENT",
];

/** ISO week key, e.g. "2026-W37". Stable across a Friday send. */
export function weekKeyFor(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function isoWeekNumber(weekKey: string): number {
  return Number(weekKey.split("-W")[1] ?? 0);
}

export function askForWeek(weekKey: string): CadreDigestAsk {
  return ASK_CYCLE[isoWeekNumber(weekKey) % ASK_CYCLE.length];
}

/** The next round number worth counting towards. Turns a total into a target. */
function nextMilestone(have: number, step: number): number {
  return Math.max(step, (Math.floor(have / step) + 1) * step);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DigestRecipient {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  cadre: string;
  subSpecialty: string | null;
  state: string | null;
  specialtyConfirmedAt: Date | null;
  showcaseOptIn: boolean;
  referralCode: string | null;
  readinessScoreDomestic: number | null;
}

interface SalaryBand {
  median: number;
  sampleSize: number;
}

export interface DigestShowcase {
  kind: "MEMBER" | "SPECIALTY";
  headline: string;
  detail: string;
  href: string;
  professionalId?: string;
}

export interface DigestAward {
  claimToken: string;
  expiresAt: Date;
  earnedFor: CadreDigestAsk;
}

export interface WeekContext {
  weekKey: string;
  ask: CadreDigestAsk;
  /** How far the shared ask has got, and what it is counting towards. */
  progress: { have: number; target: number; noun: string };
  memberCount: number;
  nationalByCadre: Map<string, SalaryBand>;
  byCadreState: Map<string, SalaryBand>;
  mandatesByCadre: Map<string, Array<{ id: string; title: string; facility: string | null; city: string | null }>>;
  expiringCredentials: Map<string, { type: string; regulatoryBody: string; daysLeft: number }>;
  /** Members who have already answered this week's ask, so we thank rather than nag. */
  alreadyAnswered: Set<string>;
  /** Mezo places that are open and waiting to be claimed. */
  mezoReady: Map<string, { claimUrl: string }>;
  showcase: DigestShowcase | null;
  /** The next DFC Catalyst session, or null when there is none to announce. */
  catalyst: DfcCatalystEvent | null;
  /**
   * Emails that have already answered the Medipark survey, so nobody is asked
   * twice. Only the respondents who opted in on Q16 gave us an email, so a
   * genuinely anonymous response cannot be matched and that person will see the
   * ask again. There is no way around that without breaking the anonymity the
   * survey promised, and the promise is worth more than the duplicate.
   */
  mediparkAnswered: Set<string>;
  awards: Map<string, DigestAward>;
  awardsIssued: number;
}

export interface CadreDigestContent {
  professionalId: string;
  greeting: string;
  email: string;
  cadre: string;
  state: string | null;
  weekKey: string;
  onlyYou: { kind: string; label: string; headline: string; detail: string; ctaLabel: string; href: string; tone: "URGENT" | "NEUTRAL" | "GOOD" };
  ask: { ask: CadreDigestAsk; label: string; headline: string; detail: string; ctaLabel: string; href: string; done: boolean };
  catalyst: { headline: string; detail: string; ctaLabel: string; href: string } | null;
  medipark: { headline: string; detail: string; ctaLabel: string; href: string } | null;
  prize: { won: boolean; headline: string; detail: string; ctaLabel: string; href: string };
  showcase: DigestShowcase | null;
}

// ─── Recipients ──────────────────────────────────────────────────────────────

export async function getDigestRecipients(): Promise<DigestRecipient[]> {
  // Anyone holding an account they have actually used.
  //
  // This used to require emailVerified, which is only ever set by
  // /api/cadre/verify-email, and that link only exists in the self-registration
  // email. Members who claimed an imported record are never sent one, so the
  // flag was unreachable for the cohort that makes up most of the platform:
  // 925 people had set a password and 825 had signed in, but 118 were verified,
  // and the digest went to 90. It was not that people ignored a verification
  // email, it was that we never sent them one.
  //
  // A completed claim or login is the stronger signal anyway. It means mail we
  // sent reached that address and a human acted on it, which an unclicked
  // verification link does not. A password set but never used is excluded: per
  // the note on CadreProfessional.lastLoginAt, those records may have died in
  // the May 2026 env misconfiguration and never became real accounts.
  const suppressed = await prisma.communicationSuppression.findMany({
    where: { OR: [{ channel: "EMAIL" }, { channel: null }] },
    select: { email: true },
  });
  const suppressedEmails = suppressed
    .map((s) => s.email?.toLowerCase())
    .filter((e): e is string => !!e);

  return prisma.cadreProfessional.findMany({
    where: {
      passwordHash: { not: null },
      OR: [{ emailVerified: true }, { lastLoginAt: { not: null } }],
      // Bounces and opt-outs are excluded in the query as well as per-send, so
      // the recipient count the cron reports is the number we actually intend
      // to mail rather than a headline we then quietly whittle down.
      email: { notIn: suppressedEmails, mode: "insensitive" },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      cadre: true,
      subSpecialty: true,
      state: true,
      specialtyConfirmedAt: true,
      showcaseOptIn: true,
      referralCode: true,
      readinessScoreDomestic: true,
    },
  });
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const hit = await prisma.communicationSuppression.findFirst({
    where: {
      email: email.toLowerCase(),
      OR: [{ channel: "EMAIL" }, { channel: null }],
    },
    select: { id: true },
  });
  return !!hit;
}

// ─── The prize: five a week, earned ──────────────────────────────────────────

const AWARDS_PER_WEEK = 5;
const AWARD_VALID_DAYS = 30;

/**
 * Allocate this week's free Maarova assessments to members who contributed in
 * the last seven days. Members who have never won come first, so the same five
 * enthusiasts do not collect it every Friday and everyone else learns the prize
 * is not for them.
 */
export async function allocateWeeklyAwards(
  weekKey: string,
  now: Date,
): Promise<Map<string, DigestAward>> {
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const existing = await prisma.cadreMaarovaAward.findMany({
    where: { weekKey },
    select: { professionalId: true, claimToken: true, expiresAt: true, earnedFor: true },
  });
  const awards = new Map<string, DigestAward>(
    existing.map((a) => [a.professionalId, { claimToken: a.claimToken, expiresAt: a.expiresAt, earnedFor: a.earnedFor }]),
  );
  // The cron is safe to re-run: a week already allocated is returned as it is.
  if (awards.size >= AWARDS_PER_WEEK) return awards;

  const [salary, reviews, specialty, referrals, showcase, mezo] = await Promise.all([
    prisma.cadreSalaryReport.findMany({
      where: { reportedAt: { gte: since } },
      select: { professionalId: true, reportedAt: true },
    }),
    prisma.cadreFacilityReview.findMany({
      where: { createdAt: { gte: since } },
      select: { professionalId: true, createdAt: true },
    }),
    prisma.cadreProfessional.findMany({
      where: { specialtyConfirmedAt: { gte: since } },
      select: { id: true, specialtyConfirmedAt: true },
    }),
    prisma.cadreProfessional.findMany({
      where: { createdAt: { gte: since }, referredById: { not: null } },
      select: { referredById: true, createdAt: true },
    }),
    prisma.cadreProfessional.findMany({
      where: { showcaseOptInAt: { gte: since } },
      select: { id: true, showcaseOptInAt: true },
    }),
    prisma.cadreMezoInterest.findMany({
      where: { createdAt: { gte: since } },
      select: { professionalId: true, createdAt: true },
    }),
  ]);

  const contributions: Array<{ id: string; at: Date; earnedFor: CadreDigestAsk }> = [
    ...salary.map((r) => ({ id: r.professionalId, at: r.reportedAt, earnedFor: "SALARY" as const })),
    ...reviews.map((r) => ({ id: r.professionalId, at: r.createdAt, earnedFor: "FACILITY_REVIEW" as const })),
    ...specialty.map((r) => ({ id: r.id, at: r.specialtyConfirmedAt!, earnedFor: "CONFIRM_SPECIALTY" as const })),
    ...referrals
      .filter((r) => !!r.referredById)
      .map((r) => ({ id: r.referredById as string, at: r.createdAt, earnedFor: "REFER_COLLEAGUE" as const })),
    ...showcase.map((r) => ({ id: r.id, at: r.showcaseOptInAt!, earnedFor: "SHOWCASE_CONSENT" as const })),
    ...mezo.map((r) => ({ id: r.professionalId, at: r.createdAt, earnedFor: "MEZO_INTEREST" as const })),
  ];

  // One entry per member, keeping their earliest contribution of the week: the
  // person who answered on Monday should not lose to the one who answered on
  // Thursday.
  const earliest = new Map<string, { at: Date; earnedFor: CadreDigestAsk }>();
  for (const c of contributions) {
    const held = earliest.get(c.id);
    if (!held || c.at < held.at) earliest.set(c.id, { at: c.at, earnedFor: c.earnedFor });
  }
  for (const id of awards.keys()) earliest.delete(id);
  if (earliest.size === 0) return awards;

  const priorWinners = new Set(
    (
      await prisma.cadreMaarovaAward.findMany({
        where: { professionalId: { in: [...earliest.keys()] } },
        select: { professionalId: true },
      })
    ).map((a) => a.professionalId),
  );

  const ranked = [...earliest.entries()].sort((a, b) => {
    const aNew = priorWinners.has(a[0]) ? 1 : 0;
    const bNew = priorWinners.has(b[0]) ? 1 : 0;
    if (aNew !== bNew) return aNew - bNew;
    return a[1].at.getTime() - b[1].at.getTime();
  });

  const expiresAt = new Date(now.getTime() + AWARD_VALID_DAYS * 24 * 60 * 60 * 1000);
  for (const [professionalId, { earnedFor }] of ranked.slice(0, AWARDS_PER_WEEK - awards.size)) {
    const claimToken = randomBytes(24).toString("base64url");
    try {
      await prisma.cadreMaarovaAward.create({
        data: { professionalId, weekKey, earnedFor, claimToken, expiresAt },
      });
      awards.set(professionalId, { claimToken, expiresAt, earnedFor });
    } catch (err) {
      // Unique on (professionalId, weekKey): a concurrent run got there first.
      console.warn(`[digest] award for ${professionalId} in ${weekKey} not created:`, err);
    }
  }

  return awards;
}

// ─── Week context: everything expensive, computed once ───────────────────────

function median(values: number[]): number {
  const sorted = values.filter((n) => n > 0).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}

export async function buildWeekContext(
  recipients: DigestRecipient[],
  now: Date = new Date(),
): Promise<WeekContext> {
  const weekKey = weekKeyFor(now);
  const ask = askForWeek(weekKey);
  const recipientIds = recipients.map((r) => r.id);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [salaryRows, mandates, credentials, mezoReadyRows, counts] = await Promise.all([
    prisma.cadreSalaryReport.findMany({
      select: { cadre: true, state: true, totalMonthlyTakeHome: true, baseSalary: true },
    }),
    prisma.cadreMandate.findMany({
      where: { status: "OPEN" },
      select: { id: true, title: true, cadre: true, facilityName: true, locationCity: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cadreCredential.findMany({
      where: { professionalId: { in: recipientIds }, expiryDate: { gte: now, lt: in30Days } },
      orderBy: { expiryDate: "asc" },
      select: { professionalId: true, type: true, regulatoryBody: true, expiryDate: true },
    }),
    prisma.cadreMezoInterest.findMany({
      where: { mezoStatus: { in: ["PROVISIONED", "EXISTING"] }, mezoClaimUrl: { not: null } },
      select: { professionalId: true, mezoClaimUrl: true },
    }),
    countAskProgress(ask),
  ]);

  const nationalByCadre = new Map<string, SalaryBand>();
  const byCadreState = new Map<string, SalaryBand>();
  const cadreBuckets = new Map<string, number[]>();
  const cadreStateBuckets = new Map<string, number[]>();
  for (const r of salaryRows) {
    const figure = Number(r.totalMonthlyTakeHome ?? r.baseSalary ?? 0);
    if (!(figure > 0)) continue;
    const c = cadreBuckets.get(r.cadre) ?? [];
    c.push(figure);
    cadreBuckets.set(r.cadre, c);
    if (r.state) {
      const key = `${r.cadre}::${r.state}`;
      const cs = cadreStateBuckets.get(key) ?? [];
      cs.push(figure);
      cadreStateBuckets.set(key, cs);
    }
  }
  for (const [k, v] of cadreBuckets) nationalByCadre.set(k, { median: median(v), sampleSize: v.length });
  // A state band needs enough behind it to be worth quoting as a state band.
  for (const [k, v] of cadreStateBuckets) {
    if (v.length >= 5) byCadreState.set(k, { median: median(v), sampleSize: v.length });
  }

  const mandatesByCadre = new Map<string, Array<{ id: string; title: string; facility: string | null; city: string | null }>>();
  for (const m of mandates) {
    const list = mandatesByCadre.get(m.cadre) ?? [];
    list.push({ id: m.id, title: m.title, facility: m.facilityName, city: m.locationCity });
    mandatesByCadre.set(m.cadre, list);
  }

  const expiringCredentials = new Map<string, { type: string; regulatoryBody: string; daysLeft: number }>();
  for (const c of credentials) {
    if (expiringCredentials.has(c.professionalId) || !c.expiryDate) continue;
    expiringCredentials.set(c.professionalId, {
      type: c.type,
      regulatoryBody: c.regulatoryBody,
      daysLeft: Math.ceil((c.expiryDate.getTime() - now.getTime()) / 86400000),
    });
  }

  const mezoReady = new Map<string, { claimUrl: string }>();
  for (const m of mezoReadyRows) {
    if (m.mezoClaimUrl) mezoReady.set(m.professionalId, { claimUrl: m.mezoClaimUrl });
  }

  const [alreadyAnswered, showcase, awards, mediparkAnswered] = await Promise.all([
    whoHasAnswered(ask, recipientIds),
    pickShowcase(now, nationalByCadre),
    allocateWeeklyAwards(weekKey, now),
    // Who has already answered the Medipark survey, so nobody is asked twice.
    // Only respondents who opted in on Q16 left an email, so a fully anonymous
    // response cannot be matched and that person will see the ask again. That
    // is the cost of the anonymity the survey promised, and it is worth paying.
    prisma.mediparkSurveyResponse
      .findMany({ where: { email: { not: null } }, select: { email: true } })
      .then((rows) => new Set(rows.map((r) => r.email!.toLowerCase()))),
  ]);

  return {
    weekKey,
    ask,
    progress: counts,
    memberCount: recipients.length,
    nationalByCadre,
    byCadreState,
    mandatesByCadre,
    expiringCredentials,
    alreadyAnswered,
    mezoReady,
    showcase,
    catalyst: nextCatalystEvent(now),
    mediparkAnswered,
    awards,
    awardsIssued: awards.size,
  };
}

async function countAskProgress(ask: CadreDigestAsk): Promise<{ have: number; target: number; noun: string }> {
  switch (ask) {
    case "SALARY": {
      const have = await prisma.cadreSalaryReport.count();
      return { have, target: nextMilestone(have, 50), noun: "salary reports" };
    }
    case "FACILITY_REVIEW": {
      const have = await prisma.cadreFacilityReview.count();
      return { have, target: nextMilestone(have, 25), noun: "hospital reviews" };
    }
    case "MEZO_INTEREST": {
      const have = await prisma.cadreMezoInterest.count();
      return { have, target: nextMilestone(have, 25), noun: "consultants surveyed" };
    }
    case "CONFIRM_SPECIALTY": {
      const have = await prisma.cadreProfessional.count({ where: { specialtyConfirmedAt: { not: null } } });
      return { have, target: nextMilestone(have, 100), noun: "specialties confirmed" };
    }
    case "REFER_COLLEAGUE": {
      const have = await prisma.cadreProfessional.count({ where: { referredById: { not: null } } });
      return { have, target: nextMilestone(have, 25), noun: "colleagues brought in" };
    }
    case "SHOWCASE_CONSENT": {
      const have = await prisma.cadreProfessional.count({ where: { showcaseOptIn: true } });
      return { have, target: nextMilestone(have, 25), noun: "members happy to be featured" };
    }
  }
}

async function whoHasAnswered(ask: CadreDigestAsk, ids: string[]): Promise<Set<string>> {
  switch (ask) {
    case "SALARY": {
      const rows = await prisma.cadreSalaryReport.findMany({
        where: { professionalId: { in: ids } },
        select: { professionalId: true },
      });
      return new Set(rows.map((r) => r.professionalId));
    }
    case "FACILITY_REVIEW": {
      const rows = await prisma.cadreFacilityReview.findMany({
        where: { professionalId: { in: ids } },
        select: { professionalId: true },
      });
      return new Set(rows.map((r) => r.professionalId));
    }
    case "MEZO_INTEREST": {
      const rows = await prisma.cadreMezoInterest.findMany({
        where: { professionalId: { in: ids } },
        select: { professionalId: true },
      });
      return new Set(rows.map((r) => r.professionalId));
    }
    case "CONFIRM_SPECIALTY": {
      const rows = await prisma.cadreProfessional.findMany({
        where: { id: { in: ids }, specialtyConfirmedAt: { not: null } },
        select: { id: true },
      });
      return new Set(rows.map((r) => r.id));
    }
    case "REFER_COLLEAGUE": {
      const rows = await prisma.cadreProfessional.findMany({
        where: { referredById: { in: ids } },
        select: { referredById: true },
      });
      return new Set(rows.map((r) => r.referredById as string));
    }
    case "SHOWCASE_CONSENT": {
      const rows = await prisma.cadreProfessional.findMany({
        where: { id: { in: ids }, showcaseOptIn: true },
        select: { id: true },
      });
      return new Set(rows.map((r) => r.id));
    }
  }
}

/**
 * A member who said we could feature them, or failing that a specialty. The
 * member version cannot run until people have opted in, so the specialty
 * spotlight is what carries the slot for the first few weeks, and it still
 * gives people a reason to confirm their specialty.
 */
async function pickShowcase(
  now: Date,
  nationalByCadre: Map<string, SalaryBand>,
): Promise<DigestShowcase | null> {
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const member = await prisma.cadreProfessional.findFirst({
    where: {
      showcaseOptIn: true,
      OR: [{ featuredAt: null }, { featuredAt: { lt: ninetyDaysAgo } }],
      subSpecialty: { not: null },
    },
    orderBy: [{ featuredAt: "asc" }, { lastLoginAt: "desc" }],
    select: {
      id: true, firstName: true, lastName: true, cadre: true,
      subSpecialty: true, state: true, currentFacility: true, yearsOfExperience: true,
    },
  });

  if (member) {
    const where = [member.currentFacility, member.state].filter(Boolean).join(", ");
    return {
      kind: "MEMBER",
      professionalId: member.id,
      headline: greetingFor(member),
      detail: [
        member.subSpecialty,
        where || null,
        member.yearsOfExperience ? `${member.yearsOfExperience} years in practice` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/oncadre/members/${member.id}`,
    };
  }

  // Specialty spotlight. Confirmed specialties only: an unconfirmed value is
  // what a register said about someone, not what they say about themselves.
  const grouped = await prisma.cadreProfessional.groupBy({
    by: ["subSpecialty", "cadre"],
    where: { specialtyConfirmedAt: { not: null }, subSpecialty: { not: null }, passwordHash: { not: null } },
    _count: true,
    orderBy: { _count: { subSpecialty: "desc" } },
    take: 1,
  });
  const top = grouped[0];
  if (!top?.subSpecialty) return null;
  const band = nationalByCadre.get(top.cadre);
  return {
    kind: "SPECIALTY",
    headline: top.subSpecialty,
    detail: [
      `${top._count} members on CadreHealth have confirmed this specialty`,
      band ? `median take-home ${formatNgn(band.median)} a month` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    href: `/oncadre/salary-map`,
  };
}

// ─── Per recipient: no queries, pure assembly ────────────────────────────────

const CRED_LABELS: Record<string, string> = {
  PRACTICING_LICENSE: "practising license",
  FULL_REGISTRATION: "full registration",
  COGS: "COGS",
  SPECIALIST_REGISTRATION: "specialist registration",
  ADDITIONAL_LICENSE: "additional license",
};

const CADRE_LABELS: Record<string, string> = {
  MEDICINE: "Doctors",
  DENTISTRY: "Dentists",
  NURSING: "Nurses",
  MIDWIFERY: "Midwives",
  PHARMACY: "Pharmacists",
  MEDICAL_LABORATORY_SCIENCE: "Medical lab scientists",
  RADIOGRAPHY_IMAGING: "Radiographers",
  REHABILITATION_THERAPY: "Physiotherapists",
  OPTOMETRY: "Optometrists",
  COMMUNITY_HEALTH: "Community health workers",
  ENVIRONMENTAL_HEALTH: "Environmental health officers",
  NUTRITION_DIETETICS: "Nutritionists",
  PSYCHOLOGY_SOCIAL_WORK: "Clinical psychologists and social workers",
  PUBLIC_HEALTH: "Public health professionals",
  HEALTH_ADMINISTRATION: "Health administrators",
  HEALTH_RECORDS: "Health records officers",
  HOSPITAL_MANAGEMENT: "Hospital managers",
  BIOMEDICAL_ENGINEERING: "Biomedical engineers",
};

export function formatNgn(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

/**
 * Slot 1. The single most personal thing we hold on this member, not four
 * things stacked. Ordered by what would make them stop scrolling: a licence
 * about to lapse beats a salary figure, and their own state beats the country.
 */
function buildOnlyYou(p: DigestRecipient, ctx: WeekContext): CadreDigestContent["onlyYou"] {
  const cadreWord = CADRE_LABELS[p.cadre] ?? "Members";

  const mezo = ctx.mezoReady.get(p.id);
  if (mezo) {
    return {
      kind: "MEZO",
      label: "Your Mezo place is open",
      headline: "Your private practice is set up and waiting",
      detail:
        "The room, the front desk and the billing are handled. Open it and take your first booking whenever you are ready.",
      ctaLabel: "Open my practice",
      href: mezo.claimUrl,
      tone: "GOOD",
    };
  }

  const cred = ctx.expiringCredentials.get(p.id);
  if (cred) {
    return {
      kind: "CREDENTIAL",
      label: "Renewal due",
      headline: `Your ${CRED_LABELS[cred.type] ?? cred.type} expires in ${cred.daysLeft} day${cred.daysLeft === 1 ? "" : "s"}`,
      detail: `${cred.regulatoryBody} has it on file until then. Renew before it lapses and your profile stays current for every mandate we run.`,
      ctaLabel: "Renew it",
      href: "/oncadre/profile#credentials",
      tone: "URGENT",
    };
  }

  const stateBand = p.state ? ctx.byCadreState.get(`${p.cadre}::${p.state}`) : undefined;
  const national = ctx.nationalByCadre.get(p.cadre);
  if (stateBand && national) {
    const diff = Math.round(((stateBand.median - national.median) / national.median) * 100);
    const direction = diff >= 0 ? "above" : "below";
    return {
      kind: "SALARY_STATE",
      label: `${p.state} pay`,
      headline: `${formatNgn(stateBand.median)} a month in ${p.state}`,
      detail:
        Math.abs(diff) < 3
          ? `Median take-home for ${cadreWord.toLowerCase()} in ${p.state}, level with the national figure, across ${stateBand.sampleSize} reports.`
          : `Median take-home for ${cadreWord.toLowerCase()} in ${p.state}, ${Math.abs(diff)}% ${direction} the national figure, across ${stateBand.sampleSize} reports.`,
      ctaLabel: "See the full map",
      href: "/oncadre/salary-map",
      tone: "NEUTRAL",
    };
  }

  const mandates = (ctx.mandatesByCadre.get(p.cadre) ?? []).filter(
    (m) => !p.state || !m.city || m.city.toLowerCase().includes((p.state ?? "").toLowerCase()),
  );
  const mandate = mandates[0] ?? ctx.mandatesByCadre.get(p.cadre)?.[0];
  if (mandate) {
    return {
      kind: "MANDATE",
      label: "Open for your cadre",
      headline: mandate.title,
      detail: [mandate.facility, mandate.city].filter(Boolean).join(", ") || "Details inside.",
      ctaLabel: "See the brief",
      href: `/oncadre/mandates/${mandate.id}`,
      tone: "NEUTRAL",
    };
  }

  if (national) {
    return {
      kind: "SALARY_NATIONAL",
      label: "Salary insight",
      headline: `${formatNgn(national.median)} a month`,
      detail: `Median take-home for ${cadreWord.toLowerCase()} nationwide, across ${national.sampleSize} reports. Your state is not on the map yet, which is something you can change below.`,
      ctaLabel: "See the full map",
      href: "/oncadre/salary-map",
      tone: "NEUTRAL",
    };
  }

  return {
    kind: "PROFILE",
    label: "Your profile",
    headline: "Nothing on your cadre yet",
    detail: `You are one of the first ${cadreWord.toLowerCase()} here. What you add this week is what the next one finds.`,
    ctaLabel: "Fill in your profile",
    href: "/oncadre/profile",
    tone: "NEUTRAL",
  };
}

/** Slot 2. One ask, with the yield attached so it reads as a countdown. */
function buildAsk(p: DigestRecipient, ctx: WeekContext): CadreDigestContent["ask"] {
  const done = ctx.alreadyAnswered.has(p.id);
  const { have, target, noun } = ctx.progress;
  const remaining = Math.max(0, target - have);
  const countdown = `${have} ${noun} so far. ${remaining} more and the next milestone opens.`;

  switch (ctx.ask) {
    case "SALARY":
      return {
        ask: ctx.ask,
        label: done ? "You already did this" : "This week's ask",
        headline: done ? "Your number is in the map" : "What do you actually take home?",
        detail: done
          ? `${countdown} Yours is part of it, which is why we can quote a figure at all.`
          : `Anonymous, 60 seconds, and it is the only reason anyone can tell you what a job is worth before they take it. ${countdown}`,
        ctaLabel: done ? "Update my figure" : "Report my salary",
        href: "/oncadre/salary/report",
        done,
      };
    case "FACILITY_REVIEW":
      return {
        ask: ctx.ask,
        label: done ? "You already did this" : "This week's ask",
        headline: done ? "Your review is live" : "Review a hospital you have worked in",
        detail: done
          ? `${countdown} Yours is one of them.`
          : `Pay timeliness, call duty, whether the equipment works. Anonymous, and the next person gets to know before they sign. ${countdown}`,
        ctaLabel: done ? "Review another" : "Write a review",
        href: "/oncadre/hospitals",
        done,
      };
    case "MEZO_INTEREST":
      return {
        ask: ctx.ask,
        label: done ? "You already did this" : "This week's ask",
        headline: done ? "We have your answers on private practice" : "Would you see private patients if the room was handled?",
        detail: done
          ? `${countdown} We are building the network around what people like you said.`
          : `Serviced consulting rooms, front desk, billing, and theatre lists where you want them. Five minutes tells us where to build first. ${countdown}`,
        ctaLabel: done ? "Update my answers" : "Tell us what you would need",
        href: "/oncadre/mezo",
        done,
      };
    case "CONFIRM_SPECIALTY":
      return {
        ask: ctx.ask,
        label: done ? "You already did this" : "This week's ask",
        headline: done ? "Your specialty is confirmed" : `Is ${p.subSpecialty ?? "your specialty"} right?`,
        detail: done
          ? `${countdown} Confirmed specialties are what let us match a mandate to a person instead of to a cadre.`
          : `The register told us your specialty and registers are often wrong. One tap to confirm it or correct it, and every mandate we match you to gets sharper. ${countdown}`,
        ctaLabel: done ? "Change it" : "Confirm my specialty",
        href: "/oncadre/profile#specialty",
        done,
      };
    case "REFER_COLLEAGUE":
      return {
        ask: ctx.ask,
        label: done ? "You already did this" : "This week's ask",
        headline: done ? "Thank you for the introduction" : "Bring one colleague",
        detail: done
          ? `${countdown} The people you brought are here because of you.`
          : `Everything here is worth more with more of your colleagues in it: the salary map, the reviews, the mandates. One person is enough. ${countdown}`,
        ctaLabel: done ? "Invite another" : "Send my invite link",
        href: p.referralCode ? `/oncadre/refer?code=${p.referralCode}` : "/oncadre/refer",
        done,
      };
    case "SHOWCASE_CONSENT":
      return {
        ask: ctx.ask,
        label: done ? "You already did this" : "This week's ask",
        headline: done ? "You are in the running to be featured" : "May we feature you?",
        detail: done
          ? `${countdown} We will let you know the week it runs.`
          : `Every week we put one member in front of the whole network: name, specialty, where you practise. Nothing runs without your say so, and you can withdraw at any time. ${countdown}`,
        ctaLabel: done ? "Manage this" : "Yes, you may",
        href: "/oncadre/settings/showcase",
        done,
      };
  }
}

/**
 * Slot 3. The next DFC Catalyst session. Shown only while it is still ahead of
 * us, because an invitation to a meeting that has already run costs more
 * credibility than it buys attendance.
 */
/**
 * The Medipark survey, shown to everybody except the people who already
 * answered it. Matching is by email, which only the respondents who opted in on
 * Q16 gave us, so one genuinely anonymous respondent will see it again.
 */
function buildMedipark(p: DigestRecipient, ctx: WeekContext): CadreDigestContent["medipark"] {
  if (ctx.mediparkAnswered.has(p.email.toLowerCase())) return null;
  return {
    headline: "What would a premium medical park need to be worth your practice?",
    detail:
      "We are designing a consultant-led campus and the specification is being set by the people who would work in it. Ten minutes, anonymous, and it closes the moment we have enough to build from.",
    ctaLabel: "Take the survey",
    href: "/premium-medipark-survey.html",
  };
}

function buildCatalyst(ctx: WeekContext): CadreDigestContent["catalyst"] {
  const event = ctx.catalyst;
  if (!event) return null;
  return {
    headline: event.topic,
    detail: `${event.speaker}. ${event.speakerBio} ${event.when}, on ${event.venue}. The Catalyst Series is the monthly session Doctors Foundation for Care runs for practising colleagues, and there is no charge to attend.`,
    ctaLabel: "Register for the session",
    href: event.registerUrl,
  };
}

/** Slot 4. Five a week, earned. Scarcity is the point. */
function buildPrize(p: DigestRecipient, ctx: WeekContext): CadreDigestContent["prize"] {
  const award = ctx.awards.get(p.id);
  if (award) {
    const by = award.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    return {
      won: true,
      headline: "You have won a free Maarova leadership assessment",
      detail: `One of five this week, for what you contributed. It is the same instrument we run for hospital boards, and you get the full report. Yours until ${by}.`,
      ctaLabel: "Claim my assessment",
      href: `/oncadre/maarova/${award.claimToken}`,
    };
  }
  return {
    won: false,
    headline: "Five free Maarova assessments go out every Friday",
    detail:
      "They go to members who contributed that week. The full leadership assessment and report, the same one we run for hospital boards. Answering the ask above puts you in Friday's five.",
    ctaLabel: "See what it measures",
    href: "/maarova",
  };
}

export function buildDigestForProfessional(p: DigestRecipient, ctx: WeekContext): CadreDigestContent {
  return {
    professionalId: p.id,
    greeting: greetingFor(p),
    email: p.email,
    cadre: p.cadre,
    state: p.state,
    weekKey: ctx.weekKey,
    onlyYou: buildOnlyYou(p, ctx),
    ask: buildAsk(p, ctx),
    catalyst: buildCatalyst(ctx),
    medipark: buildMedipark(p, ctx),
    prize: buildPrize(p, ctx),
    showcase: ctx.showcase,
  };
}

// ─── Render ──────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function abs(baseUrl: string, href: string): string {
  return href.startsWith("http") ? href : `${baseUrl}${href}`;
}

interface Palette { bg: string; border: string; kicker: string; body: string; button: string; buttonText: string }

const TONES: Record<string, Palette> = {
  URGENT: { bg: "#FEF2F2", border: "#FECACA", kicker: "#991B1B", body: "#7F1D1D", button: "#991B1B", buttonText: "#ffffff" },
  GOOD: { bg: "#F0FDF4", border: "#BBF7D0", kicker: "#065F46", body: "#047857", button: "#047857", buttonText: "#ffffff" },
  NEUTRAL: { bg: "#F8FAFC", border: "#E2E8F0", kicker: "#0B3C5D", body: "#334155", button: "#0B3C5D", buttonText: "#ffffff" },
  ASK: { bg: "#FFFBEB", border: "#FDE68A", kicker: "#92400E", body: "#78350F", button: "#B45309", buttonText: "#ffffff" },
  CATALYST: { bg: "#F5F3FF", border: "#DDD6FE", kicker: "#4C1D95", body: "#5B21B6", button: "#5B21B6", buttonText: "#ffffff" },
  PRIZE: { bg: "#0B3C5D", border: "#0B3C5D", kicker: "#D4AF37", body: "rgba(255,255,255,0.82)", button: "#D4AF37", buttonText: "#0B3C5D" },
};

function block(
  tone: Palette,
  kicker: string,
  headline: string,
  detail: string,
  ctaLabel: string,
  href: string,
  headlineSize = 18,
): string {
  return `
    <div style="background:${tone.bg};border:1px solid ${tone.border};border-radius:12px;padding:20px;margin-bottom:14px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${tone.kicker};">${esc(kicker)}</p>
      <p style="margin:0 0 8px;font-size:${headlineSize}px;font-weight:700;line-height:1.3;color:${tone.kicker};">${esc(headline)}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:${tone.body};">${esc(detail)}</p>
      <a href="${esc(href)}" style="display:inline-block;margin-top:14px;background:${tone.button};color:${tone.buttonText};text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:700;">${esc(ctaLabel)}</a>
    </div>`;
}

/**
 * The footer offers unsubscribe and nothing else on purpose. It used to carry a
 * "Manage emails" link to /oncadre/settings/notifications, which has never
 * existed: 832 people were being sent to a 404 at the exact moment they were
 * looking for a way out, and the next click after that is the spam button. Put
 * the link back when the preferences page is there to receive it.
 */
export function renderDigestHtml(
  d: CadreDigestContent,
  baseUrl: string,
): { subject: string; html: string; text: string } {
  // The subject is the one personal thing, never the shared number. Sending 66
  // people the same headline was the whole problem.
  const subject = d.prize.won
    ? "You have won a free Maarova assessment"
    : `${d.onlyYou.headline} (CadreHealth weekly)`;

  const blocks: string[] = [
    block(TONES[d.onlyYou.tone], d.onlyYou.label, d.onlyYou.headline, d.onlyYou.detail, d.onlyYou.ctaLabel, abs(baseUrl, d.onlyYou.href), 20),
    block(TONES.ASK, d.ask.label, d.ask.headline, d.ask.detail, d.ask.ctaLabel, abs(baseUrl, d.ask.href)),
    ...(d.medipark
      ? [block(TONES.NEUTRAL, "Help us design it", d.medipark.headline, d.medipark.detail, d.medipark.ctaLabel, abs(baseUrl, d.medipark.href))]
      : []),
    ...(d.catalyst
      ? [block(TONES.CATALYST, "DFC Catalyst Series", d.catalyst.headline, d.catalyst.detail, d.catalyst.ctaLabel, abs(baseUrl, d.catalyst.href))]
      : []),
    block(TONES.PRIZE, d.prize.won ? "Yours this week" : "Five a week", d.prize.headline, d.prize.detail, d.prize.ctaLabel, abs(baseUrl, d.prize.href)),
  ];

  if (d.showcase) {
    blocks.push(
      block(
        TONES.NEUTRAL,
        d.showcase.kind === "MEMBER" ? "Member of the week" : "Specialty spotlight",
        d.showcase.headline,
        d.showcase.detail,
        d.showcase.kind === "MEMBER" ? "See their profile" : "See the numbers",
        abs(baseUrl, d.showcase.href),
      ),
    );
  }

  const textLines = [
    `${d.onlyYou.label.toUpperCase()}: ${d.onlyYou.headline}. ${d.onlyYou.detail} ${abs(baseUrl, d.onlyYou.href)}`,
    `${d.ask.label.toUpperCase()}: ${d.ask.headline}. ${d.ask.detail} ${abs(baseUrl, d.ask.href)}`,
    ...(d.medipark ? [`HELP US DESIGN IT: ${d.medipark.headline} ${d.medipark.detail} ${abs(baseUrl, d.medipark.href)}`] : []),
    ...(d.catalyst ? [`DFC CATALYST SERIES: ${d.catalyst.headline}. ${d.catalyst.detail} ${abs(baseUrl, d.catalyst.href)}`] : []),
    `${d.prize.headline}. ${d.prize.detail} ${abs(baseUrl, d.prize.href)}`,
    ...(d.showcase ? [`${d.showcase.kind === "MEMBER" ? "MEMBER OF THE WEEK" : "SPECIALTY SPOTLIGHT"}: ${d.showcase.headline}. ${d.showcase.detail} ${abs(baseUrl, d.showcase.href)}`] : []),
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1F2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;border:1px solid #E5EAF0;overflow:hidden;">
        <tr><td style="padding:24px 24px 8px;">
          <p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#D4AF37;">CadreHealth weekly</p>
          <h1 style="margin:6px 0 0;font-size:22px;color:#0B3C5D;">Hi ${esc(d.greeting)},</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#6B7280;">One thing that is only yours, one thing we need from you, and this week's five.</p>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;">
          ${blocks.join("")}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #F3F4F6;font-size:12px;color:#9CA3AF;text-align:center;">
          You're getting this because you claimed your CadreHealth profile.
          You can <a href="${baseUrl}/oncadre/unsubscribe/${d.professionalId}" style="color:#6B7280;">unsubscribe</a> at any time.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${d.greeting},

One thing that is only yours, one thing we need from you, and this week's five.

${textLines.join("\n\n")}

--
Unsubscribe: ${baseUrl}/oncadre/unsubscribe/${d.professionalId}`;

  return { subject, html, text };
}
