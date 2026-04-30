/**
 * Inbound Email Webhook
 *
 * Handles inbound emails from Postmark (or compatible providers) and
 * threads them back to the originating Communication record.
 *
 * ─── Setup ────────────────────────────────────────────────────────────
 *
 * 1. Sign up for Postmark and create an inbound stream.
 * 2. Set up a subdomain (e.g. mail.consultforafrica.com) with the MX record
 *    Postmark provides.
 * 3. Set the Postmark Inbound webhook URL to:
 *      https://platform.consultforafrica.com/api/communications/inbound
 * 4. Set env var POSTMARK_INBOUND_SECRET to a long random string and
 *    configure Postmark to include it as a Basic Auth user (use your
 *    secret as the username, leave password blank).
 * 5. Set REPLY_DOMAIN env var to your inbound subdomain.
 *
 * Once that's done, every outbound email's Reply-To header will be
 * "reply+<communicationId>@mail.consultforafrica.com" and recipients
 * who hit Reply will route their response to Postmark, which posts the
 * parsed JSON here.
 *
 * ─── Reply matching ──────────────────────────────────────────────────
 *
 * We match replies to the original Communication via three signals,
 * in order of preference:
 *   1. VERP token in the To address (reply+<commId>@...)
 *   2. In-Reply-To header matching a stored Message-ID (externalId)
 *   3. From address matching a known contact's email
 *
 * If matched, we create an INBOUND Communication linked via replyToId
 * and threadId, and update the original's status to REPLIED.
 *
 * If unmatched, we create a Communication with subjectType=PROSPECT and
 * the sender's email so it still shows up on the global inbox for
 * triage.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import type { CommunicationSubjectType } from "@prisma/client";

interface PostmarkInboundPayload {
  FromName?: string;
  FromFull?: { Email: string; Name?: string };
  From?: string;
  To?: string;
  ToFull?: Array<{ Email: string; Name?: string }>;
  Cc?: string;
  CcFull?: Array<{ Email: string; Name?: string }>;
  Subject?: string;
  MessageID?: string;
  Date?: string;
  TextBody?: string;
  HtmlBody?: string;
  StrippedTextReply?: string;
  Headers?: Array<{ Name: string; Value: string }>;
  Attachments?: Array<{ Name: string; Content: string; ContentType: string }>;
}

function verifyAuth(req: NextRequest): boolean {
  const expected = process.env.POSTMARK_INBOUND_SECRET;
  if (!expected) {
    // Dev mode: allow without auth so manual testing works
    if (process.env.NODE_ENV !== "production") return true;
    console.warn("[inbound] POSTMARK_INBOUND_SECRET not set, rejecting in production");
    return false;
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() === expected;
  }
  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authHeader.slice(6).trim(), "base64").toString("utf8");
      const [user] = decoded.split(":");
      return user === expected;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Extract a comm ID from a VERP-style address.
 * "reply+abc123@domain" -> "abc123"
 * Returns null if not a VERP address.
 */
function extractVerpToken(address: string | undefined): string | null {
  if (!address) return null;
  const match = address.match(/reply\+([a-zA-Z0-9_-]+)@/i);
  return match?.[1] ?? null;
}

function getHeader(headers: PostmarkInboundPayload["Headers"], name: string): string | null {
  if (!headers) return null;
  const found = headers.find((h) => h.Name.toLowerCase() === name.toLowerCase());
  return found?.Value ?? null;
}

