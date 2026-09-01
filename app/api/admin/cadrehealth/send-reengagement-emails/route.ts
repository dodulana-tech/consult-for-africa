/**
 * Re-engagement emails to professionals who received the original Wave 1
 * outreach but never claimed their profile -- a different cohort from
 * /send-recovery-emails:
 *
 *   recovery cohort  = passwordHash set AND lastLoginAt null
 *                      ("you tried to claim, our env was misconfigured,
 *                       your account is actually active, please sign in")
 *
 *   reengagement cohort = passwordHash null AND lastLoginAt null AND
 *                         outreach status was EMAIL_SENT/WHATSAPP_SENT/etc
 *                      ("you got our email but never tried to claim --
 *                       maybe you saw an error, maybe it landed in spam,
 *                       please try again")
 *
 * Bounced and opted-out addresses are skipped via CommunicationSuppression.
 *
 *   GET  -> { reengageCount: N }
 *   POST -> { ok, sent, failed, skippedSuppressed, total, errorSample }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { handler } from "@/lib/api-handler";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { logAudit } from "@/lib/audit";
import { headingFor } from "@/lib/cadreSalutation";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"];
const SEND_DELAY_MS = 250;

const STUCK_OUTREACH_STATUSES = [
  "EMAIL_SENT",
  "WHATSAPP_SENT",
  "WHATSAPP_REPLIED",
  "SMS_SENT",
] as const;

// A send takes ~250ms, so an unbounded cohort of ~9.7k would run for 40 minutes
// and be killed by the function timeout partway through, with no record of how
// far it got. Batch it, and let the caller drain the queue over several runs.
const DEFAULT_LIMIT = 300;
const MAX_LIMIT = 500;

// Anyone contacted inside this window is not due again. This is what makes the
// route idempotent: a successful send stamps lastContactedAt, which drops that
// person out of the cohort, so re-running resumes rather than re-sending.
const COOLDOWN_DAYS = 30;

// The 2026-06-13 loop left ~54 records with 33 to 38 attempts. Never touch them.
const MAX_ATTEMPTS = 5;

function cohortWhere(cooldownDays: number): Prisma.CadreProfessionalWhereInput {
  return {
    passwordHash: null,
    lastLoginAt: null,
    email: { not: "" },
    outreachRecord: {
      is: {
        status: { in: [...STUCK_OUTREACH_STATUSES] },
        contactAttempts: { lt: MAX_ATTEMPTS },
        OR: [
          { lastContactedAt: null },
          { lastContactedAt: { lt: new Date(Date.now() - cooldownDays * 864e5) } },
        ],
      },
    },
  };
}

async function findReEngageCohort(limit: number, cooldownDays = COOLDOWN_DAYS) {
  return prisma.cadreProfessional.findMany({
    where: cohortWhere(cooldownDays),
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      cadre: true,
      outreachRecord: { select: { id: true } },
    },
  });
}

async function isSuppressed(email: string): Promise<boolean> {
  const hit = await prisma.communicationSuppression.findFirst({
    where: {
      email: email.toLowerCase(),
      OR: [{ channel: "EMAIL" }, { channel: null }],
    },
    select: { id: true },
  });
  return !!hit;
}

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [dueNow, everStuck, suppressed, overContacted] = await Promise.all([
    prisma.cadreProfessional.count({ where: cohortWhere(COOLDOWN_DAYS) }),
    prisma.cadreProfessional.count({ where: cohortWhere(0) }),
    prisma.communicationSuppression.count(),
    prisma.cadreOutreachRecord.count({ where: { contactAttempts: { gte: MAX_ATTEMPTS } } }),
  ]);

  return NextResponse.json({
    dueNow,
    everStuck,
    suppressed,
    overContacted,
    batchSize: DEFAULT_LIMIT,
    runsToDrain: Math.ceil(dueNow / DEFAULT_LIMIT),
    cooldownDays: COOLDOWN_DAYS,
  });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const dryRun = searchParams.get("dryRun") === "1";

  const cohort = await findReEngageCohort(limit);

  if (dryRun) {
    const remaining = await prisma.cadreProfessional.count({ where: cohortWhere(COOLDOWN_DAYS) });
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldSend: cohort.length,
      remainingAfterThisBatch: Math.max(remaining - cohort.length, 0),
      sample: cohort.slice(0, 5).map((p) => ({ name: `${p.firstName} ${p.lastName}`, email: p.email })),
    });
  }

  if (cohort.length === 0) {
    return NextResponse.json({
      ok: true, sent: 0, failed: 0, skippedSuppressed: 0, total: 0, errorSample: [],
    });
  }

  let sent = 0;
  let failed = 0;
  let skippedSuppressed = 0;
  const errorSample: { email: string; error: string }[] = [];

  for (const p of cohort) {
    if (await isSuppressed(p.email)) {
      skippedSuppressed++;
      continue;
    }

    const claimUrl = `https://www.consultforafrica.com/oncadre/claim/${p.id}`;
    try {
      await sendCadreEmail({
        to: p.email,
        subject: "We wrote to you in May",
        heading: headingFor(p, "your record is still held"),
        body: `We wrote to you earlier this year inviting you to claim your CadreHealth profile. It has not been claimed, and it is still held in your name.

CadreHealth is where Nigerian specialists are visible to the hospitals, groups and programmes that are recruiting, whether you practise in Nigeria, abroad, or have stepped back from full-time clinical work. Holding a profile costs nothing.

Claiming takes about twenty minutes. The first question is simply where you are in your career today.

If you would rather not hear from us again, the link at the foot of this email removes you in one click, and we will not write to you again.

Dr Debo Odulana
Founding Partner, Consult For Africa`,
        ctaText: "Claim your profile",
        ctaHref: claimUrl,
        footer: "You are receiving this because your name appears on a Nigerian medical register.",
        footerLinkText: "Unsubscribe",
        footerLinkHref: `https://www.consultforafrica.com/oncadre/unsubscribe/${p.id}`,
      });
      sent++;

      // Feed the send back into the outreach pipeline so the automated 7-day
      // reminder cadence (cadre-outreach-followup) resumes from this contact.
      // Treat the re-engagement email as a fresh "just emailed" touch: mark
      // EMAIL_SENT, stamp emailSentAt now, schedule the next contact, and reset
      // contactAttempts to 1 so the reminder is eligible to fire again. Without
      // this the record keeps its stale emailSentAt/attempts and the cron never
      // picks it up, so the resend would be a dead end.
      if (p.outreachRecord) {
        const now = new Date();
        const nextContact = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await prisma.cadreOutreachRecord.update({
          where: { id: p.outreachRecord.id },
          data: {
            status: "EMAIL_SENT",
            emailSentAt: now,
            lastContactedAt: now,
            nextContactAt: nextContact,
            contactAttempts: 1,
          },
        });
        await prisma.cadreWhatsAppMessage.create({
          data: {
            professionalId: p.id,
            direction: "OUTBOUND",
            channel: "EMAIL",
            content: `[Email: cadrehealth_reengage_v2] Sent to ${p.email}`,
            deliveryStatus: "sent",
          },
        });
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (errorSample.length < 5) {
        errorSample.push({ email: p.email, error: msg });
      }
      console.error(`[reengagement-emails] failed to send to ${p.email}:`, err);
    }

    if (sent + failed < cohort.length - skippedSuppressed) {
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "CadreProfessional",
    entityId: "reengage-batch",
    entityName: `Re-engagement to ${cohort.length} emailed-but-never-claimed users`,
    details: { cohortSize: cohort.length, sent, failed, skippedSuppressed, limit },
  });

  const remaining = await prisma.cadreProfessional.count({ where: cohortWhere(COOLDOWN_DAYS) });

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    skippedSuppressed,
    total: cohort.length,
    remaining,
    runsLeft: Math.ceil(remaining / limit),
    errorSample,
  });
});
