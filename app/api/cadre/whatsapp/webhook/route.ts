import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  normalizePhoneNumber,
  sendWhatsAppText,
} from "@/lib/cadreHealth/whatsapp";
import { handleConversation } from "@/lib/cadreHealth/cadreWhatsAppAgent";
import { handler } from "@/lib/api-handler";

// ─── CadreHealth: WhatsApp Webhook ───

/**
 * GET: Meta webhook verification.
 * Meta sends hub.mode, hub.verify_token, hub.challenge as query params.
 */
export const GET = handler(async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.CADRE_WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
});

/**
 * POST: Incoming WhatsApp messages and status updates.
 * Must return 200 quickly. Heavy processing runs non-blocking.
 */
export const POST = handler(async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify webhook signature
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("WhatsApp webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Return 200 immediately, then process in the background
  // Using waitUntil pattern via the edge runtime isn't available in Node,
  // so we fire-and-forget with a caught promise.
  processWebhook(payload).catch((err) =>
    console.error("Webhook processing error:", err)
  );

  return NextResponse.json({ status: "ok" }, { status: 200 });
});

// ─── Types for Meta webhook payload ───

interface WebhookPayload {
  object: string;
  entry?: WebhookEntry[];
}

interface WebhookEntry {
  id: string;
  changes?: WebhookChange[];
}

