/**
 * Seeds the Office of the Founding Partner with a starting cadence, Abigail's
 * intern rotation, and her first week of work.
 *
 * Writes through Prisma directly rather than the API, deliberately: creating a
 * task through /api/tasks emails the assignee, and these are drafts for Debo to
 * edit before she ever sees them. Nothing here sends.
 *
 *   npx tsx --env-file=.env.local scripts/seed-office.ts
 */
import { PrismaClient, type RecurrenceCadence } from "@prisma/client";

const prisma = new PrismaClient();

const PRINCIPAL = "debo.odulana@consultforafrica.com";
const ASSISTANT = "abigail.ayomide04@gmail.com";

const RHYTHM: Array<{
  title: string; brief: string; definitionOfDone: string;
  cadence: RecurrenceCadence; dayOfWeek?: number; dayOfMonth?: number; monthOfYear?: number;
  leadTimeDays: number; checkInOffsetDays?: number; estimatedMinutes: number; toPrincipal?: boolean;
}> = [
  {
    title: "Partner meeting pack",
    brief:
      "The weekly partner meeting runs on Monday. This is the pack that makes it short. Without it the first twenty minutes go on working out where things stand, which is time eight people are paying for.",
    definitionOfDone:
      "One document in the shared folder holding: every active project and its status in one line, anything that slipped since last week, decisions needed from the partners, and the diary for the week ahead. Sent to attendees by Friday evening.",
    cadence: "WEEKLY", dayOfWeek: 1, leadTimeDays: 3, checkInOffsetDays: 1, estimatedMinutes: 90,
  },
  {
    title: "Follow-up sweep across the pipeline",
    brief:
      "Every lead, discovery call and proposal that has gone quiet needs a human to notice. Deals are not usually lost, they are dropped. This is the sweep that catches them.",
    definitionOfDone:
      "Every lead with no contact in fourteen days has either been chased or had a reason written on it. Every proposal sent more than a week ago has been followed up. Anything needing a partner rather than you is on the commitment register with a name against it.",
    cadence: "WEEKLY", dayOfWeek: 4, leadTimeDays: 1, estimatedMinutes: 60,
  },
  {
    title: "Invoice run",
    brief:
      "Invoices that go out late get paid late, and every week of delay is a week the firm is lending money to a client for free. This is the run that keeps that from happening by accident.",
    definitionOfDone:
      "Every engagement with billable work this month has an invoice raised and approved. Anything that cannot be invoiced has a written reason. The list of what went out is with the Founding Partner.",
    cadence: "MONTHLY", dayOfMonth: 1, leadTimeDays: 3, checkInOffsetDays: 1, estimatedMinutes: 120,
  },
  {
    title: "Overdue invoice chase",
    brief:
      "Mid month sweep of everything past its due date. Chasing money is uncomfortable and that is exactly why it needs to be a date in the calendar rather than a decision somebody makes each month.",
    definitionOfDone:
      "Every invoice past its due date has been chased this month, and the chase is recorded on the commitment register with the date the client promised to pay. Anything disputed has been escalated rather than chased again.",
    cadence: "MONTHLY", dayOfMonth: 15, leadTimeDays: 2, estimatedMinutes: 90,
  },
  {
    title: "Monthly evaluation, Office of the Founding Partner",
    brief:
      "The monthly review of the Administrative Assistant, through the intern evaluation structure that already exists. This sits with the Founding Partner only until the Executive Assistant hire lands, at which point it moves to her.",
    definitionOfDone:
      "An evaluation recorded against the open rotation with all five scores, at least one strength and one area for development written in specifics rather than adjectives, and a promotion recommendation where it is earned. The conversation happens before the form is filled, not after.",
    cadence: "MONTHLY", dayOfMonth: 28, leadTimeDays: 5, estimatedMinutes: 60, toPrincipal: true,
  },
];

const FIRST_WEEK: Array<{
  title: string; brief: string; definitionOfDone: string;
  dueInDays: number; checkInInDays?: number; estimatedMinutes: number;
}> = [
  {
    title: "Get set up and read how this office works",
    brief:
      "Before any real work, you need to be able to see the things the work happens in. Everything you are given will arrive on the task board with a brief like this one and a definition of done like the one below, so that you never have to guess what was meant.",
    definitionOfDone:
      "You have signed in and changed the temporary password. You have opened Tasks, Brief, Commitments, Decisions, Rhythm and Inventory once each so you know what lives where. You have replied to say which of the six you did not understand, and no is a perfectly good answer to all six in the first week.",
    dueInDays: 2, estimatedMinutes: 45,
  },
  {
    title: "Set up inbox triage and tell me the rules you chose",
    brief:
      "The inbox is the main thing slowing the office down. What matters is not that you clear it, but that anything urgent surfaces the same day and nothing else interrupts. The rules are yours to draft because you are the one who will work them.",
    definitionOfDone:
      "A written page of triage rules: what you answer yourself, what you flag, what you file, and what you escalate the same hour. Three real examples for each. Sent for review, not applied yet.",
    dueInDays: 5, checkInInDays: 2, estimatedMinutes: 120,
  },
  {
    title: "Write the minutes for the next meeting you sit in",
    brief:
      "Minutes are not a transcript. Their job is that somebody who was not there knows what was decided and who owes what by when. The last part is the part most minutes miss, and it is the part this office is built around.",
    definitionOfDone:
      "Minutes circulated within 24 hours of the meeting, in three sections: decisions taken, actions with a name and a date against each, and anything left open. Every action has also been added to the commitment register.",
    dueInDays: 7, checkInInDays: 4, estimatedMinutes: 60,
  },
  {
    title: "Start the commitment register from the last three meetings",
    brief:
      "A commitment is a promise somebody made, and it is usually owed by someone we cannot assign a task to, which is why it disappears. The register is how the office stops that. This is where it starts from nothing.",
    definitionOfDone:
      "Every action item from the last three meetings is on the register with what was promised, who owes it, and a date. Where no date was agreed, that is written rather than guessed. Anything already done is marked honoured rather than deleted.",
    dueInDays: 9, checkInInDays: 5, estimatedMinutes: 90,
  },
  {
    title: "First count of the office inventory",
    brief:
      "Nobody currently knows what the firm owns or who has it. A first count is worth more than a perfect one, because everything after this is a movement against a number we can defend.",
    definitionOfDone:
      "Every laptop, phone, monitor and piece of furniture is on the asset register with a tag, and anything out with a person is issued to them so the register shows who has it. Supplies are counted with a reorder level set on each. Anything you could not find is recorded as lost rather than left off.",
    dueInDays: 12, checkInInDays: 6, estimatedMinutes: 180,
  },
];

