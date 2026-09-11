/**
 * Generates the firm's recurring work.
 *
 * Runs every morning. For each active rhythm it works out the next occurrence
 * after the one it last produced, and raises the task once the lead time has
 * been reached. A board pack due on the 30th with seven days of lead appears on
 * the 23rd, which is the only version of that task that is any use.
 *
 * lastGeneratedFor is the guard against duplicates and the evidence of a gap:
 * a rhythm whose last occurrence is months behind has been quietly failing.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { nextOccurrenceAfter, shouldGenerateNow } from "@/lib/office";
import { emailTaskAssigned } from "@/lib/email";

export const maxDuration = 120;

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}

export const POST = handler(async function POST(req: NextRequest) {
  return run(req);
});

export const GET = handler(async function GET(req: NextRequest) {
  return run(req);
});

async function run(req: NextRequest): Promise<Response> {
  if (!authorise(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const rhythms = await prisma.recurringTask.findMany({
    where: { active: true },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      assigner: { select: { id: true, name: true } },
    },
  });

  const generated: Array<{ rhythm: string; taskId: string; dueDate: string }> = [];
  const skipped: string[] = [];

  for (const r of rhythms) {
    // Start from the last occurrence produced, so a cron that missed a day
    // catches up rather than skipping the occurrence it slept through.
    const since = r.lastGeneratedFor ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const occurrence = nextOccurrenceAfter(r, since);
    if (!occurrence) {
      skipped.push(`${r.title}: no next occurrence`);
      continue;
    }
    if (!shouldGenerateNow(occurrence, r.leadTimeDays, now)) continue;

    const checkInAt = r.checkInOffsetDays
      ? new Date(occurrence.getTime() - r.checkInOffsetDays * 24 * 60 * 60 * 1000)
      : null;

    const task = await prisma.task.create({
      data: {
        title: r.title,
        brief: r.brief,
        definitionOfDone: r.definitionOfDone,
        assigneeId: r.assigneeId,
        assignerId: r.assignerId,
        dueDate: occurrence,
        checkInAt,
        estimatedMinutes: r.estimatedMinutes,
        recurringTaskId: r.id,
      },
      select: { id: true, title: true, brief: true, definitionOfDone: true, dueDate: true, checkInAt: true, estimatedMinutes: true },
    });

    await prisma.recurringTask.update({
      where: { id: r.id },
      data: { lastGeneratedFor: occurrence },
    });

    generated.push({ rhythm: r.title, taskId: task.id, dueDate: occurrence.toISOString() });

    if (r.assigneeId !== r.assignerId) {
      emailTaskAssigned({
        assigneeEmail: r.assignee.email,
        assigneeName: r.assignee.name,
        assignerName: r.assigner.name,
        title: task.title,
        brief: task.brief,
        definitionOfDone: task.definitionOfDone,
        dueDate: task.dueDate,
        checkInAt: task.checkInAt,
        estimatedMinutes: task.estimatedMinutes,
        taskId: task.id,
      }).catch((err) => console.error(`[rhythm] assignment email failed for ${task.id}:`, err));
    }
  }

  return Response.json({
    ok: true,
    ranAt: now.toISOString(),
    rhythmsChecked: rhythms.length,
    generated,
    skipped,
  });
}
