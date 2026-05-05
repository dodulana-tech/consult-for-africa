/**
 * POST /api/webhooks/zeptomail
 *
 * Receives delivery notifications from ZeptoMail (bounces, complaints,
 * unsubscribes) and writes them to CommunicationSuppression so the
 * cadre outreach senders skip the recipient on subsequent runs. Also
 * flips any matching CadreOutreachRecord to UNREACHABLE so the dashboard
 * funnel reflects reality.
 *
 * Setup in the ZeptoMail dashboard:
 *   Settings -> Webhooks -> Add new webhook
 *   URL:    https://www.consultforafrica.com/api/webhooks/zeptomail
 *   Events: Bounce, Hard Bounce, Soft Bounce, Spam, Complaint, Unsubscribe
 *   Secret: paste the value of ZEPTOMAIL_WEBHOOK_SECRET (optional but
 *           recommended; we verify it via the X-Webhook-Secret header)
 *
 * The endpoint is intentionally permissive about payload shape -- we
 * extract the recipient email and event type from a few possible field
 * names so a future ZeptoMail schema tweak does not break suppression.
 *
 * Always returns 200 unless the secret check fails. Returning non-200
 * makes ZeptoMail retry forever and pollutes the log; we log internal
 * problems but acknowledge the webhook either way.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

interface SuppressableEvent {
  email: string;
  reason: "BOUNCED" | "COMPLAINT" | "OPTED_OUT";
}

const HARD_SUPPRESS_EVENTS = new Set([
  "bounce",
  "hard_bounce",
  "hardbounce",
  "spam",
  "complaint",
  "unsubscribe",
]);

const SOFT_SUPPRESS_EVENTS = new Set([
  "soft_bounce",
  "softbounce",
]);

function reasonFromEvent(eventName: string): SuppressableEvent["reason"] | null {
  const e = eventName.toLowerCase().replace(/[\s-]/g, "_");
  if (e.includes("bounce") || HARD_SUPPRESS_EVENTS.has(e)) {
    if (e.includes("soft") || SOFT_SUPPRESS_EVENTS.has(e)) return null; // soft bounces not auto-suppressed
    return "BOUNCED";
  }
  if (e.includes("spam") || e.includes("complaint")) return "COMPLAINT";
  if (e.includes("unsubscribe") || e.includes("opt_out") || e.includes("optout")) return "OPTED_OUT";
  return null;
}

function extractEmail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  // Try common field names ZeptoMail / generic webhooks use.
  const candidates = [
    p.email,
    p.email_address,
    p.recipient,
    p.mail_to,
    p.to,
    (p.event as Record<string, unknown> | undefined)?.email_address,
    (p.event as Record<string, unknown> | undefined)?.email,
    (p.data as Record<string, unknown> | undefined)?.email_address,
    (p.data as Record<string, unknown> | undefined)?.email,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.includes("@")) return c.toLowerCase().trim();
  }
  return null;
}

function extractEventName(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const candidates = [
    p.event_name,
    p.event,
    p.type,
    p.bounce_type,
    p.notification_type,
    (p.event as Record<string, unknown> | undefined)?.type,
  ];
  for (const c of candidates) {
    if (typeof c === "string") return c;
  }
  return null;
}

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

  // ZeptoMail sometimes sends an array of events in `event_data` or
  // `notifications`. Normalise to a list of single events.
  const events: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>).event_data)
      ? ((payload as Record<string, unknown>).event_data as unknown[])
      : Array.isArray((payload as Record<string, unknown>).notifications)
        ? ((payload as Record<string, unknown>).notifications as unknown[])
        : [payload];

  const summary = { received: events.length, suppressed: 0, marked: 0, ignored: 0 };

  for (const event of events) {
    const email = extractEmail(event);
    const eventName = extractEventName(event);
    if (!email || !eventName) {
      summary.ignored++;
      continue;
    }

    const reason = reasonFromEvent(eventName);
    if (!reason) {
      // Soft bounce or unrecognised event -- log but do not suppress.
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
