import type { RecurrenceCadence } from "@prisma/client";
import { TASK_ASSIGNER_ROLES, TASK_ROLES } from "@/lib/constants";

/**
 * The Office of the Founding Partner.
 *
 * The task board handles work handed to the office. This handles the work of
 * running the place: promises other people made, decisions sitting on one desk,
 * and the cadence that repeats whoever is in the seat.
 */

/** Who can work the commitment register, the decision queue and the brief. */
export function canUseOfficeDesk(role: string | undefined | null): boolean {
  return TASK_ROLES.includes(role as typeof TASK_ROLES[number]);
}

/**
 * Who can define the firm's operating rhythm. Narrower than the desk: the
 * Administrative Assistant runs the cadence, she does not set it.
 */
export function canManageRhythm(role: string | undefined | null): boolean {
  return TASK_ASSIGNER_ROLES.includes(role as typeof TASK_ASSIGNER_ROLES[number]);
}

// ─── Commitments ─────────────────────────────────────────────────────────────

export const OPEN_COMMITMENT_STATUSES = ["OPEN", "CHASED"] as const;

/**
 * When to look at this again after a chase. Deliberately tightens as the due
 * date approaches rather than using a fixed interval: chasing a thing due in
 * three months weekly is noise, and chasing a thing due on Friday monthly is
 * useless.
 */
export function nextChaseDate(dueDate: Date | null, from: Date = new Date()): Date {
  const day = 24 * 60 * 60 * 1000;
  if (!dueDate) return new Date(from.getTime() + 7 * day);
  const daysOut = Math.ceil((dueDate.getTime() - from.getTime()) / day);
  if (daysOut <= 0) return new Date(from.getTime() + 2 * day); // already late
  if (daysOut <= 3) return new Date(from.getTime() + 1 * day);
  if (daysOut <= 14) return new Date(from.getTime() + 3 * day);
  return new Date(from.getTime() + 7 * day);
}

/** Past its date and nobody has closed it. */
export function isOverdueCommitment(
  c: { dueDate: Date | string | null; status: string },
  now: Date = new Date(),
): boolean {
  if (!c.dueDate) return false;
  if (!["OPEN", "CHASED"].includes(c.status)) return false;
  return new Date(c.dueDate) < now;
}

// ─── The operating rhythm ────────────────────────────────────────────────────

export interface RecurrenceSpec {
  cadence: RecurrenceCadence;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
}

function atUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * The next date this cadence falls due, strictly after `after`.
 *
 * Day of month is capped at 28 by the schema so that every month actually has
 * one: a monthly board pack set for the 31st would silently skip February.
 */
export function nextOccurrenceAfter(spec: RecurrenceSpec, after: Date): Date | null {
  const start = atUtcMidnight(after);
  const dayOfMonth = Math.min(Math.max(spec.dayOfMonth ?? 1, 1), 28);

  switch (spec.cadence) {
    case "WEEKLY":
    case "FORTNIGHTLY": {
      const target = Math.min(Math.max(spec.dayOfWeek ?? 1, 1), 7);
      const step = spec.cadence === "WEEKLY" ? 7 : 14;
      const d = new Date(start);
      // Walk forward to the next matching weekday, never landing on `after`.
      do {
        d.setUTCDate(d.getUTCDate() + 1);
      } while ((d.getUTCDay() || 7) !== target);
      // Fortnightly counts whole weeks from the same weekday, so once we have
      // the next matching weekday the step only matters for the run after it.
      if (step === 14) {
        const weeksSinceEpoch = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
        if (weeksSinceEpoch % 2 !== 0) d.setUTCDate(d.getUTCDate() + 7);
      }
      return d;
    }
    case "MONTHLY": {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), dayOfMonth));
      if (d <= start) d.setUTCMonth(d.getUTCMonth() + 1);
      return d;
    }
    case "QUARTERLY": {
      // The cycle starts in monthOfYear and repeats every three months.
      const anchor = Math.min(Math.max(spec.monthOfYear ?? 1, 1), 12) - 1;
      for (let i = 0; i < 8; i++) {
        const month = anchor + i * 3;
        const d = new Date(Date.UTC(start.getUTCFullYear(), month, dayOfMonth));
        if (d > start) return d;
      }
      return new Date(Date.UTC(start.getUTCFullYear() + 1, anchor, dayOfMonth));
    }
    case "ANNUAL": {
      const month = Math.min(Math.max(spec.monthOfYear ?? 1, 1), 12) - 1;
      const d = new Date(Date.UTC(start.getUTCFullYear(), month, dayOfMonth));
      if (d <= start) d.setUTCFullYear(d.getUTCFullYear() + 1);
      return d;
    }
    default:
      return null;
  }
}

/**
 * Whether an occurrence should be on somebody's desk yet. A board pack due on
 * the 30th is useless raised on the 30th, so the lead time is what decides.
 */
export function shouldGenerateNow(occurrence: Date, leadTimeDays: number, now: Date = new Date()): boolean {
  const raiseAt = new Date(occurrence.getTime() - leadTimeDays * 24 * 60 * 60 * 1000);
  return raiseAt <= now;
}

export function describeCadence(spec: RecurrenceSpec): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dom = Math.min(Math.max(spec.dayOfMonth ?? 1, 1), 28);
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };
  switch (spec.cadence) {
    case "WEEKLY":
      return `Every ${days[(spec.dayOfWeek ?? 1) - 1]}`;
    case "FORTNIGHTLY":
      return `Every other ${days[(spec.dayOfWeek ?? 1) - 1]}`;
    case "MONTHLY":
      return `The ${ordinal(dom)} of each month`;
    case "QUARTERLY":
      return `The ${ordinal(dom)}, every three months from ${months[(spec.monthOfYear ?? 1) - 1]}`;
    case "ANNUAL":
      return `${ordinal(dom)} ${months[(spec.monthOfYear ?? 1) - 1]}, yearly`;
    default:
      return "";
  }
}
