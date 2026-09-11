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
 * One line per event. Failures are never silent: a status of FAILED or PARTIAL
 * is called out, and so is a database that stops answering, because a quiet
 * watcher and a quiet webhook look identical from the outside.
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
  let consecutiveErrors = 0;
  let warnedAboutErrors = false;

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

      if (consecutiveErrors > 0 && warnedAboutErrors) {
        console.log("database is answering again, watch resumed");
        warnedAboutErrors = false;
      }
      consecutiveErrors = 0;

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
    } catch (err) {
      consecutiveErrors++;
      // Speak up once rather than every cycle, but do speak up: silence here
      // would be indistinguishable from no payments arriving.
      if (consecutiveErrors === 3 && !warnedAboutErrors) {
        warnedAboutErrors = true;
        console.log(
          `WATCH DEGRADED: cannot read PaystackWebhookEvent (${err instanceof Error ? err.message.slice(0, 160) : "unknown"})`
        );
      }
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
