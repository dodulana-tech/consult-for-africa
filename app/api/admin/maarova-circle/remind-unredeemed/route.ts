import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";
import { runFoundingCircleReminders } from "@/lib/maarova/circleReminders";

export const maxDuration = 300;

/**
 * POST /api/admin/maarova-circle/remind-unredeemed
 *
 * Admin-triggered version of the Founding Circle onboard-reminder run.
 * Same logic and cooldown as the daily cron.
 */
export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runFoundingCircleReminders();
  return NextResponse.json(result);
});
