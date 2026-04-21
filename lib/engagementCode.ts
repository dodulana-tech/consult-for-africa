import { prisma } from "@/lib/prisma";

/**
 * Generates engagement codes in C4A-YYYY-NNN format.
 * Queries the latest code for the current year and increments the sequence.
 * If no existing codes for this year, starts at 001.
 */
export async function generateEngagementCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C4A-${year}-`;

  // Find the latest engagement code for this year
  const latest = await prisma.engagement.findFirst({
    where: {
      engagementCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      engagementCode: "desc",
    },
    select: {
      engagementCode: true,
    },
  });

  let sequence = 1;

  if (latest?.engagementCode) {
    const parts = latest.engagementCode.split("-");
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  const padded = String(sequence).padStart(3, "0");
  return `${prefix}${padded}`;
}
