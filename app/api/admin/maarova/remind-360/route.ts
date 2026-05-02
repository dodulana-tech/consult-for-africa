import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailMaarovaInviteRaters } from "@/lib/email";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";
export const maxDuration = 300;

const REMINDER_COOLDOWN_DAYS = 7;

/**
 * POST /api/admin/maarova/remind-360
 *
 * Bulk-emails leaders who:
 *  - have a COMPLETED Maarova session
 *  - do NOT have a completed THREE_SIXTY module response
 *  - have a 360 request in COLLECTING status
 *  - have not been reminded in the last 7 days
 *
 * Drives 360 completion which is the viral mechanism: each rater invite
 * exposes a new healthcare leader to Maarova.
 */
export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  // Find candidate 360 requests
  const requests = await prisma.maarova360Request.findMany({
    where: {
      status: "COLLECTING",
      OR: [{ lastReminderSentAt: null }, { lastReminderSentAt: { lt: cutoff } }],
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          email: true,
          sessions: {
            where: { status: "COMPLETED" },
            orderBy: { completedAt: "desc" },
            take: 1,
            select: {
              id: true,
              moduleResponses: {
                include: { module: { select: { type: true } } },
              },
            },
          },
        },
      },
    },
  });

  const results: Array<{ userId: string; user: string; ok: boolean; skipped?: string; error?: string }> = [];

  for (const r of requests) {
    const user = r.subject;
    const session = user.sessions[0];
    if (!session) {
      results.push({ userId: user.id, user: user.name, ok: false, skipped: "no completed session" });
      continue;
    }

    // Skip if 360 module is already complete
    const has360Done = session.moduleResponses.some(
      (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED",
    );
    if (has360Done) {
      results.push({ userId: user.id, user: user.name, ok: false, skipped: "360 already complete" });
      continue;
    }

    try {
      await emailMaarovaInviteRaters({
        email: user.email,
        name: user.name,
        reportUrl: `${BASE_URL}/maarova/portal/results/${session.id}`,
        inviteUrl: `${BASE_URL}/maarova/portal/three-sixty`,
      });
      await prisma.maarova360Request.update({
        where: { id: r.id },
        data: { lastReminderSentAt: new Date() },
      });
      results.push({ userId: user.id, user: user.name, ok: true });
    } catch (err) {
      results.push({
        userId: user.id,
        user: user.name,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    total: results.length,
    successful: results.filter((r) => r.ok).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.ok && !r.skipped).length,
    cooldownDays: REMINDER_COOLDOWN_DAYS,
    results,
  });
});
