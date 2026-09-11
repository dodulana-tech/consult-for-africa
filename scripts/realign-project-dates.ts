/**
 * Refresh the platform: realign all project (Engagement) due dates and deadlines
 * so nothing shows as overdue, stale, or "ending soon", and every project reads
 * as freshly active. New joiners should not open the dashboard to a wall of red.
 *
 * What it does, per engagement (EXCEPT the House of Refuge client and any
 * COMPLETED / CANCELLED engagement):
 *   - startDate  -> today minus 7 days (recently started, active)
 *   - endDate    -> newStart + max(original duration, 90 days)  (healthy runway)
 *   - every planned child date (milestone.dueDate, deliverable.dueDate,
 *     phase.startDate/endDate, paymentMilestone.dueDate) is remapped
 *     PROPORTIONALLY into the future window [today+3 .. newEnd], so ordering and
 *     spacing are preserved and nothing lands in the past.
 * Historical/actual timestamps (completionDate, submittedAt, approvedAt,
 * reviewedAt, paidDate, completedAt) are left untouched.
 *
 * Updating each engagement row also refreshes its updatedAt, which clears the
 * "has been quiet" nudges.
 *
 * SAFE: dry-run by default (prints the plan, writes nothing). Pass --apply to
 * write, which first dumps every original value to a timestamped backup JSON so
 * the change is fully reversible.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/realign-project-dates.ts            # dry-run
 *   npx ts-node --transpile-only scripts/realign-project-dates.ts --apply    # apply
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// ── minimal .env loader (DATABASE_URL may live in .env or .env.local) ──
for (const f of [".env", ".env.local"]) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");
const EXCLUDE_CLIENT_MATCH = "house of refuge"; // case-insensitive contains
const SKIP_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

const DAY = 24 * 60 * 60 * 1000;
const BACKDATE_START_DAYS = 7;   // start reads as a week ago
const MIN_DURATION_DAYS = 90;    // guarantees > 14d runway (clears "ending soon")
const CHILD_LEAD_DAYS = 3;       // earliest child date is today + 3 (never overdue)

const today = new Date();
const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function fmt(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "—";
}

async function main() {
  const engagements = await prisma.engagement.findMany({
    include: {
      client: { select: { name: true } },
      milestones: { select: { id: true, dueDate: true, name: true } },
      deliverables: { select: { id: true, dueDate: true } },
      phases: { select: { id: true, startDate: true, endDate: true } },
      paymentMilestones: { select: { id: true, dueDate: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const backup: any[] = [];
  const planLines: string[] = [];
  let realigned = 0, skipped = 0, msCount = 0, delCount = 0, phCount = 0, payCount = 0;

  // writes batched into one transaction on --apply
  const ops: any[] = [];

  for (const e of engagements) {
    const clientName = e.client?.name ?? "";
    const isExcluded =
      clientName.toLowerCase().includes(EXCLUDE_CLIENT_MATCH) ||
      e.name.toLowerCase().includes(EXCLUDE_CLIENT_MATCH);
    const isTerminal = SKIP_STATUSES.has(e.status);

    if (isExcluded || isTerminal) {
      skipped++;
      planLines.push(
        `  SKIP  ${clientName} — ${e.name}  [${e.status}]${isExcluded ? "  (House of Refuge, excluded)" : ""}`
      );
      continue;
    }

    const oldStart = e.startDate;
    // effective old end: endDate, else the latest child date, else start + min duration
    const childDates: number[] = [
      ...e.milestones.map((m) => m.dueDate?.getTime()),
      ...e.deliverables.map((d) => d.dueDate?.getTime()),
      ...e.phases.flatMap((p) => [p.startDate?.getTime(), p.endDate?.getTime()]),
      ...e.paymentMilestones.map((p) => p.dueDate?.getTime()),
    ].filter((t): t is number => typeof t === "number");

    let oldEndMs = e.endDate ? e.endDate.getTime() : (childDates.length ? Math.max(...childDates) : oldStart.getTime() + MIN_DURATION_DAYS * DAY);
    if (oldEndMs <= oldStart.getTime()) oldEndMs = oldStart.getTime() + MIN_DURATION_DAYS * DAY;
    const oldSpan = oldEndMs - oldStart.getTime();

    const durationDays = Math.max(oldSpan / DAY, MIN_DURATION_DAYS);
    const newStart = new Date(startOfToday.getTime() - BACKDATE_START_DAYS * DAY);
    const newEnd = new Date(newStart.getTime() + durationDays * DAY);
    const childWinStart = startOfToday.getTime() + CHILD_LEAD_DAYS * DAY;
    const childWinEnd = newEnd.getTime();

    const remap = (d: Date): Date => {
      const frac = clamp((d.getTime() - oldStart.getTime()) / oldSpan, 0, 1);
      return new Date(Math.round(childWinStart + frac * (childWinEnd - childWinStart)));
    };

    // record backup
    backup.push({
      engagementId: e.id,
      client: clientName,
      name: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      milestones: e.milestones.map((m) => ({ id: m.id, dueDate: m.dueDate })),
      deliverables: e.deliverables.map((d) => ({ id: d.id, dueDate: d.dueDate })),
      phases: e.phases.map((p) => ({ id: p.id, startDate: p.startDate, endDate: p.endDate })),
      paymentMilestones: e.paymentMilestones.map((p) => ({ id: p.id, dueDate: p.dueDate })),
    });

    // engagement dates
    ops.push(prisma.engagement.update({ where: { id: e.id }, data: { startDate: newStart, endDate: newEnd } }));

    for (const m of e.milestones) {
      if (!m.dueDate) continue;
      ops.push(prisma.milestone.update({ where: { id: m.id }, data: { dueDate: remap(m.dueDate) } }));
      msCount++;
    }
    for (const d of e.deliverables) {
      if (!d.dueDate) continue;
      ops.push(prisma.deliverable.update({ where: { id: d.id }, data: { dueDate: remap(d.dueDate) } }));
      delCount++;
    }
    for (const p of e.phases) {
      const data: any = {};
      if (p.startDate) data.startDate = remap(p.startDate);
      if (p.endDate) data.endDate = remap(p.endDate);
      if (Object.keys(data).length) {
        ops.push(prisma.engagementPhase.update({ where: { id: p.id }, data }));
        phCount++;
      }
    }
    for (const p of e.paymentMilestones) {
      if (!p.dueDate) continue;
      ops.push(prisma.paymentMilestone.update({ where: { id: p.id }, data: { dueDate: remap(p.dueDate) } }));
      payCount++;
    }

    realigned++;
    planLines.push(
      `  MOVE  ${clientName} — ${e.name}  [${e.status}]\n` +
      `        start ${fmt(e.startDate)} -> ${fmt(newStart)}   end ${fmt(e.endDate)} -> ${fmt(newEnd)}` +
      `   (ms ${e.milestones.length}, del ${e.deliverables.filter((d) => d.dueDate).length}, ph ${e.phases.length}, pay ${e.paymentMilestones.length})`
    );
  }

  console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} — realign project dates (anchor: ${fmt(startOfToday)})\n`);
  console.log(planLines.join("\n"));
  console.log(
    `\nSummary: ${realigned} engagements to realign, ${skipped} skipped (House of Refuge + completed/cancelled).` +
    `\n  milestones ${msCount}, deliverables ${delCount}, phases ${phCount}, payment-milestones ${payCount}.`
  );

  if (!APPLY) {
    console.log(`\nDry run only. No changes written. Re-run with --apply to commit.\n`);
    return;
  }

  // backup before writing
  const backupPath = path.resolve(process.cwd(), `realign-backup-${startOfToday.toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`\nBackup of original dates written to ${backupPath}`);

  await prisma.$transaction(ops);
  console.log(`\n✓ Applied ${ops.length} updates across ${realigned} engagements.\n`);
}

main()
  .catch((e) => {
    console.error("✗ Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