export const POST = handler(async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: PostmarkInboundPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = (payload.FromFull?.Email ?? payload.From ?? "").toLowerCase().trim();
  const fromName = payload.FromFull?.Name ?? payload.FromName ?? "";
  const toAddresses = (payload.ToFull ?? []).map((t) => t.Email.toLowerCase());
  const ccAddresses = (payload.CcFull ?? []).map((c) => c.Email.toLowerCase());
  const subject = payload.Subject ?? "";
  const body = payload.StrippedTextReply || payload.TextBody || "";
  const bodyHtml = payload.HtmlBody ?? null;
  const messageId = payload.MessageID
    ? `<${payload.MessageID}@inbound.postmark>`
    : null;
  const inReplyTo = getHeader(payload.Headers, "In-Reply-To");
  const occurredAt = payload.Date ? new Date(payload.Date) : new Date();

  // ─── Try to match the originating Communication ────────────────────
  let originalComm: { id: string; subjectType: CommunicationSubjectType; threadId: string | null; consultantId: string | null; clientId: string | null; clientContactId: string | null; applicationId: string | null; cadreProfessionalId: string | null; partnerFirmId: string | null; salesAgentId: string | null; discoveryCallId: string | null; maarovaUserId: string | null } | null = null;

  // 1. VERP token in To/Cc addresses
  for (const addr of [...toAddresses, ...ccAddresses]) {
    const commId = extractVerpToken(addr);
    if (commId) {
      const found = await prisma.communication.findUnique({
        where: { id: commId },
        select: {
          id: true, subjectType: true, threadId: true,
          consultantId: true, clientId: true, clientContactId: true,
          applicationId: true, cadreProfessionalId: true, partnerFirmId: true,
          salesAgentId: true, discoveryCallId: true, maarovaUserId: true,
        },
      });
      if (found) {
        originalComm = found;
        break;
      }
    }
  }

  // 2. In-Reply-To header matching stored Message-ID
  if (!originalComm && inReplyTo) {
    const found = await prisma.communication.findFirst({
      where: { externalId: inReplyTo },
      select: {
        id: true, subjectType: true, threadId: true,
        consultantId: true, clientId: true, clientContactId: true,
        applicationId: true, cadreProfessionalId: true, partnerFirmId: true,
        salesAgentId: true, discoveryCallId: true, maarovaUserId: true,
      },
    });
    if (found) originalComm = found;
  }

  // 3. From email matching a known contact (most-recent outbound to that address wins)
  if (!originalComm && fromEmail) {
    const found = await prisma.communication.findFirst({
      where: {
        direction: "OUTBOUND",
        toEmails: { has: fromEmail },
      },
      orderBy: { occurredAt: "desc" },
      select: {
        id: true, subjectType: true, threadId: true,
        consultantId: true, clientId: true, clientContactId: true,
        applicationId: true, cadreProfessionalId: true, partnerFirmId: true,
        salesAgentId: true, discoveryCallId: true, maarovaUserId: true,
      },
    });
    if (found) originalComm = found;
  }

  // ─── Create the inbound Communication ──────────────────────────────
  const created = await prisma.communication.create({
    data: {
      subjectType: originalComm?.subjectType ?? "PROSPECT",
      consultantId: originalComm?.consultantId ?? null,
      clientId: originalComm?.clientId ?? null,
      clientContactId: originalComm?.clientContactId ?? null,
      applicationId: originalComm?.applicationId ?? null,
      cadreProfessionalId: originalComm?.cadreProfessionalId ?? null,
      partnerFirmId: originalComm?.partnerFirmId ?? null,
      salesAgentId: originalComm?.salesAgentId ?? null,
      discoveryCallId: originalComm?.discoveryCallId ?? null,
      maarovaUserId: originalComm?.maarovaUserId ?? null,
      // For unmatched, fall back to prospect fields
      prospectName: !originalComm ? (fromName || null) : null,
      prospectEmail: !originalComm ? fromEmail : null,
      type: "EMAIL",
      direction: "INBOUND",
      status: "DELIVERED",
      subject,
      body,
      bodyHtml,
      occurredAt,
      deliveredAt: occurredAt,
      fromEmail,
      toEmails: toAddresses,
      ccEmails: ccAddresses,
      externalId: messageId,
      inReplyTo,
      threadId: originalComm?.threadId ?? originalComm?.id ?? null,
      replyToId: originalComm?.id ?? null,
      // Use a system user for loggedBy. We require at least one ADMIN/PARTNER user to exist.
      loggedById: await getSystemLoggerId(),
      events: {
        create: {
          type: "PROVIDER_WEBHOOK",
          provider: "POSTMARK",
          providerEventId: payload.MessageID ?? null,
          providerPayload: payload as never,
          notes: originalComm
            ? `Inbound reply matched to ${originalComm.id}`
            : `Inbound from ${fromEmail} (unmatched, queued for triage)`,
        },
      },
    },
  });

  // ─── Update the parent comm status to REPLIED ──────────────────────
  if (originalComm) {
    await prisma.communication.update({
      where: { id: originalComm.id },
      data: {
        status: "REPLIED",
        repliedAt: occurredAt,
        threadId: originalComm.threadId ?? originalComm.id,
        events: {
          create: {
            type: "REPLIED",
            toStatus: "REPLIED",
            provider: "POSTMARK",
            providerEventId: payload.MessageID ?? null,
            notes: `Reply received from ${fromEmail}`,
          },
        },
      },
    });
  }

  return Response.json({
    ok: true,
    communicationId: created.id,
    matched: !!originalComm,
    parentId: originalComm?.id ?? null,
  });
});

/**
 * Returns the user ID to attribute system-created comms to.
 * Picks the first ADMIN, falling back to the first PARTNER, then any user.
 * Cached at module level for performance.
 */
let cachedSystemLoggerId: string | null = null;

async function getSystemLoggerId(): Promise<string> {
  if (cachedSystemLoggerId) return cachedSystemLoggerId;
  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "PARTNER"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (admin) {
    cachedSystemLoggerId = admin.id;
    return admin.id;
  }
  const any = await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!any) throw new Error("No users in system to attribute inbound email to");
  cachedSystemLoggerId = any.id;
  return any.id;
}
