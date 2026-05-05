/**
 * CadreHealth Outreach Follow-Up Cron
 *
 * Runs once per weekday morning. Currently fires the 7-day reminder for
 * records that received the initial outreach but have not claimed.
 *
 * The diaspora and alumni cadences are scaffolded below but gated behind
 * env flags that default to OFF. Their copy is content-blocked until the
 * per-segment products (visiting consultant slots, alumni convening,
 * back-home opportunity feed) actually exist; firing placeholder copy at
 * 4,279 senior medics is worse than firing nothing.
 *
 * Caps:
 *   - 7-day reminder: REMINDER_DAILY_CAP (default 100)
 *   - Diaspora digest: DIASPORA_DIGEST_DAILY_CAP (default 100, gated off)
 *   - Alumni newsletter: ALUMNI_NEWSLETTER_DAILY_CAP (default 100, gated off)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { sendReminderEmail } from "@/lib/cadreHealth/outreachReminderEmail";

const DEFAULT_REMINDER_CAP = 100;
const REMINDER_MIN_DAYS = 7;
const REMINDER_MAX_DAYS = 21;
const SEND_DELAY_MS = 250;

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

interface CadenceResult {
  cadence: string;
  enabled: boolean;
  attempted: number;
  sent: number;
  failed: number;
  errorSample: { id: string; error: string }[];
  skipped?: string;
}

async function runReminderCadence(now: Date): Promise<CadenceResult> {
  const result: CadenceResult = {
    cadence: "7-day-reminder",
    enabled: true,
    attempted: 0,
    sent: 0,
    failed: 0,
    errorSample: [],
  };

  const cap = Math.max(
    Number(process.env.REMINDER_DAILY_CAP ?? DEFAULT_REMINDER_CAP),
    1,
  );

  const minSent = new Date(now.getTime() - REMINDER_MAX_DAYS * 24 * 60 * 60 * 1000);
  const maxSent = new Date(now.getTime() - REMINDER_MIN_DAYS * 24 * 60 * 60 * 1000);

  // Pros that received the initial email 7-21 days ago, are still in
  // EMAIL_SENT, have not claimed, and have not already had a reminder
  // (contactAttempts < 2 -- 1 for the initial send).
  const records = await prisma.cadreOutreachRecord.findMany({
    where: {
      status: "EMAIL_SENT",
      emailSentAt: { gte: minSent, lt: maxSent },
      contactAttempts: { lt: 2 },
      profileClaimedAt: null,
      professional: { email: { not: "" } },
    },
    take: cap,
    orderBy: { emailSentAt: "asc" },
    select: {
      id: true,
      professional: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  for (const record of records) {
    result.attempted++;

    // Skip suppressed recipients and mark them UNREACHABLE so future
    // queries do not bring them back.
    const suppressed = await prisma.communicationSuppression.findFirst({
      where: {
        email: record.professional.email.toLowerCase(),
        OR: [{ channel: "EMAIL" }, { channel: null }],
      },
      select: { id: true },
    });
    if (suppressed) {
      await prisma.cadreOutreachRecord.update({
        where: { id: record.id },
        data: { status: "UNREACHABLE", notes: "Suppressed at reminder time" },
      });
      continue;
    }

    const r = await sendReminderEmail({
      id: record.professional.id,
      firstName: record.professional.firstName,
      lastName: record.professional.lastName,
      email: record.professional.email,
    });

    if (r.ok) {
      result.sent++;
      await prisma.cadreOutreachRecord.update({
        where: { id: record.id },
        data: {
          lastContactedAt: new Date(),
          contactAttempts: { increment: 1 },
        },
      });
    } else {
      result.failed++;
      if (result.errorSample.length < 5 && r.error) {
        result.errorSample.push({ id: record.professional.id, error: r.error });
      }
    }

    await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
  }

  return result;
}

// Diaspora monthly digest -- scaffold only. Targets DIASPORA_NETWORK records
// not contacted in the last 30 days. The content (back-home opportunities,
// visiting consultant slots, advisory invitations) does not yet exist as a
// data feed, so this cadence stays OFF until the per-segment product is built.
async function runDiasporaDigest(): Promise<CadenceResult> {
  const enabled = process.env.OUTREACH_DIASPORA_DIGEST_ENABLED === "true";
  if (!enabled) {
    return {
      cadence: "diaspora-digest",
      enabled: false,
      attempted: 0,
      sent: 0,
      failed: 0,
      errorSample: [],
      skipped: "OUTREACH_DIASPORA_DIGEST_ENABLED is not 'true'",
    };
  }
  return {
    cadence: "diaspora-digest",
    enabled: true,
    attempted: 0,
    sent: 0,
    failed: 0,
    errorSample: [],
    skipped: "Implementation pending: needs back-home opportunity feed",
  };
}

// Alumni quarterly newsletter -- scaffold only. Same rationale as above.
async function runAlumniNewsletter(): Promise<CadenceResult> {
  const enabled = process.env.OUTREACH_ALUMNI_NEWSLETTER_ENABLED === "true";
  if (!enabled) {
    return {
      cadence: "alumni-newsletter",
      enabled: false,
      attempted: 0,
      sent: 0,
      failed: 0,
      errorSample: [],
      skipped: "OUTREACH_ALUMNI_NEWSLETTER_ENABLED is not 'true'",
    };
  }
  return {
    cadence: "alumni-newsletter",
    enabled: true,
    attempted: 0,
    sent: 0,
    failed: 0,
    errorSample: [],
    skipped: "Implementation pending: needs senior fellows convening + mentorship feed",
  };
}

async function run(req: NextRequest) {
  if (!authorise(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Same kill switch the initial-batch cron honours.
  if (process.env.OUTREACH_PAUSED === "true") {
    return Response.json({
      ok: true,
      paused: true,
      reason: "OUTREACH_PAUSED env var is set to true",
    });
  }

  const now = new Date();
  const results = await Promise.all([
    runReminderCadence(now),
    runDiasporaDigest(),
    runAlumniNewsletter(),
  ]);

  return Response.json({ ok: true, runAt: now.toISOString(), cadences: results });
}

export const POST = handler(async function POST(req: NextRequest) {
  return run(req);
});

export const GET = handler(async function GET(req: NextRequest) {
  return run(req);
});
