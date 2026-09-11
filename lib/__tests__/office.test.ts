import { describe, it, expect } from "vitest";
import {
  nextOccurrenceAfter,
  shouldGenerateNow,
  nextChaseDate,
  isOverdueCommitment,
  describeCadence,
} from "../office";

const spec = (over: Partial<Parameters<typeof nextOccurrenceAfter>[0]> = {}) => ({
  cadence: "WEEKLY" as const,
  dayOfWeek: null,
  dayOfMonth: null,
  monthOfYear: null,
  ...over,
});

const iso = (d: Date | null) => d?.toISOString().slice(0, 10);

describe("nextOccurrenceAfter", () => {
  it("finds the next weekday and never returns the day it was asked about", () => {
    // Friday 11 September 2026. Asking for Friday should give the NEXT Friday,
    // otherwise a cadence regenerates the occurrence it just produced.
    const friday = new Date("2026-09-11T00:00:00Z");
    expect(iso(nextOccurrenceAfter(spec({ cadence: "WEEKLY", dayOfWeek: 5 }), friday))).toBe("2026-09-18");
    expect(iso(nextOccurrenceAfter(spec({ cadence: "WEEKLY", dayOfWeek: 1 }), friday))).toBe("2026-09-14");
  });

  it("rolls a monthly cadence into next month once the day has passed", () => {
    expect(iso(nextOccurrenceAfter(spec({ cadence: "MONTHLY", dayOfMonth: 25 }), new Date("2026-09-11T00:00:00Z")))).toBe("2026-09-25");
    expect(iso(nextOccurrenceAfter(spec({ cadence: "MONTHLY", dayOfMonth: 5 }), new Date("2026-09-11T00:00:00Z")))).toBe("2026-10-05");
  });

  it("never skips February, because the day of month is capped at 28", () => {
    const d = nextOccurrenceAfter(spec({ cadence: "MONTHLY", dayOfMonth: 31 }), new Date("2026-01-30T00:00:00Z"));
    expect(iso(d)).toBe("2026-02-28");
  });

  it("steps a quarterly cadence three months at a time from its anchor month", () => {
    const s = spec({ cadence: "QUARTERLY", dayOfMonth: 10, monthOfYear: 1 });
    expect(iso(nextOccurrenceAfter(s, new Date("2026-09-11T00:00:00Z")))).toBe("2026-10-10");
    expect(iso(nextOccurrenceAfter(s, new Date("2026-10-10T00:00:00Z")))).toBe("2027-01-10");
  });

  it("rolls an annual cadence into next year once it has gone", () => {
    const s = spec({ cadence: "ANNUAL", dayOfMonth: 1, monthOfYear: 4 });
    expect(iso(nextOccurrenceAfter(s, new Date("2026-09-11T00:00:00Z")))).toBe("2027-04-01");
    expect(iso(nextOccurrenceAfter(s, new Date("2026-01-11T00:00:00Z")))).toBe("2026-04-01");
  });

  it("keeps a fortnightly cadence on the same weekday two weeks apart", () => {
    const s = spec({ cadence: "FORTNIGHTLY", dayOfWeek: 3 });
    const first = nextOccurrenceAfter(s, new Date("2026-09-11T00:00:00Z"))!;
    const second = nextOccurrenceAfter(s, first)!;
    expect((second.getTime() - first.getTime()) / 86400000).toBe(14);
    expect(first.getUTCDay()).toBe(3);
    expect(second.getUTCDay()).toBe(3);
  });
});

describe("shouldGenerateNow", () => {
  it("raises a task its lead time before the date, not on the date", () => {
    const occurrence = new Date("2026-09-30T00:00:00Z");
    // A board pack due on the 30th with seven days lead should appear on the 23rd.
    expect(shouldGenerateNow(occurrence, 7, new Date("2026-09-22T00:00:00Z"))).toBe(false);
    expect(shouldGenerateNow(occurrence, 7, new Date("2026-09-23T00:00:00Z"))).toBe(true);
  });

  it("with no lead time, raises it on the day", () => {
    const occurrence = new Date("2026-09-30T00:00:00Z");
    expect(shouldGenerateNow(occurrence, 0, new Date("2026-09-29T00:00:00Z"))).toBe(false);
    expect(shouldGenerateNow(occurrence, 0, new Date("2026-09-30T00:00:00Z"))).toBe(true);
  });
});

describe("nextChaseDate", () => {
  const now = new Date("2026-09-11T00:00:00Z");
  const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);

  it("tightens as the due date approaches", () => {
    expect(daysBetween(now, nextChaseDate(new Date("2026-12-11T00:00:00Z"), now))).toBe(7);
    expect(daysBetween(now, nextChaseDate(new Date("2026-09-20T00:00:00Z"), now))).toBe(3);
    expect(daysBetween(now, nextChaseDate(new Date("2026-09-13T00:00:00Z"), now))).toBe(1);
  });

  it("keeps chasing something already late rather than dropping it", () => {
    expect(daysBetween(now, nextChaseDate(new Date("2026-09-01T00:00:00Z"), now))).toBe(2);
  });

  it("falls back to a weekly look when nobody put a date on it", () => {
    expect(daysBetween(now, nextChaseDate(null, now))).toBe(7);
  });
});

describe("isOverdueCommitment", () => {
  const now = new Date("2026-09-11T00:00:00Z");

  it("is overdue only while it is still open", () => {
    expect(isOverdueCommitment({ dueDate: "2026-09-01", status: "OPEN" }, now)).toBe(true);
    expect(isOverdueCommitment({ dueDate: "2026-09-01", status: "CHASED" }, now)).toBe(true);
    expect(isOverdueCommitment({ dueDate: "2026-09-01", status: "HONOURED" }, now)).toBe(false);
    expect(isOverdueCommitment({ dueDate: "2026-09-01", status: "DROPPED" }, now)).toBe(false);
  });

  it("is not overdue without a date, because nobody agreed one", () => {
    expect(isOverdueCommitment({ dueDate: null, status: "OPEN" }, now)).toBe(false);
  });
});

describe("describeCadence", () => {
  it("reads as English", () => {
    expect(describeCadence(spec({ cadence: "WEEKLY", dayOfWeek: 1 }))).toBe("Every Monday");
    expect(describeCadence(spec({ cadence: "FORTNIGHTLY", dayOfWeek: 3 }))).toBe("Every other Wednesday");
    expect(describeCadence(spec({ cadence: "MONTHLY", dayOfMonth: 1 }))).toBe("The 1st of each month");
    expect(describeCadence(spec({ cadence: "MONTHLY", dayOfMonth: 22 }))).toBe("The 22nd of each month");
    expect(describeCadence(spec({ cadence: "ANNUAL", dayOfMonth: 3, monthOfYear: 12 }))).toBe("3rd December, yearly");
  });
});
