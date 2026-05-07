import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppTemplate,
  normalizePhoneNumber,
} from "@/lib/cadreHealth/whatsapp";
import { getCadreShortLabel } from "@/lib/cadreHealth/cadres";
import { sendReactivationEmail } from "@/lib/cadreHealth/outreachEmail";

export type OutreachChannel = "EMAIL" | "WHATSAPP";

/**
 * Check the platform-wide CommunicationSuppression list before sending.
 * Once a recipient bounces, opts out, or files a complaint, they belong
 * here -- the cron should never hit them again.
 */
async function isSuppressed(email: string): Promise<boolean> {
  if (!email) return false;
  const lower = email.toLowerCase();
  const hit = await prisma.communicationSuppression.findFirst({
    where: {
      email: lower,
      OR: [{ channel: "EMAIL" }, { channel: null }],
    },
    select: { id: true },
  });
  return !!hit;
}

// ─── CadreHealth: Outbound Outreach Sender ───

/**
 * Send the initial WhatsApp template message to a professional.
 * This is the first touch in the outreach sequence.
 */
export async function sendInitialWhatsApp(
  professionalId: string
): Promise<boolean> {
  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      cadre: true,
      subSpecialty: true,
      outreachRecord: { select: { id: true, status: true } },
    },
  });

  if (!professional) {
    console.error(`Professional not found: ${professionalId}`);
    return false;
  }

  if (!professional.phone) {
    console.error(`No phone number for professional: ${professionalId}`);
    return false;
  }

  const phone = normalizePhoneNumber(professional.phone);
  const shortLabel = getCadreShortLabel(professional.cadre);
  const specialty = professional.subSpecialty ?? shortLabel;

  // Template params: [1] first name, [2] specialty/cadre label
  const whatsAppMsgId = await sendWhatsAppTemplate(
    phone,
    "cadrehealth_intro_v1",
    [professional.firstName, specialty]
  );

  if (!whatsAppMsgId) {
    console.error(`WhatsApp template send failed for ${professionalId}`);

    // Mark as unreachable if we can't even send
    if (professional.outreachRecord) {
      await prisma.cadreOutreachRecord.update({
        where: { id: professional.outreachRecord.id },
        data: { status: "UNREACHABLE", lastContactedAt: new Date() },
      });
    }

    return false;
  }

  const now = new Date();
  const nextContact = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

  // Save the outbound message
  await prisma.cadreWhatsAppMessage.create({
    data: {
      professionalId: professional.id,
      direction: "OUTBOUND",
      content: `[Template: cadrehealth_intro_v1] Hi ${professional.firstName}, CadreHealth is a career platform for ${specialty} professionals in Nigeria...`,
      whatsAppMessageId: whatsAppMsgId,
      templateName: "cadrehealth_intro_v1",
      deliveryStatus: "sent",
    },
  });

  // Update or create outreach record
  if (professional.outreachRecord) {
    await prisma.cadreOutreachRecord.update({
      where: { id: professional.outreachRecord.id },
      data: {
        status: "WHATSAPP_SENT",
        whatsAppSentAt: now,
        lastContactedAt: now,
        nextContactAt: nextContact,
      },
    });
  } else {
    await prisma.cadreOutreachRecord.create({
      data: {
        professionalId: professional.id,
        status: "WHATSAPP_SENT",
        whatsAppSentAt: now,
        lastContactedAt: now,
        nextContactAt: nextContact,
      },
    });
  }

  return true;
}

/**
 * Send the initial outreach email to a professional.
 * This is the email-channel equivalent of sendInitialWhatsApp -- it is the
 * first touch when the WhatsApp API is not yet provisioned.
 */
