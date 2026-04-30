/**
 * NDPR / GDPR Retention Worker
 *
 * Runs nightly. For every Communication where retentionExpiresAt is in
 * the past and redactedAt is still null:
 *   - Null the body, bodyHtml, subject, attachmentUrls
 *   - Set redactedAt = now and redactedReason = "Retention policy expired"
 *   - Append a REDACTED event to the audit log
 *
 * The shell of the record (timestamps, status, role linkage, lawful
 * basis, hashed identifier via subject FK) is preserved so we can
 * prove compliance under NDPR audit. The personal data is gone.
 *
 * Recipients of an NDPR Right-to-Erasure request also get processed
 * here (out of band) by setting their retentionExpiresAt to now.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

const BATCH_SIZE = 200;

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${expected}`;
}

export const POST = handler(async function POST(req: NextRequest) {
  return runRetention(req);
});

// Vercel cron sends GET requests by default
export const GET = handler(async function GET(req: NextRequest) {
  return runRetention(req);
});

async function runRetention(req: NextRequest): Promise<Response> {
  if (!authorise(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let totalRedacted = 0;
  const errors: string[] = [];

  // Loop through batches until we've cleared all expired records
  while (true) {
    const expired = await prisma.communication.findMany({
      where: {
        retentionExpiresAt: { lt: now },
        redactedAt: null,
      },
      select: { id: true, subjectType: true },
      take: BATCH_SIZE,
    });

    if (expired.length === 0) break;

    for (const c of expired) {
      try {
        await prisma.communication.update({
          where: { id: c.id },
          data: {
            subject: null,
            body: null,
            bodyHtml: null,
            attachmentUrls: [],
            outcome: null,
            // Keep: subjectType, FKs, type, direction, status, occurredAt,
            // sentAt/repliedAt timestamps, loggedById, lawfulBasis -- the
            // audit shell remains so we can prove compliance.
            redactedAt: now,
            redactedReason: "Retention policy expired",
            events: {
              create: {
                type: "REDACTED",
                provider: "MANUAL",
                notes: `Retention expired for ${c.subjectType}`,
              },
            },
          },
        });
        totalRedacted++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${c.id}: ${errMsg}`);
      }
    }

    // Safety: don't loop forever
    if (totalRedacted > 10_000) {
      errors.push("Hit 10,000 record cap; will continue tomorrow");
      break;
    }
  }

  return Response.json({
    ok: true,
    redactedCount: totalRedacted,
    errorCount: errors.length,
    errors: errors.slice(0, 20),
    runAt: now.toISOString(),
  });
}
