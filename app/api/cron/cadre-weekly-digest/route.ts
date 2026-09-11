/**
 * Weekly digest cron for CadreHealth members.
 *
 * Runs Friday mornings. For every claimed, active member:
 * 1. Builds the week's shared context once (the ask and its countdown, salary
 *    bands, open mandates, expiring credentials, the showcase, the next DFC
 *    Catalyst session, and this week's five Maarova awards), then assembles a
 *    per-recipient digest from it with no further queries. See
 *    lib/cadreWeeklyDigest.ts.
 * 2. Skips anyone on the suppression list.
 * 3. Sends via the existing comm-send infrastructure (ZeptoMail if configured,
 *    else SMTP fallback) so all the deliverability work we did already applies.
 * 4. Logs each send as an outbound Communication so it shows on the recipient's
 *    timeline.
 *
 * Throughput is a correctness problem here, not a nicety. The list went from 90
 * to 829 when the unreachable emailVerified gate came off, and the old shape
 * (one send at a time, a 1s sleep between each) would have needed fourteen
 * minutes. The function would have been killed around recipient 250 and the
 * rest of the list would have been dropped with the run still reporting the
 * sends it did manage. So: a 300s ceiling, and SEND_CONCURRENCY in flight at a
 * time with a short breather between batches to stay inside provider rate
 * limits. 829 recipients finish in roughly two minutes.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import {
  getDigestRecipients,
  isEmailSuppressed,
  buildWeekContext,
  buildDigestForProfessional,
  renderDigestHtml,
  type DigestRecipient,
  type WeekContext,
} from "@/lib/cadreWeeklyDigest";
import { sendOutboundEmail, buildMessageId } from "@/lib/communications-send";
import { computeRetentionExpiry, defaultLawfulBasis } from "@/lib/communications-retention";

/** Vercel's ceiling for this function. The run must finish well inside it. */
export const maxDuration = 300;

const SEND_CONCURRENCY = 8;
const BATCH_PAUSE_MS = 250;
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

type SendOutcome =
  | { kind: "SENT" }
  | { kind: "SUPPRESSED" }
  | { kind: "FAILED"; detail: string };

async function sendOne(
  r: DigestRecipient,
  ctx: WeekContext,
  senderId: string,
): Promise<SendOutcome> {
  if (await isEmailSuppressed(r.email)) {
    return { kind: "SUPPRESSED" };
  }

  const digest = buildDigestForProfessional(r, ctx);
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
      loggedById: senderId,
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

  if (result.ok) return { kind: "SENT" };
  return { kind: "FAILED", detail: `${r.email}: ${result.error ?? "unknown"}` };
}

async function run(req: NextRequest): Promise<Response> {
  if (!authorise(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const recipients = await getDigestRecipients();

  // Everything expensive happens once, before anybody is mailed: the week's
  // ask and its countdown, the salary bands, the showcase, and the allocation
  // of this week's five awards. Per recipient it is then pure assembly.
  const ctx = await buildWeekContext(recipients, startedAt);
  const senderId = await getSystemSenderId();

  let sentCount = 0;
  let skippedSuppressed = 0;
  let failedCount = 0;
  const failures: string[] = [];

  for (let i = 0; i < recipients.length; i += SEND_CONCURRENCY) {
    const batch = recipients.slice(i, i + SEND_CONCURRENCY);
    const outcomes = await Promise.all(
      batch.map(async (r): Promise<SendOutcome> => {
        try {
          return await sendOne(r, ctx, senderId);
        } catch (err) {
          // One member's row blowing up must not take the other 828 with it.
          const detail = err instanceof Error ? err.message : String(err);
          console.error(`[cadre-digest] ${r.email} failed:`, err);
          return { kind: "FAILED", detail: `${r.email}: ${detail}` };
        }
      }),
    );

    for (const outcome of outcomes) {
      if (outcome.kind === "SENT") sentCount++;
      else if (outcome.kind === "SUPPRESSED") skippedSuppressed++;
      else {
        failedCount++;
        failures.push(outcome.detail);
      }
    }

    if (i + SEND_CONCURRENCY < recipients.length) {
      await new Promise((res) => setTimeout(res, BATCH_PAUSE_MS));
    }
  }

  return Response.json({
    ok: true,
    sentAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    weekKey: ctx.weekKey,
    ask: ctx.ask,
    awardsIssued: ctx.awardsIssued,
    totalRecipients: recipients.length,
    sent: sentCount,
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
