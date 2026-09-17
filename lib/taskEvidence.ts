import { prisma } from "@/lib/prisma";

/**
 * What actually changed in the section a task points at, since the task was
 * given out.
 *
 * The reviewer should not have to take "done" on trust. The first inventory
 * count came back submitted, at ten minutes against a three hour estimate, with
 * zero assets and zero stock items in the database. Nothing in the product said
 * so, and the person reviewing it would have had to go and look.
 *
 * This is not a pass or fail. It is the one fact the reviewer would otherwise
 * have to go and find, put next to the claim.
 */
export interface TaskEvidence {
  /** What we counted, in words the reviewer can act on. */
  summary: string;
  /** True when the section shows no sign of the work at all. */
  empty: boolean;
}

export async function evidenceFor(task: {
  linkedEntityType: string | null;
  createdAt: Date;
  assigneeId: string;
}): Promise<TaskEvidence | null> {
  const type = task.linkedEntityType?.toUpperCase();
  if (!type) return null;
  const since = task.createdAt;
  const by = task.assigneeId;

  switch (type) {
    case "INVENTORY": {
      const [assets, stock] = await Promise.all([
        prisma.asset.count({ where: { createdAt: { gte: since } } }),
        prisma.stockItem.count({ where: { createdAt: { gte: since } } }),
      ]);
      const total = assets + stock;
      return {
        empty: total === 0,
        summary:
          total === 0
            ? "Nothing has been added to the asset register or the stock list since this task was given out."
            : `${assets} asset${assets === 1 ? "" : "s"} and ${stock} stock item${stock === 1 ? "" : "s"} added since this task was given out.`,
      };
    }
    case "COMMITMENT": {
      const n = await prisma.commitment.count({ where: { recordedById: by, createdAt: { gte: since } } });
      return {
        empty: n === 0,
        summary: n === 0
          ? "No commitments have been recorded since this task was given out."
          : `${n} commitment${n === 1 ? "" : "s"} recorded since this task was given out.`,
      };
    }
    case "DECISION": {
      const n = await prisma.decision.count({ where: { raisedById: by, createdAt: { gte: since } } });
      return {
        empty: n === 0,
        summary: n === 0
          ? "No decisions have been raised since this task was given out."
          : `${n} decision${n === 1 ? "" : "s"} raised since this task was given out.`,
      };
    }
    case "MEETING": {
      // Minutes live in the meeting's description, so a meeting that has been
      // written up is one that has one.
      const [organised, written] = await Promise.all([
        prisma.meeting.count({ where: { organizerId: by, createdAt: { gte: since } } }),
        prisma.meeting.count({
          where: { updatedAt: { gte: since }, description: { not: null }, status: "COMPLETED" },
        }),
      ]);
      return {
        empty: organised + written === 0,
        summary: organised + written === 0
          ? "No meetings have been scheduled or written up since this task was given out."
          : `${organised} meeting${organised === 1 ? "" : "s"} scheduled and ${written} written up since this task was given out.`,
      };
    }
    case "PIPELINE":
    case "LEAD": {
      const n = await prisma.lead.count({ where: { createdAt: { gte: since } } });
      return {
        empty: n === 0,
        summary: n === 0
          ? "No leads have been added since this task was given out."
          : `${n} lead${n === 1 ? "" : "s"} added since this task was given out.`,
      };
    }
    case "COMMUNICATION": {
      const n = await prisma.communication.count({ where: { loggedById: by, createdAt: { gte: since } } });
      return {
        empty: n === 0,
        summary: n === 0
          ? "No communications have been logged since this task was given out."
          : `${n} communication${n === 1 ? "" : "s"} logged since this task was given out.`,
      };
    }
    default:
      return null;
  }
}
