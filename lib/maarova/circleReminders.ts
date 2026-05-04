import { prisma } from "@/lib/prisma";
import { emailMaarovaOnboardReminder } from "@/lib/email";

const REMINDER_COOLDOWN_HOURS = 24;
const MIN_HOURS_SINCE_INVITE = 24;

export interface ReminderRunResult {
  total: number;
  successful: number;
  failed: number;
  cooldownHours: number;
  results: Array<{ id: string; email: string; ok: boolean; error?: string }>;
}

/**
 * Re-email Founding Circle outreach targets who:
 *  - have a valid (non-expired) invite token
 *  - have not yet onboarded (maarovaUserId IS NULL)
 *  - were invited at least 24 hours ago
 *  - have not been reminded in the last 24 hours
 *
 * Idempotent: each leader is reminded at most once per 24h.
 */
export async function runFoundingCircleReminders(): Promise<ReminderRunResult> {
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

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
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
    if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 2000));
  }

  return {
    total: results.length,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    cooldownHours: REMINDER_COOLDOWN_HOURS,
    results,
  };
}
