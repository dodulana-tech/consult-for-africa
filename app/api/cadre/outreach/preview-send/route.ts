/**
 * POST /api/cadre/outreach/preview-send
 *
 * Sends the Wave 1 outreach email to a specified address using the same
 * code path as production sends, but does not touch any cadreOutreachRecord.
 * Lets the founder preview the actual rendered email in their own inbox
 * before the batch cron starts firing at real recipients.
 *
 * The claim URL inside the preview will 404 (because the id is synthetic).
 * That is intentional and expected for a preview.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { handler } from "@/lib/api-handler";
import { sendReactivationEmail } from "@/lib/cadreHealth/outreachEmail";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const to = (body.to as string | undefined)?.trim();
  const firstName = (body.firstName as string | undefined)?.trim() || "Preview";
  const lastName = (body.lastName as string | undefined)?.trim() || "Recipient";

  if (!to || !to.includes("@") || to.length < 5) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const result = await sendReactivationEmail({
    id: "preview",
    firstName,
    lastName,
    email: to,
    cadre: "MEDICINE",
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Send failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sentTo: to });
});