interface WebhookChange {
  value: {
    messaging_product: string;
    metadata?: { phone_number_id: string; display_phone_number: string };
    contacts?: { profile: { name: string }; wa_id: string }[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: string;
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsAppStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: { code: number; title: string }[];
}

// ─── Processing ───

async function processWebhook(payload: WebhookPayload) {
  if (payload.object !== "whatsapp_business_account") return;

  const changes = payload.entry?.[0]?.changes;
  if (!changes?.length) return;

  for (const change of changes) {
    const value = change.value;

    // Handle status updates (delivery receipts, read receipts)
    if (value.statuses?.length) {
      await handleStatusUpdates(value.statuses);
    }

    // Handle incoming messages
    if (value.messages?.length) {
      for (const message of value.messages) {
        await handleIncomingMessage(message);
      }
    }
  }
}

/**
 * Update delivery status on outbound messages.
 */
async function handleStatusUpdates(statuses: WhatsAppStatus[]) {
  for (const status of statuses) {
    try {
      // Find the outbound message by Meta message ID
      const existing = await prisma.cadreWhatsAppMessage.findFirst({
        where: { whatsAppMessageId: status.id },
      });

      if (!existing) continue;

      await prisma.cadreWhatsAppMessage.update({
        where: { id: existing.id },
        data: { deliveryStatus: status.status },
      });

      // Also update outreach record timestamps
      if (existing.professionalId) {
        const outreach = await prisma.cadreOutreachRecord.findUnique({
          where: { professionalId: existing.professionalId },
        });

        if (outreach) {
          const updateData: Record<string, Date> = {};
          if (status.status === "delivered" && !outreach.whatsAppDeliveredAt) {
            updateData.whatsAppDeliveredAt = new Date();
          }
          if (status.status === "read" && !outreach.whatsAppReadAt) {
            updateData.whatsAppReadAt = new Date();
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.cadreOutreachRecord.update({
              where: { id: outreach.id },
              data: updateData,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Status update error for ${status.id}:`, err);
    }
  }
}

/**
 * Handle an incoming text message from a professional.
 */
async function handleIncomingMessage(message: WhatsAppMessage) {
  // Only handle text messages for now
  if (message.type !== "text" || !message.text?.body) return;

  const senderPhone = message.from; // Already in international format from Meta
  const messageText = message.text.body;

  // Normalize and look up the professional
  const normalized = normalizePhoneNumber(senderPhone);
  const professional = await findProfessionalByPhone(normalized);

  if (!professional) {
    // Unknown number: send a polite redirect
    await sendWhatsAppText(
      senderPhone,
      "We don't have your number in our records. Visit oncadre.com to register and join the CadreHealth network."
    );
    return;
  }

  // Save inbound message
  const inboundMsg = await prisma.cadreWhatsAppMessage.create({
    data: {
      professionalId: professional.id,
      direction: "INBOUND",
      content: messageText,
      whatsAppMessageId: message.id,
      deliveryStatus: "received",
    },
  });

  // Load conversation history (last 10 messages)
  const history = await prisma.cadreWhatsAppMessage.findMany({
    where: {
      professionalId: professional.id,
      id: { not: inboundMsg.id }, // exclude the one we just created
    },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: {
      direction: true,
      content: true,
      createdAt: true,
    },
  });

  // Call Claude conversation handler
  const result = await handleConversation(professional, history, messageText);

  // Save outbound message
  const whatsAppMsgId = await sendWhatsAppText(senderPhone, result.response);

  await prisma.cadreWhatsAppMessage.create({
    data: {
      professionalId: professional.id,
      direction: "OUTBOUND",
      content: result.response,
      whatsAppMessageId: whatsAppMsgId,
      intentDetected: result.intent,
      profileUpdates: result.profileUpdates ? JSON.parse(JSON.stringify(result.profileUpdates)) : undefined,
      claudeModelUsed: "claude-sonnet-4-6",
      deliveryStatus: whatsAppMsgId ? "sent" : "failed",
    },
  });

  // Update outreach record
  await updateOutreachStatus(professional.id, result.intent);

  // Apply profile updates if any
  if (result.profileUpdates && Object.keys(result.profileUpdates).length > 0) {
    await applyProfileUpdates(professional.id, result.profileUpdates);
  }
}

/**
 * Find a professional by phone number.
 * Tries multiple normalized formats to handle edge cases.
 */
async function findProfessionalByPhone(phone: string) {
  const normalized = normalizePhoneNumber(phone);

  // Try exact match first
  let professional = await prisma.cadreProfessional.findFirst({
    where: { phone: normalized },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cadre: true,
      subSpecialty: true,
      state: true,
      city: true,
      currentFacility: true,
      currentRole: true,
      yearsOfExperience: true,
      accountStatus: true,
      isDiaspora: true,
      diasporaCountry: true,
      profileCompleteness: true,
    },
  });

  if (professional) return professional;

  // Try with leading + prefix
  professional = await prisma.cadreProfessional.findFirst({
    where: { phone: "+" + normalized },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      cadre: true,
      subSpecialty: true,
      state: true,
      city: true,
      currentFacility: true,
      currentRole: true,
      yearsOfExperience: true,
      accountStatus: true,
      isDiaspora: true,
      diasporaCountry: true,
      profileCompleteness: true,
    },
  });

  if (professional) return professional;

  // Try local format: 0XXX...
  if (normalized.startsWith("234")) {
    const localFormat = "0" + normalized.slice(3);
    professional = await prisma.cadreProfessional.findFirst({
      where: { phone: localFormat },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        cadre: true,
        subSpecialty: true,
        state: true,
        city: true,
        currentFacility: true,
        currentRole: true,
        yearsOfExperience: true,
        accountStatus: true,
        isDiaspora: true,
        diasporaCountry: true,
        profileCompleteness: true,
      },
    });
  }

  return professional;
}

/**
 * Map conversation intent to outreach status updates.
 */
async function updateOutreachStatus(
  professionalId: string,
  intent: string
) {
  const outreach = await prisma.cadreOutreachRecord.findUnique({
    where: { professionalId },
  });

  if (!outreach) return;

  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {
    lastContactedAt: now,
  };

  // Update status based on intent
  switch (intent) {
    case "NOT_INTERESTED":
      data.status = "NOT_INTERESTED";
      break;
    case "EMIGRATED":
      data.status = "EMIGRATED";
      break;
    case "RETIRED":
      data.status = "RETIRED";
      break;
    case "INTERESTED":
    case "QUESTION":
    case "PROFILE_UPDATE":
    case "GREETING":
      // If this is their first reply, mark as replied
      if (outreach.status === "WHATSAPP_SENT") {
        data.status = "WHATSAPP_REPLIED";
        data.whatsAppRepliedAt = now;
      }
      break;
  }

  await prisma.cadreOutreachRecord.update({
    where: { id: outreach.id },
    data,
  });
}

/**
 * Apply Claude-extracted profile updates to the professional record.
 * Only allows safe fields to be updated.
 */
async function applyProfileUpdates(
  professionalId: string,
  updates: Record<string, unknown>
) {
  const allowedFields = new Set([
    "subSpecialty",
    "currentFacility",
    "currentRole",
    "state",
    "city",
    "country",
    "isDiaspora",
    "diasporaCountry",
    "yearsOfExperience",
  ]);

  const safeUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.has(key) && value !== null && value !== undefined) {
      safeUpdates[key] = value;
    }
  }

  if (Object.keys(safeUpdates).length === 0) return;

  try {
    await prisma.cadreProfessional.update({
      where: { id: professionalId },
      data: safeUpdates,
    });
  } catch (err) {
    console.error(`Profile update failed for ${professionalId}:`, err);
  }
}