export async function sendInitialEmail(
  professionalId: string,
): Promise<{ ok: boolean; error?: string }> {
  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      cadre: true,
      subSpecialty: true,
      outreachRecord: { select: { id: true, status: true } },
    },
  });

  if (!professional) {
    return { ok: false, error: "Professional not found" };
  }
  if (!professional.email) {
    return { ok: false, error: "No email on record" };
  }

  // Skip recipients on the suppression list (bounced, opted out, complained).
  if (await isSuppressed(professional.email)) {
    if (professional.outreachRecord && professional.outreachRecord.status !== "UNREACHABLE") {
      await prisma.cadreOutreachRecord.update({
        where: { id: professional.outreachRecord.id },
        data: {
          status: "UNREACHABLE",
          notes: professional.outreachRecord ? "Suppressed (bounced/opted-out)" : null,
        },
      });
    }
    return { ok: false, error: "Recipient is on the suppression list" };
  }

  const result = await sendReactivationEmail({
    id: professional.id,
    firstName: professional.firstName,
    lastName: professional.lastName,
    email: professional.email,
    cadre: professional.cadre,
    subSpecialty: professional.subSpecialty,
  });

  if (!result.ok) {
    if (professional.outreachRecord) {
      await prisma.cadreOutreachRecord.update({
        where: { id: professional.outreachRecord.id },
        data: { lastContactedAt: new Date(), contactAttempts: { increment: 1 } },
      });
    }
    return { ok: false, error: result.error };
  }

  const now = new Date();
  // Email cycles are looser than WhatsApp -- 7 days before any reminder.
  const nextContact = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.cadreWhatsAppMessage.create({
    data: {
      professionalId: professional.id,
      direction: "OUTBOUND",
      channel: "EMAIL",
      content: `[Email: cadrehealth_intro_v1] Sent to ${professional.email}`,
      deliveryStatus: "sent",
    },
  });

  if (professional.outreachRecord) {
    await prisma.cadreOutreachRecord.update({
      where: { id: professional.outreachRecord.id },
      data: {
        status: "EMAIL_SENT",
        emailSentAt: now,
        lastContactedAt: now,
        nextContactAt: nextContact,
        contactAttempts: { increment: 1 },
      },
    });
  } else {
    await prisma.cadreOutreachRecord.create({
      data: {
        professionalId: professional.id,
        status: "EMAIL_SENT",
        emailSentAt: now,
        lastContactedAt: now,
        nextContactAt: nextContact,
        contactAttempts: 1,
      },
    });
  }

  return { ok: true };
}

// Removed: sendFollowUpSMS and sendFollowUpEmail were placeholders that
// logged to console without actually sending, while updating DB state to
// claim a send had occurred. Both had zero callers anywhere in the
// codebase. The real outreach flow is sendInitialEmail above (production
// path) and sendInitialWhatsApp (gated until Business API is provisioned).

/**
 * Send outreach to a batch of pending professionals on the chosen channel.
 * Email batches skip pros with no email; WhatsApp batches skip pros with no
 * phone. Tier A is prioritized within each batch.
 */
export interface BatchResult {
  sent: number;
  failed: number;
  total: number;
  channel: OutreachChannel;
  errorSample: { professionalId: string; error: string }[];
}

export async function sendOutreachBatch(
  batchSize: number = 50,
  channel: OutreachChannel = "EMAIL",
): Promise<BatchResult> {
  const professionalFilter =
    channel === "EMAIL"
      ? { email: { not: "" } }
      : { phone: { not: null } };

  const readyRecords = await prisma.cadreOutreachRecord.findMany({
    where: {
      status: "READY",
      professional: professionalFilter,
    },
    take: batchSize,
    orderBy: [
      { tier: "asc" }, // A first, then B, then C
      { createdAt: "asc" },
    ],
    select: { professionalId: true },
  });

  let sent = 0;
  let failed = 0;
  const errorSample: { professionalId: string; error: string }[] = [];

  for (const record of readyRecords) {
    let ok: boolean;
    let error: string | undefined;

    if (channel === "EMAIL") {
      const r = await sendInitialEmail(record.professionalId);
      ok = r.ok;
      error = r.error;
    } else {
      ok = await sendInitialWhatsApp(record.professionalId);
      if (!ok) error = "WhatsApp send failed (see server logs)";
    }

    if (ok) {
      sent++;
    } else {
      failed++;
      if (errorSample.length < 5 && error) {
        errorSample.push({ professionalId: record.professionalId, error });
      }
    }

    // Small delay to stay under Zoho / WA rate limits.
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return { sent, failed, total: readyRecords.length, channel, errorSample };
}
