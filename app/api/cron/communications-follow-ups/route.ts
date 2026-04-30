/**
 * Auto Follow-up Nudge
 *
 * Runs daily. For every outbound EMAIL or WHATSAPP that:
 *   - Was sent 7+ days ago
 *   - Status is still SENT (no reply received)
 *   - Has no nextActionDate already set
 *   - Doesn't have a sibling follow-up nudge already created
 *
 * Creates an internal NOTE communication on the same contact reminding
 * the EM that the contact didn't reply. This becomes a follow-up the
 * EM can see in the "Follow-ups" tab of the global inbox.
 *
 * The nudge is attributed to the original sender (loggedById carries
 * over) so they see it in their "Mine" tab.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { computeRetentionExpiry, defaultLawfulBasis } from "@/lib/communications-retention";

const STALE_DAYS = 7;
const NUDGE_TAG = "auto-follow-up";

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

export const POST = handler(async function POST(req: NextRequest) {
  return runNudges(req);
});

export const GET = handler(async function GET(req: NextRequest) {
  return runNudges(req);
});

async function runNudges(req: NextRequest): Promise<Response> {
  if (!authorise(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);
  const now = new Date();

  // Find outbound comms that have been waiting for a reply
  const stale = await prisma.communication.findMany({
    where: {
      direction: "OUTBOUND",
      type: { in: ["EMAIL", "WHATSAPP"] },
      status: "SENT",
      sentAt: { lt: cutoff },
      isArchived: false,
      nextActionDate: null,
      // Avoid creating duplicate nudges
      NOT: {
        replies: {
          some: { tags: { has: NUDGE_TAG } },
        },
      },
    },
    select: {
      id: true,
      subjectType: true,
      consultantId: true,
      clientId: true,
      clientContactId: true,
      applicationId: true,
      cadreProfessionalId: true,
      partnerFirmId: true,
      salesAgentId: true,
      discoveryCallId: true,
      maarovaUserId: true,
      subject: true,
      sentAt: true,
      threadId: true,
      loggedById: true,
    },
    take: 500,
  });

  let created = 0;
  const errors: string[] = [];

  for (const c of stale) {
    try {
      // Double-check no nudge sibling exists (race-safe)
      const existing = await prisma.communication.findFirst({
        where: {
          replyToId: c.id,
          tags: { has: NUDGE_TAG },
        },
        select: { id: true },
      });
      if (existing) continue;

      const daysAgo = Math.round((now.getTime() - (c.sentAt?.getTime() ?? now.getTime())) / (24 * 60 * 60 * 1000));

      await prisma.communication.create({
        data: {
          subjectType: c.subjectType,
          consultantId: c.consultantId,
          clientId: c.clientId,
          clientContactId: c.clientContactId,
          applicationId: c.applicationId,
          cadreProfessionalId: c.cadreProfessionalId,
          partnerFirmId: c.partnerFirmId,
          salesAgentId: c.salesAgentId,
          discoveryCallId: c.discoveryCallId,
          maarovaUserId: c.maarovaUserId,
          type: "NOTE",
          direction: "INTERNAL",
          status: "LOGGED",
          subject: `No reply after ${daysAgo} days`,
          body: `${c.subject ? `"${c.subject}"` : "Outbound message"} sent ${daysAgo} days ago has not received a reply. Consider following up.`,
          occurredAt: now,
          nextAction: "Follow up",
          nextActionDate: now,
          nextActionAssignedToId: c.loggedById,
          tags: [NUDGE_TAG],
          replyToId: c.id,
          threadId: c.threadId ?? c.id,
          loggedById: c.loggedById,
          visibility: "TEAM",
          lawfulBasis: defaultLawfulBasis(c.subjectType),
          retentionExpiresAt: computeRetentionExpiry(c.subjectType, now),
          events: {
            create: {
              type: "CREATED",
              provider: "MANUAL",
              notes: "Auto-generated follow-up nudge",
            },
          },
        },
      });
      created++;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`${c.id}: ${errMsg}`);
    }
  }

  return Response.json({
    ok: true,
    candidatesFound: stale.length,
    nudgesCreated: created,
    errorCount: errors.length,
    errors: errors.slice(0, 20),
    runAt: now.toISOString(),
  });
}
