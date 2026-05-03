import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailMaarovaOnboardReminder } from "@/lib/email";

export const maxDuration = 300;

const REMINDER_COOLDOWN_HOURS = 24;
const MIN_HOURS_SINCE_INVITE = 24; // don't nudge people who just got the invite

/**
 * POST /api/admin/maarova-circle/remind-unredeemed
 *
 * Re-emails Founding Circle outreach targets who:
 *  - have a valid (non-expired) invite token
 *  - have not yet onboarded (maarovaUserId IS NULL)
 *  - were invited at least 24 hours ago
 *  - have not been reminded in the last 24 hours
 *
 * Each leader is nudged at most once per 24h. Reuses the same
 * /maarova/onboard/{token} URL from the original invite, so no new
 * tokens are issued.
 */
export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const inviteCutoff = new Date(now.getTime() - MIN_HOURS_SINCE_INVITE * 60 * 60 * 1000);
  const reminderCutoff = new Date(now.getTime() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);

  const targets = await prisma.outreachTarget.findMany({
    where: {
      campaign: { name: { contains: "Founding Circle" } },
      maarovaUserId: null,
      inviteToken: { not: null },
      tokenExpiresAt: { gt: now },
      email: { not: null },
      invitedAt: { lt: inviteCutoff, not: null },
      OR: [{ lastReminderSentAt: null }, { lastReminderSentAt: { lt: reminderCutoff } }],
    },
    include: { campaign: { select: { name: true } } },
  });

  const results: Array<{ id: string; email: string; ok: boolean; error?: string }> = [];

  for (const t of targets) {
    try {
      await emailMaarovaOnboardReminder({
        email: t.email!,
        name: t.name,
        inviteToken: t.inviteToken!,
        campaignName: t.campaign.name,
      });
      await prisma.outreachTarget.update({
        where: { id: t.id },
        data: { lastReminderSentAt: now },
      });
      results.push({ id: t.id, email: t.email!, ok: true });
    } catch (err) {
      results.push({
        id: t.id,
        email: t.email!,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    total: results.length,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    cooldownHours: REMINDER_COOLDOWN_HOURS,
    results,
  });
});
