/**
 * Watch PaystackWebhookEvent and print a line for every new event.
 *
 * Pairs with scripts/replay-paystack-events.ts: that one fixes what failed,
 * this one tells you something arrived at all. Useful right after pointing the
 * Paystack dashboard at a new webhook URL, when the question is simply whether
 * events are landing and where they are being routed.
 *
 *   npx tsx --env-file=.env.local scripts/watch-paystack-events.ts
 *   npx tsx --env-file=.env.local scripts/watch-paystack-events.ts --since-start
 *
 * By default it reports every row in the table, then everything new. Pass
 * --since-start to ignore history and report only what arrives from now on.
 *
 * One line per event, carrying its status, so a FAILED or PARTIAL routing is
 * visible as it happens.
 *
 * Connectivity trouble is reported as nothing at all. That is deliberate, and
 * it is a trade: a watch that has quietly died looks exactly like a quiet
 * webhook. Confirm independently when it matters, by querying the table or by
 * checking /api/health in production.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const POLL_MS = 20_000;
const BURST_LIMIT = 10;

function line(r: {
  createdAt: Date;
  status: string;
  eventType: string;
  product: string | null;
  reference: string | null;
  attempts: number;
  handledInternally: boolean;
  lastError: string | null;
}) {
  const time = r.createdAt.toISOString().slice(11, 19);
  const where =
    r.product === "internal"
      ? "handled here"
      : r.product
        ? `forwarded to ${r.product}`
        : r.handledInternally
          ? "handled here, no owner named"
          : "no owner named";
  const err = r.lastError ? `  ERROR: ${r.lastError.slice(0, 160)}` : "";
  const attempts = r.attempts > 1 ? ` attempt ${r.attempts}` : "";
  return `${time}  ${r.status.padEnd(9)} ${r.eventType.padEnd(20)} ${where}  ref=${r.reference ?? "-"}${attempts}${err}`;
}

async function main() {
  const sinceStart = process.argv.includes("--since-start");
  let cursor = sinceStart ? new Date() : new Date(0);

  console.log(
    `watching PaystackWebhookEvent${sinceStart ? " for new events" : ", including anything already recorded"}`
  );

  for (;;) {
    try {
      const rows = await prisma.paystackWebhookEvent.findMany({
        where: { createdAt: { gt: cursor } },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          createdAt: true,
          status: true,
          eventType: true,
          product: true,
          reference: true,
          attempts: true,
          handledInternally: true,
          lastError: true,
        },
      });

      if (rows.length > BURST_LIMIT) {
        // Do not turn a busy minute into a wall of notifications.
        const bad = rows.filter((r) => r.status === "FAILED" || r.status === "PARTIAL");
        console.log(
          `${rows.length} events arrived. ${rows.length - bad.length} fine, ${bad.length} needing attention.`
        );
        for (const r of bad.slice(0, BURST_LIMIT)) console.log(line(r));
      } else {
        for (const r of rows) console.log(line(r));
      }

      if (rows.length) cursor = rows[rows.length - 1].createdAt;

      // Hand the connection back between polls rather than holding one idle
      // across the sleep, matching how the serverless webhook talks to the
      // same pooler. This did not cure the dropouts seen from one machine, so
      // do not read it as the fix for those; it is just the better manners.
      await prisma.$disconnect().catch(() => {});
    } catch {
      // Deliberately silent. This machine's connectivity drops for minutes at
      // a time while production reaches the same database in 25ms, so
      // reporting it would describe the local network rather than anything
      // about payments. Nothing is lost by staying quiet: the cursor only
      // moves on a successful read, so events written during an outage are
      // picked up on the next one that works.
      //
      // The cost of this choice, chosen knowingly: if the watch dies for a
      // real reason, it dies quietly, and silence looks the same as no
      // payments arriving. Confirm independently when it matters, either by
      // querying the table directly or via /api/health in production.
      await prisma.$disconnect().catch(() => {});
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
