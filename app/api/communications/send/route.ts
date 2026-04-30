import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { isCommsElevated } from "@/lib/communications";
import {
  sendOutboundEmail,
  buildMessageId,
  resolveAudience,
  applySuppressionFilter,
  renderTemplate,
  type AudienceCode,
  type AudienceMember,
} from "@/lib/communications-send";
import type { CommunicationSubjectType } from "@prisma/client";

interface SingleRecipient {
  // Subject linkage (one of these)
  subjectType: CommunicationSubjectType;
  consultantId?: string;
  clientId?: string;
  clientContactId?: string;
  applicationId?: string;
  cadreProfessionalId?: string;
  partnerFirmId?: string;
  salesAgentId?: string;
  discoveryCallId?: string;
  maarovaUserId?: string;
  // Contact info
  email: string;
  fullName?: string;
  firstName?: string;
}

/**
 * POST /api/communications/send
 *
 * Body shape:
 * - For 1-to-1: { mode: "single", recipient: { ...subjectRef..., email }, subject, body }
 * - For bulk:   { mode: "audience", audience: AudienceCode, subject, body, dryRun?: boolean }
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const mode = body.mode;
  const subject: string = (body.subject ?? "").toString().trim();
  const bodyText: string = (body.body ?? body.bodyText ?? "").toString();

  if (!subject) {
    return Response.json({ error: "Subject is required" }, { status: 400 });
  }
  if (!bodyText.trim()) {
    return Response.json({ error: "Body is required" }, { status: 400 });
  }

  if (mode === "single") {
    const recipient = body.recipient as SingleRecipient;
    if (!recipient?.email) {
      return Response.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const result = await sendOneAndLog({
      subject,
      bodyText,
      recipient: {
        email: recipient.email,
        firstName: recipient.firstName,
        fullName: recipient.fullName ?? recipient.email,
        subjectType: recipient.subjectType,
        consultantId: recipient.consultantId,
        clientContactId: recipient.clientContactId,
        applicationId: recipient.applicationId,
        cadreProfessionalId: recipient.cadreProfessionalId,
        partnerFirmId: recipient.partnerFirmId,
        vars: {
          firstName: recipient.firstName ?? "",
          fullName: recipient.fullName ?? "",
          email: recipient.email,
        },
      },
      loggedById: session.user.id,
      bulkId: null,
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Communication",
      entityId: result.communicationId ?? "unknown",
      entityName: subject,
      details: { type: "EMAIL", direction: "OUTBOUND", mode: "single" },
    });

    return Response.json(result);
  }

  if (mode === "audience") {
    const audience = body.audience as AudienceCode;
    const dryRun = body.dryRun === true;

    if (!audience) {
      return Response.json({ error: "Audience is required" }, { status: 400 });
    }

    let members: AudienceMember[];
    try {
      members = await resolveAudience(audience);
    } catch (err) {
      return Response.json({ error: `Failed to resolve audience: ${(err as Error).message}` }, { status: 400 });
    }

    members = await applySuppressionFilter(members);

    if (dryRun) {
      return Response.json({
        ok: true,
        dryRun: true,
        audience,
        recipientCount: members.length,
        recipients: members.slice(0, 20).map((m) => ({ email: m.email, fullName: m.fullName })),
      });
    }

    if (members.length === 0) {
      return Response.json({ error: "No recipients in this audience after suppression filter" }, { status: 400 });
    }

    // Hard cap to prevent accidents
    const HARD_CAP = 1000;
    if (members.length > HARD_CAP) {
      return Response.json(
        { error: `Audience has ${members.length} recipients which exceeds the cap of ${HARD_CAP}. Use a more specific filter.` },
        { status: 400 }
      );
    }

    // Create the BulkCommunication record up front
    const bulk = await prisma.bulkCommunication.create({
      data: {
        name: `${audience}: ${subject.slice(0, 80)}`,
        type: "EMAIL",
        subject,
        body: bodyText,
        filterDescription: audience,
        recipientCount: members.length,
        status: "SENDING",
        createdById: session.user.id,
        sentAt: new Date(),
      },
    });

    // Send sequentially with brief delay (Zoho rate limits)
    // For real-volume sends switch to a queue / Postmark Broadcast.
    const results: { email: string; ok: boolean; error?: string }[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const renderedSubject = renderTemplate(subject, m.vars);
      const renderedBody = renderTemplate(bodyText, m.vars);

      const result = await sendOneAndLog({
        subject: renderedSubject,
        bodyText: renderedBody,
        recipient: m,
        loggedById: session.user.id,
        bulkId: bulk.id,
      });

      results.push({ email: m.email, ok: result.ok, error: result.error });
      if (result.ok) successCount++;
      else failureCount++;

      // Throttle: wait 200ms between sends (5/sec) to stay under Zoho limits.
      // For large lists this is the bottleneck -- migrate to Postmark for >100.
      if (i < members.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    await prisma.bulkCommunication.update({
      where: { id: bulk.id },
      data: {
        status: failureCount === 0 ? "SENT" : (successCount === 0 ? "FAILED" : "SENT"),
        completedAt: new Date(),
        successCount,
        failureCount,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      entityType: "BulkCommunication",
      entityId: bulk.id,
      entityName: `${audience}: ${subject.slice(0, 80)}`,
      details: { audience, recipientCount: members.length, successCount, failureCount },
    });

    return Response.json({
      ok: true,
      bulkId: bulk.id,
      recipientCount: members.length,
      successCount,
      failureCount,
      failures: results.filter((r) => !r.ok),
    });
  }

  return Response.json({ error: "Invalid mode. Use 'single' or 'audience'." }, { status: 400 });
});

interface SendOneInput {
  subject: string;
  bodyText: string;
  recipient: AudienceMember;
  loggedById: string;
  bulkId: string | null;
}

interface SendOneResult {
  ok: boolean;
  communicationId: string | null;
  messageId: string | null;
  error?: string;
}

async function sendOneAndLog(input: SendOneInput): Promise<SendOneResult> {
  const { subject, bodyText, recipient, loggedById, bulkId } = input;

  // Pre-create a placeholder Communication so we can use its ID in the
  // VERP Reply-To address. This way the inbound webhook can decode the
  // reply directly to this comm without needing header-based matching.
  const placeholder = await prisma.communication.create({
    data: {
      subjectType: recipient.subjectType,
      consultantId: recipient.consultantId ?? null,
      clientId: recipient.clientId ?? null,
      clientContactId: recipient.clientContactId ?? null,
      applicationId: recipient.applicationId ?? null,
      cadreProfessionalId: recipient.cadreProfessionalId ?? null,
      partnerFirmId: recipient.partnerFirmId ?? null,
      salesAgentId: recipient.salesAgentId ?? null,
      discoveryCallId: recipient.discoveryCallId ?? null,
      maarovaUserId: recipient.maarovaUserId ?? null,
      type: "EMAIL",
      direction: "OUTBOUND",
      status: "DRAFT",
      subject,
      body: bodyText,
      occurredAt: new Date(),
      fromEmail: process.env.SMTP_FROM ?? null,
      toEmails: [recipient.email],
      bulkId: bulkId ?? null,
      loggedById,
      threadId: null, // self-thread; set below for replies
    },
  });

  // Use the comm ID as the threadId (self-thread root)
  const messageId = buildMessageId(placeholder.id);
  const replyDomain = process.env.REPLY_DOMAIN ?? "consultforafrica.com";
  const replyTo = `reply+${placeholder.id}@${replyDomain}`;

  const sendResult = await sendOutboundEmail({
    to: recipient.email,
    subject,
    bodyText,
    messageId,
    replyTo,
  });

  const comm = await prisma.communication.update({
    where: { id: placeholder.id },
    data: {
      status: sendResult.ok ? "SENT" : "FAILED",
      sentAt: sendResult.ok ? new Date() : null,
      externalId: sendResult.ok ? sendResult.messageId : null,
      threadId: placeholder.id, // self-thread root
      events: {
        create: [
          {
            type: "CREATED",
            actorUserId: loggedById,
            provider: "ZOHO",
            notes: bulkId ? "Bulk email" : "Single email",
          },
          {
            type: sendResult.ok ? "SENT" : "FAILED",
            toStatus: sendResult.ok ? "SENT" : "FAILED",
            provider: "ZOHO",
            providerEventId: sendResult.messageId ?? null,
            notes: sendResult.error ?? null,
          },
        ],
      },
    },
  });

  return {
    ok: sendResult.ok,
    communicationId: comm.id,
    messageId: sendResult.messageId,
    error: sendResult.error,
  };
}
