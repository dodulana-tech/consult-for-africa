import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppTemplate,
  normalizePhoneNumber,
} from "@/lib/cadreHealth/whatsapp";
import { getCadreShortLabel } from "@/lib/cadreHealth/cadres";

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
 * Send outreach to a batch of pending professionals.
 * Returns the count of successfully sent messages.
 */
export async function sendOutreachBatch(batchSize: number = 50): Promise<{
  sent: number;
  failed: number;
  total: number;
}> {
  // Find professionals with READY status (enriched, ready for outreach)
  const readyRecords = await prisma.cadreOutreachRecord.findMany({
    where: { status: "READY" },
    take: batchSize,
    orderBy: { createdAt: "asc" },
    select: { professionalId: true },
  });

  let sent = 0;
  let failed = 0;

  for (const record of readyRecords) {
    const success = await sendInitialWhatsApp(record.professionalId);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return { sent, failed, total: readyRecords.length };
}
