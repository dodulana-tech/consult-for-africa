/**
 * POST /api/webhooks/zeptomail
 *
 * Receives delivery notifications from ZeptoMail (bounces and feedback-loop
 * complaints) and writes them to CommunicationSuppression so the cadre
 * outreach senders skip the recipient on subsequent runs. Also flips any
 * matching CadreOutreachRecord to UNREACHABLE so the dashboard funnel
 * reflects reality.
 *
 * Setup in the ZeptoMail dashboard:
 *   Agents -> agent_1 -> Webhooks -> Add webhook
 *   URL:    https://www.consultforafrica.com/api/webhooks/zeptomail
 *   Events: Soft bounces, Hard bounces, Feedback loop
 *           (leave "Delivered" unchecked -- it fires on every send and we do
 *           nothing with it)
 *   Authorization headers:
 *           key   X-Webhook-Secret
 *           value the value of ZEPTOMAIL_WEBHOOK_SECRET
 *
 * The payload shape and its parsing live in lib/zeptomailWebhook.ts.
 * Anything we cannot parse is logged in full so the shape can be corrected.
 *
 * Always returns 200 unless the secret check fails. Returning non-200 makes
 * ZeptoMail retry forever and pollutes the log; we log internal problems but
 * acknowledge the webhook either way.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { parseEvents, reasonFromEvent } from "@/lib/zeptomailWebhook";

export const POST = handler(async function POST(req: NextRequest) {
  // Optional shared-secret check. ZeptoMail can be configured to send a
  // header with each webhook; if so, we verify it. If the secret env is
  // not set, we accept the webhook (dev convenience), but log a warning.
  const expectedSecret = process.env.ZEPTOMAIL_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided =
      req.headers.get("x-webhook-secret") ??
      req.headers.get("x-zeptomail-signature") ??
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== expectedSecret) {
      console.warn("[zeptomail-webhook] Rejected: secret mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn(
      "[zeptomail-webhook] No ZEPTOMAIL_WEBHOOK_SECRET set; accepting unauthenticated webhook",
    );
  }

  const payload = await req.json().catch(() => null);
  if (!payload) {
    console.error("[zeptomail-webhook] Empty or invalid JSON body");
    return NextResponse.json({ ok: true, ignored: "invalid body" });
  }

  const events = parseEvents(payload);
  if (!events.length) {
    // Log the raw body: this is how we find out ZeptoMail changed the shape.
    console.warn(
      "[zeptomail-webhook] No events parsed from payload",
      JSON.stringify(payload).slice(0, 2000),
    );
    return NextResponse.json({ ok: true, received: 0, suppressed: 0, marked: 0, ignored: 0 });
  }

  const summary = { received: events.length, suppressed: 0, marked: 0, ignored: 0 };

  for (const { email, eventName } of events) {
    const reason = reasonFromEvent(eventName);
    if (!reason) {
      // Soft bounce, delivery receipt or unrecognised event -- not suppressed.
      summary.ignored++;
      continue;
    }

    // Upsert into the suppression table.
    await prisma.communicationSuppression.upsert({
      where: { email_channel: { email, channel: "EMAIL" } },
      update: { reason, notes: `ZeptoMail webhook: ${eventName}` },
      create: {
        email,
        channel: "EMAIL",
        reason,
        notes: `ZeptoMail webhook: ${eventName}`,
      },
    });
    summary.suppressed++;

    // Flip any matching cadre outreach record to UNREACHABLE.
    const pro = await prisma.cadreProfessional.findUnique({
      where: { email },
      select: { outreachRecord: { select: { id: true, status: true } } },
    });
    if (pro?.outreachRecord && pro.outreachRecord.status !== "UNREACHABLE") {
      await prisma.cadreOutreachRecord.update({
        where: { id: pro.outreachRecord.id },
        data: { status: "UNREACHABLE", notes: `Suppressed: ${reason} (${eventName})` },
      });
      summary.marked++;
    }
  }

  console.log("[zeptomail-webhook] processed", JSON.stringify(summary));
  return NextResponse.json({ ok: true, ...summary });
});

// Some webhook providers send a verification GET on registration. Reply 200
// so ZeptoMail accepts the URL.
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST events to this endpoint" });
}
