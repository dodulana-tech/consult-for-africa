import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReactivationEmail } from "@/lib/cadreHealth/outreachEmail";

// Assume this exists and will be implemented with WhatsApp Business API
// import { sendInitialWhatsApp } from "@/lib/cadreHealth/outreachSender";

const DEFAULT_BATCH_SIZE = 50;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize ?? DEFAULT_BATCH_SIZE, 200);

    // Find records ready for outreach, prioritizing Tier A
    const records = await prisma.cadreOutreachRecord.findMany({
      where: {
        status: "READY",
        nextContactAt: { lte: new Date() },
      },
      orderBy: [{ tier: "asc" }, { nextContactAt: "asc" }],
      take: batchSize,
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            cadre: true,
            subSpecialty: true,
          },
        },
      },
    });

    if (records.length === 0) {
      return NextResponse.json({
        processed: 0,
        whatsappSent: 0,
        emailSent: 0,
        errors: 0,
        message: "No records ready for outreach at this time.",
      });
    }

    const summary = { processed: 0, whatsappSent: 0, emailSent: 0, errors: 0 };

    for (const record of records) {
      const prof = record.professional;
      summary.processed++;

      try {
        if (prof.phone && record.phoneActive) {
          // WhatsApp outreach (primary channel)
          // TODO: Uncomment when WhatsApp Business API integration is ready
          // const sent = await sendInitialWhatsApp(prof);
          const sent = false; // Placeholder until WhatsApp sender is implemented
          console.log(`[batch] WhatsApp placeholder for ${prof.firstName} ${prof.lastName} (${prof.phone})`);

          if (sent) {
            await prisma.cadreOutreachRecord.update({
              where: { id: record.id },
              data: {
                status: "WHATSAPP_SENT",
                whatsAppSentAt: new Date(),
                lastContactedAt: new Date(),
                contactAttempts: { increment: 1 },
                nextContactAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days for fallback
              },
            });
            summary.whatsappSent++;
          } else {
            // WhatsApp not available yet, fall through to email
            if (prof.email && record.emailValid) {
              const emailSent = await sendReactivationEmail(prof);
              await prisma.cadreOutreachRecord.update({
                where: { id: record.id },
                data: {
                  status: emailSent ? "EMAIL_SENT" : "READY",
                  emailSentAt: emailSent ? new Date() : undefined,
                  lastContactedAt: new Date(),
                  contactAttempts: { increment: 1 },
                  nextContactAt: emailSent
                    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                },
              });
              if (emailSent) summary.emailSent++;
            }
          }
        } else if (prof.email && record.emailValid) {
          // Email-only outreach (no phone)
          const emailSent = await sendReactivationEmail(prof);
          await prisma.cadreOutreachRecord.update({
            where: { id: record.id },
            data: {
              status: emailSent ? "EMAIL_SENT" : "READY",
              emailSentAt: emailSent ? new Date() : undefined,
              lastContactedAt: new Date(),
              contactAttempts: { increment: 1 },
              nextContactAt: emailSent
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            },
          });
          if (emailSent) summary.emailSent++;
        }
      } catch (err) {
        console.error(`[batch] Error processing ${prof.id}:`, err);
        summary.errors++;
      }
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[outreach/batch] Error:", error);
    return NextResponse.json(
      { error: "Failed to process outreach batch" },
      { status: 500 }
    );
  }
}
