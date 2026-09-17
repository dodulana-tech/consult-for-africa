/**
 * Daily nudge for submitted work nobody has looked at.
 *
 * The delegation loop has two halves and only one of them announced itself.
 * Blocking emails the assigner the moment it happens. Submitting emailed them
 * once and then went quiet, so seven tasks sat unreviewed for up to five days
 * while the person who sent them had no way to tell whether silence meant
 * approval or neglect.
 *
 * Emails the reviewer, not the assignee. Chasing your own reviewer is not a
 * junior colleague's job.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailReviewsWaiting } from "@/lib/email";

export const maxDuration = 60;

/** Grace period. A day is a reasonable turnaround; two is a backlog. */
const NUDGE_AFTER_DAYS = 2;

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}

export const POST = handler(async function POST(req: NextRequest) { return run(req); });
export const GET = handler(async function GET(req: NextRequest) { return run(req); });

async function run(req: NextRequest): Promise<Response> {
  if (!authorise(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - NUDGE_AFTER_DAYS * 86400000);
  const waiting = await prisma.task.findMany({
    where: { status: "SUBMITTED", submittedAt: { lte: cutoff } },
    select: {
      id: true, title: true, submittedAt: true,
      assignee: { select: { name: true } },
      assigner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  // One email per reviewer, not one per task.
  const byReviewer = new Map<string, { name: string; email: string; items: { title: string; assigneeName: string; daysWaiting: number; taskId: string }[] }>();
  for (const t of waiting) {
    // A task somebody raised for themselves has no reviewer to nudge.
    if (!t.assigner.email) continue;
    const entry = byReviewer.get(t.assigner.id) ?? { name: t.assigner.name, email: t.assigner.email, items: [] };
    entry.items.push({
      title: t.title,
      assigneeName: t.assignee.name,
      daysWaiting: t.submittedAt ? Math.floor((Date.now() - t.submittedAt.getTime()) / 86400000) : NUDGE_AFTER_DAYS,
      taskId: t.id,
    });
    byReviewer.set(t.assigner.id, entry);
  }

  let sent = 0;
  for (const [, r] of byReviewer) {
    try {
      await emailReviewsWaiting({ reviewerEmail: r.email, reviewerName: r.name, items: r.items });
      sent++;
    } catch (err) {
      console.error(`[review-nudge] email to ${r.email} failed:`, err);
    }
  }

  console.log(`[review-nudge] ${waiting.length} waiting, ${byReviewer.size} reviewer(s), ${sent} emailed`);
  return Response.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    waiting: waiting.length,
    reviewers: byReviewer.size,
    emailed: sent,
  });
}
