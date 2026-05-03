import { NextRequest, NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";
import { runFoundingCircleReminders } from "@/lib/maarova/circleReminders";

export const maxDuration = 300;

/**
 * GET /api/cron/maarova-circle-reminders
 *
 * Daily cron that re-emails approved Founding Circle leaders who have not
 * yet redeemed their onboard link. Same logic + cooldown as the admin
 * "Remind unredeemed" button.
 *
 * Vercel cron uses GET; we accept GET. Bearer-auth via CRON_SECRET so
 * arbitrary callers cannot trigger it.
 */
export const GET = handler(async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFoundingCircleReminders();
  return NextResponse.json(result);
});
