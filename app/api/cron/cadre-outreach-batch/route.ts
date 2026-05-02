/**
 * CadreHealth Outreach Batch Cron
 *
 * Drains the READY queue gradually so we never exhaust the Zoho daily limit
 * or starve other transactional traffic (verification, password reset,
 * comms). Runs every 2 hours on weekdays during Lagos business hours.
 *
 * Self-throttling rules:
 *   - Per-run cap: OUTREACH_PER_RUN_BATCH (default 50)
 *   - Per-day cap: OUTREACH_DAILY_CAP (default 300)
 *   - "Today" is counted in UTC for simplicity; the cron schedule keeps
 *     all runs inside the same UTC day.
 *
 * Channel is always EMAIL until the WhatsApp Business API is provisioned;
 * once it is, switch by setting OUTREACH_CRON_CHANNEL.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { sendOutreachBatch, type OutreachChannel } from "@/lib/cadreHealth/outreachSender";

const DEFAULT_PER_RUN = 50;
const DEFAULT_DAILY_CAP = 300;
const HARD_PER_RUN_CEILING = 200;

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

async function run(req: NextRequest) {
  if (!authorise(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelParam = (
    searchParams.get("channel") ?? process.env.OUTREACH_CRON_CHANNEL ?? "EMAIL"
  ).toUpperCase();
  const channel: OutreachChannel = channelParam === "WHATSAPP" ? "WHATSAPP" : "EMAIL";

  const perRunFromEnv = Number(process.env.OUTREACH_PER_RUN_BATCH ?? DEFAULT_PER_RUN);
  const dailyCapFromEnv = Number(process.env.OUTREACH_DAILY_CAP ?? DEFAULT_DAILY_CAP);
  const perRun = Math.min(
    Math.max(Number(searchParams.get("batch") ?? perRunFromEnv) || DEFAULT_PER_RUN, 1),
    HARD_PER_RUN_CEILING,
  );
  const dailyCap = Math.max(
    Number(searchParams.get("dailyCap") ?? dailyCapFromEnv) || DEFAULT_DAILY_CAP,
    perRun,
  );

  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);

  const sentToday = await prisma.cadreOutreachRecord.count({
    where: {
      emailSentAt: channel === "EMAIL" ? { gte: startOfDayUtc } : undefined,
      whatsAppSentAt: channel === "WHATSAPP" ? { gte: startOfDayUtc } : undefined,
    },
  });

  const remainingToday = Math.max(dailyCap - sentToday, 0);
  if (remainingToday === 0) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "daily cap reached",
      channel,
      sentToday,
      dailyCap,
    });
  }

  const thisRunSize = Math.min(perRun, remainingToday);
  const result = await sendOutreachBatch(thisRunSize, channel);

  return Response.json({
    ok: true,
    channel,
    sentToday: sentToday + result.sent,
    dailyCap,
    perRun: thisRunSize,
    result,
  });
}

export const POST = handler(async function POST(req: NextRequest) {
  return run(req);
});

export const GET = handler(async function GET(req: NextRequest) {
  return run(req);
});