async function main() {
  const [principal, assistant] = await Promise.all([
    prisma.user.findUnique({ where: { email: PRINCIPAL }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { email: ASSISTANT }, select: { id: true, name: true } }),
  ]);
  if (!principal) throw new Error(`No user for ${PRINCIPAL}`);
  if (!assistant) throw new Error(`No user for ${ASSISTANT}`);

  // ── Operating rhythm ──────────────────────────────────────────────────────
  let rhythmsAdded = 0;
  for (const r of RHYTHM) {
    const exists = await prisma.recurringTask.findFirst({ where: { title: r.title }, select: { id: true } });
    if (exists) continue;
    await prisma.recurringTask.create({
      data: {
        title: r.title,
        brief: r.brief,
        definitionOfDone: r.definitionOfDone,
        assigneeId: r.toPrincipal ? principal.id : assistant.id,
        assignerId: principal.id,
        cadence: r.cadence,
        dayOfWeek: r.dayOfWeek ?? null,
        dayOfMonth: r.dayOfMonth ?? null,
        monthOfYear: r.monthOfYear ?? null,
        leadTimeDays: r.leadTimeDays,
        checkInOffsetDays: r.checkInOffsetDays ?? null,
        estimatedMinutes: r.estimatedMinutes,
      },
    });
    rhythmsAdded++;
  }

  // ── Intern cohort and rotation ────────────────────────────────────────────
  const start = new Date();
  const end = new Date(start.getTime());
  end.setMonth(end.getMonth() + 6);

  let cohort = await prisma.internCohort.findFirst({
    where: { name: "Office of the Founding Partner, 2026" },
    select: { id: true },
  });
  if (!cohort) {
    cohort = await prisma.internCohort.create({
      data: {
        name: "Office of the Founding Partner, 2026",
        track: "FELLOWSHIP",
        startDate: start,
        endDate: end,
        maxInterns: 3,
        status: "ACTIVE",
        description:
          "Non-consulting staff attached to the office of the Founding Partner. Monthly evaluation runs through the existing rotation structure so the review is not invented each time.",
      },
      select: { id: true },
    });
  }

  const existingRotation = await prisma.internRotation.findFirst({
    where: { cohortId: cohort.id, internId: assistant.id },
    select: { id: true },
  });
  if (!existingRotation) {
    await prisma.internRotation.create({
      data: {
        cohortId: cohort.id,
        internId: assistant.id,
        // Interim. Moves to the Executive Assistant the week that hire lands.
        supervisorId: principal.id,
        startDate: start,
        endDate: end,
        status: "ACTIVE",
        notes: "Supervisor is interim. Reassign to the Executive Assistant once that hire is made.",
      },
    });
  }

  // ── First week ────────────────────────────────────────────────────────────
  const day = 24 * 60 * 60 * 1000;
  let tasksAdded = 0;
  for (const t of FIRST_WEEK) {
    const exists = await prisma.task.findFirst({ where: { title: t.title, assigneeId: assistant.id }, select: { id: true } });
    if (exists) continue;
    await prisma.task.create({
      data: {
        title: t.title,
        brief: t.brief,
        definitionOfDone: t.definitionOfDone,
        assigneeId: assistant.id,
        assignerId: principal.id,
        dueDate: new Date(start.getTime() + t.dueInDays * day),
        checkInAt: t.checkInInDays ? new Date(start.getTime() + t.checkInInDays * day) : null,
        estimatedMinutes: t.estimatedMinutes,
      },
    });
    tasksAdded++;
  }

  console.log(`Principal: ${principal.name}`);
  console.log(`Assistant: ${assistant.name}`);
  console.log(`Rhythms added: ${rhythmsAdded} (total ${await prisma.recurringTask.count()})`);
  console.log(`Rotation: ${await prisma.internRotation.count({ where: { internId: assistant.id } })} for her, supervisor is the Founding Partner (interim)`);
  console.log(`Tasks added: ${tasksAdded} (on her desk: ${await prisma.task.count({ where: { assigneeId: assistant.id } })})`);
  console.log("No emails were sent.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
