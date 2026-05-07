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
import { handler } from "@/lib/api-handler";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { logAudit } from "@/lib/audit";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];
const SEND_DELAY_MS = 250;

const STUCK_OUTREACH_STATUSES = [
  "EMAIL_SENT",
  "WHATSAPP_SENT",
  "WHATSAPP_REPLIED",
  "SMS_SENT",
] as const;

async function findReEngageCohort() {
  return prisma.cadreProfessional.findMany({
    where: {
      passwordHash: null,
      lastLoginAt: null,
      outreachRecord: {
        is: { status: { in: [...STUCK_OUTREACH_STATUSES] } },
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true },
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

  const cohort = await findReEngageCohort();
  return NextResponse.json({ reengageCount: cohort.length });
});

export const POST = handler(async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cohort = await findReEngageCohort();
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
        subject: "Apologies — please try claiming your profile again",
        heading: `Dr ${p.lastName}, please try again`,
        body: `Earlier this week we wrote inviting you to claim your CadreHealth profile. Some of you experienced an error during the activation step. The issue was on our side and is now resolved.

Your record is still held for you. Twenty minutes is all it takes to claim and update your profile. The first question is simply where you are in your career today, in Nigeria, abroad, or stepped back from full-time clinical work. The platform is built for all three.

Apologies for the friction.

Dr Debo Odulana
Founding Partner, Consult For Africa`,
        ctaText: "Claim your profile",
        ctaHref: claimUrl,
        footer: "If you would prefer not to receive further messages, simply ignore this email.",
      });
      sent++;
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
    details: { cohortSize: cohort.length, sent, failed, skippedSuppressed },
  });

  return NextResponse.json({
    ok: true, sent, failed, skippedSuppressed, total: cohort.length, errorSample,
  });
});
