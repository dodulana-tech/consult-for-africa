/**
 * Weekly digest cron for CadreHealth members.
 *
 * Runs Friday mornings. For every verified, claimed member:
 * 1. Builds a per-recipient digest with cadre-relevant signals (salary
 *    insight, hospital review spotlight, open mandates, credential
 *    renewal nudge, advisor prompt). See lib/cadreWeeklyDigest.ts.
 * 2. Skips anyone on the suppression list or with no meaningful
 *    content (first-week users with no actionable data get nothing
 *    rather than empty noise).
 * 3. Sends via the existing comm-send infrastructure (ZeptoMail if
 *    configured, else SMTP fallback) so all the deliverability work
 *    we did already applies.
 * 4. Logs each send as an outbound Communication so it shows on the
 *    recipient's timeline.
 *
 * Throttle: 1s between sends to stay well within ZeptoMail/SMTP
 * caps. With ~100 recipients this completes in under 2 minutes.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import {
  getDigestRecipients,
  isEmailSuppressed,
  buildDigestForProfessional,
  renderDigestHtml,
} from "@/lib/cadreWeeklyDigest";
import { sendOutboundEmail, buildMessageId } from "@/lib/communications-send";
import { computeRetentionExpiry, defaultLawfulBasis } from "@/lib/communications-retention";

const SEND_DELAY_MS = 1000;
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://www.consultforafrica.com";

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

export const POST = handler(async function POST(req: NextRequest) {
  return run(req);
});

export const GET = handler(async function GET(req: NextRequest) {
  return run(req);
});

async function run(req: NextRequest): Promise<Response> {
  if (!authorise(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipients = await getDigestRecipients();
  const startedAt = new Date();

  let sentCount = 0;
  let skippedNoContent = 0;
  let skippedSuppressed = 0;
  let failedCount = 0;
  const failures: string[] = [];

  let i = 0;
  for (const r of recipients) {
    i++;

    if (await isEmailSuppressed(r.email)) {
      skippedSuppressed++;
      continue;
    }

    const digest = await buildDigestForProfessional(r, i);
    if (!digest) {
      skippedNoContent++;
      continue;
    }

    const { subject, html, text } = renderDigestHtml(digest, BASE_URL);

    // Pre-create the Communication so VERP Reply-To has a stable ID
    const placeholder = await prisma.communication.create({
      data: {
        subjectType: "CADRE_PROFESSIONAL",
        cadreProfessionalId: r.id,
        type: "EMAIL",
        direction: "OUTBOUND",
        status: "DRAFT",
        subject,
        body: text,
        bodyHtml: html,
        occurredAt: new Date(),
        fromEmail: process.env.SMTP_FROM ?? null,
        toEmails: [r.email],
        tags: ["weekly-digest"],
        loggedById: await getSystemSenderId(),
        threadId: null,
        lawfulBasis: defaultLawfulBasis("CADRE_PROFESSIONAL"),
        retentionExpiresAt: computeRetentionExpiry("CADRE_PROFESSIONAL"),
      },
    });

    const messageId = buildMessageId(placeholder.id);
    const replyDomain = process.env.REPLY_DOMAIN ?? "consultforafrica.com";
    const replyTo = `reply+${placeholder.id}@${replyDomain}`;

    const result = await sendOutboundEmail({
      to: r.email,
      subject,
      bodyText: text,
      bodyHtml: html,
      messageId,
      replyTo,
    });

    await prisma.communication.update({
      where: { id: placeholder.id },
      data: {
        status: result.ok ? "SENT" : "FAILED",
        sentAt: result.ok ? new Date() : null,
        externalId: result.ok ? result.messageId : null,
        threadId: placeholder.id,
        events: {
          create: {
            type: result.ok ? "SENT" : "FAILED",
            toStatus: result.ok ? "SENT" : "FAILED",
            provider: process.env.ZEPTOMAIL_API_KEY ? "ZEPTOMAIL" : "ZOHO",
            providerEventId: result.messageId ?? null,
            notes: result.error ?? "Weekly digest",
          },
        },
      },
    });

    if (result.ok) {
      sentCount++;
    } else {
      failedCount++;
      failures.push(`${r.email}: ${result.error ?? "unknown"}`);
    }

    if (i < recipients.length) {
      await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
    }
  }

  return Response.json({
    ok: true,
    sentAt: startedAt.toISOString(),
    totalRecipients: recipients.length,
    sent: sentCount,
    skippedNoContent,
    skippedSuppressed,
    failed: failedCount,
    failures: failures.slice(0, 20),
  });
}

let cachedSenderId: string | null = null;
async function getSystemSenderId(): Promise<string> {
  if (cachedSenderId) return cachedSenderId;
  const u = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "PARTNER"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!u) throw new Error("No admin user to attribute digest sends to");
  cachedSenderId = u.id;
  return u.id;
}
