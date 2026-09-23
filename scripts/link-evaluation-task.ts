/**
 * Point the monthly evaluation at the rotation it is an evaluation of.
 *
 * The task said "an evaluation recorded against the open rotation" and offered
 * no way to reach one, so the brief described work the assignee could not get
 * to. The link mechanism already existed (taskUi.ts LINKED_SECTIONS, built from
 * Abigail's own feedback that a task should lead to its section); this template
 * simply never carried one.
 *
 * Sets it on the recurring template so every future occurrence inherits it, and
 * on any occurrence already open so the one on the desk today works.
 *
 *   npx tsx --env-file=.env.local scripts/link-evaluation-task.ts
 */

import { prisma } from "../lib/prisma";

const TITLE = "Monthly evaluation, Office of the Founding Partner";
const TYPE = "INTERN_ROTATION";

async function main() {
  // The rotation the evaluation is actually about. If more than one is open we
  // link the section rather than guessing which person is meant.
  const open = await prisma.internRotation.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, intern: { select: { name: true } } },
  });
  const rotationId = open.length === 1 ? open[0].id : null;
  console.log(
    open.length === 1
      ? `Open rotation: ${open[0].intern.name} (${rotationId})`
      : `${open.length} open rotations, linking the section rather than one of them`
  );

  const tmpl = await prisma.recurringTask.updateMany({
    where: { title: TITLE },
    data: { linkedEntityType: TYPE, linkedEntityId: rotationId },
  });
  console.log(`Recurring template updated: ${tmpl.count}`);

  // Occurrences already on a desk. Done and cancelled ones are history and are
  // left exactly as they were.
  const live = await prisma.task.updateMany({
    where: { title: TITLE, status: { notIn: ["DONE", "CANCELLED"] } },
    data: { linkedEntityType: TYPE, linkedEntityId: rotationId },
  });
  console.log(`Open tasks updated: ${live.count}`);

  await prisma.$disconnect();
}

main();
