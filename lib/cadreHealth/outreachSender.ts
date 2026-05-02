import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppTemplate,
  normalizePhoneNumber,
} from "@/lib/cadreHealth/whatsapp";
import { getCadreShortLabel } from "@/lib/cadreHealth/cadres";
import { sendReactivationEmail } from "@/lib/cadreHealth/outreachEmail";

export type OutreachChannel = "EMAIL" | "WHATSAPP";

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

/**
 * Send a follow-up SMS to a professional who didn't respond to WhatsApp.
 * Uses a third-party SMS API (placeholder for now).
 */
export async function sendFollowUpSMS(
  professionalId: string
): Promise<boolean> {
  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      phone: true,
      cadre: true,
      outreachRecord: { select: { id: true } },
    },
  });

  if (!professional?.phone || !professional.outreachRecord) {
    return false;
  }

  const shortLabel = getCadreShortLabel(professional.cadre);

  // TODO: Integrate with SMS provider (e.g. Termii, Africa's Talking)
  const smsContent = `Hi ${professional.firstName}, CadreHealth is a free career platform for ${shortLabel}s in Nigeria. Claim your profile at oncadre.com. Reply STOP to opt out.`;

  console.log(
    `[SMS Placeholder] Would send to ${professional.phone}: ${smsContent}`
  );

  const now = new Date();
  const nextContact = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

  // Save the message record
  await prisma.cadreWhatsAppMessage.create({
    data: {
      professionalId: professional.id,
      direction: "OUTBOUND",
      channel: "SMS",
      content: smsContent,
      deliveryStatus: "sent",
    },
  });

  await prisma.cadreOutreachRecord.update({
    where: { id: professional.outreachRecord.id },
    data: {
      status: "SMS_SENT",
      smsSentAt: now,
      lastContactedAt: now,
      nextContactAt: nextContact,
    },
  });

  return true;
}

/**
 * Send a follow-up email to a professional.
 * Uses the platform's existing email infrastructure.
 */
export async function sendFollowUpEmail(
  professionalId: string
): Promise<boolean> {
  const professional = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      cadre: true,
      subSpecialty: true,
      outreachRecord: { select: { id: true } },
    },
  });

  if (!professional?.email || !professional.outreachRecord) {
    return false;
  }

  const shortLabel = getCadreShortLabel(professional.cadre);
  const specialty = professional.subSpecialty ?? shortLabel;

  // TODO: Integrate with email service (Resend, Postmark, etc.)
  const emailSubject = `${professional.firstName}, your CadreHealth profile is ready`;
  const emailBody = `Hi ${professional.firstName},\n\nWe created a profile for you on CadreHealth, a career platform built for ${specialty} professionals in Nigeria.\n\nWith CadreHealth, you can track your credentials, see salary benchmarks, and discover new opportunities.\n\nClaim your profile at oncadre.com. It takes 30 seconds.\n\nBest regards,\nThe CadreHealth Team`;

  console.log(
    `[Email Placeholder] Would send to ${professional.email}:\nSubject: ${emailSubject}\n${emailBody}`
  );

  const now = new Date();

  await prisma.cadreWhatsAppMessage.create({
    data: {
      professionalId: professional.id,
      direction: "OUTBOUND",
      channel: "EMAIL",
      content: emailBody,
      deliveryStatus: "sent",
    },
  });

  await prisma.cadreOutreachRecord.update({
    where: { id: professional.outreachRecord.id },
    data: {
      status: "EMAIL_SENT",
      emailSentAt: now,
      lastContactedAt: now,
    },
  });

  return true;
}

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
