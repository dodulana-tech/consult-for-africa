import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/cadreHealth/sms";
import { sendReactivationEmail } from "@/lib/cadreHealth/outreachEmail";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { handler } from "@/lib/api-handler";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

export const POST = handler(async function POST() {
  try {
    const now = new Date();
    const summary = {
      smsSent: 0,
      smsErrors: 0,
      emailsSent: 0,
      emailErrors: 0,
    };

    // ─── Stage 1: WhatsApp non-responders -> SMS fallback ──────────────

    const whatsappNonResponders = await prisma.cadreOutreachRecord.findMany({
      where: {
        status: "WHATSAPP_SENT",
        whatsAppSentAt: { lt: new Date(now.getTime() - THREE_DAYS_MS) },
        contactAttempts: { lt: 3 },
      },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            cadre: true,
            subSpecialty: true,
          },
        },
      },
    });

    console.log(
      `[fallback] Stage 1: ${whatsappNonResponders.length} WhatsApp non-responders for SMS`
    );

    for (const record of whatsappNonResponders) {
      const prof = record.professional;

      if (!prof.phone) {
        // No phone, skip to email stage directly
        if (prof.email && record.emailValid) {
          await prisma.cadreOutreachRecord.update({
            where: { id: record.id },
            data: {
              status: "SMS_SENT", // Move to next stage so email fallback picks them up
              smsSentAt: now,
              contactAttempts: { increment: 1 },
              nextContactAt: new Date(now.getTime() + FOUR_DAYS_MS),
            },
          });
        }
        continue;
      }

      const cadreLabel = getCadreLabel(prof.cadre);
      const message =
        `Dr. ${prof.lastName}, your ${cadreLabel} profile on CadreHealth is ready to claim. ` +
        `See salary data, hospital reviews, and career opportunities. ` +
        `Visit: consultforafrica.com/oncadre/claim/${prof.id}`;

      try {
        const sent = await sendSMS(prof.phone, message);
        if (sent) {
          await prisma.cadreOutreachRecord.update({
            where: { id: record.id },
            data: {
              status: "SMS_SENT",
              smsSentAt: now,
              lastContactedAt: now,
              contactAttempts: { increment: 1 },
              nextContactAt: new Date(now.getTime() + FOUR_DAYS_MS),
            },
          });
          summary.smsSent++;
        } else {
          summary.smsErrors++;
        }
      } catch (err) {
        console.error(`[fallback] SMS error for ${prof.id}:`, err);
        summary.smsErrors++;
      }
    }

    // ─── Stage 2: SMS non-responders -> Email fallback ─────────────────

    const smsNonResponders = await prisma.cadreOutreachRecord.findMany({
      where: {
        status: "SMS_SENT",
        smsSentAt: { lt: new Date(now.getTime() - FOUR_DAYS_MS) },
        contactAttempts: { lt: 4 },
      },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            cadre: true,
            subSpecialty: true,
          },
        },
      },
    });

    console.log(
      `[fallback] Stage 2: ${smsNonResponders.length} SMS non-responders for email`
    );

    for (const record of smsNonResponders) {
      const prof = record.professional;

      if (!prof.email || !record.emailValid) {
        // No valid email, mark as unreachable
        await prisma.cadreOutreachRecord.update({
          where: { id: record.id },
          data: {
            status: "UNREACHABLE",
            notes: "All channels exhausted: WhatsApp, SMS, no valid email",
          },
        });
        continue;
      }

      try {
        const sent = await sendReactivationEmail(prof);
        if (sent) {
          await prisma.cadreOutreachRecord.update({
            where: { id: record.id },
            data: {
              status: "EMAIL_SENT",
              emailSentAt: now,
              lastContactedAt: now,
              contactAttempts: { increment: 1 },
            },
          });
          summary.emailsSent++;
        } else {
          summary.emailErrors++;
        }
      } catch (err) {
        console.error(`[fallback] Email error for ${prof.id}:`, err);
        summary.emailErrors++;
      }
    }

    console.log("[fallback] Complete:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[outreach/fallback] Error:", error);
    return NextResponse.json(
      { error: "Failed to process fallback outreach" },
      { status: 500 }
    );
  }
});
