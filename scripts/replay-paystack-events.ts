/**
 * Replay Paystack webhook events that did not land.
 *
 * Every event the account receives is recorded by /api/paystack/webhook before
 * anything is done with it, so a downstream outage or a bug in a handler costs
 * a retry rather than the event itself. This replays the ones still marked
 * FAILED, PARTIAL or PENDING, using the stored raw body and signature so the
 * receiving side verifies exactly what Paystack originally sent.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/replay-paystack-events.ts                # list what would be replayed
 *   npx tsx --env-file=.env.local scripts/replay-paystack-events.ts --apply
 *   npx tsx --env-file=.env.local scripts/replay-paystack-events.ts --apply --id <eventId>
 *   npx tsx --env-file=.env.local scripts/replay-paystack-events.ts --apply --unrouted
 *
 * --unrouted also picks up events that matched no product, which is what you
 * want after adding a product to PAYSTACK_FORWARD_TARGETS.
 */
import { PrismaClient } from "@prisma/client";
import { routeEvent } from "@/lib/paystack/router";
import type { PaystackEvent } from "@/lib/paystack/handlers";

const prisma = new PrismaClient();

function parseFlags() {
  const args = process.argv.slice(2);
  const idIdx = args.indexOf("--id");
  return {
    apply: args.includes("--apply"),
    unrouted: args.includes("--unrouted"),
    id: idIdx >= 0 ? args[idIdx + 1] : null,
    limit: 200,
  };
}

async function main() {
  const { apply, unrouted, id, limit } = parseFlags();

  const statuses = ["FAILED", "PARTIAL", "PENDING"];
  if (unrouted) statuses.push("UNROUTED");

  const events = await prisma.paystackWebhookEvent.findMany({
    where: id ? { id } : { status: { in: statuses } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (events.length === 0) {
    console.log("Nothing to replay.");
    return;
  }

  console.log(
    `${events.length} event(s) to replay${apply ? "" : ". DRY RUN, add --apply to send them."}\n`
  );

  for (const e of events) {
    const label = `${e.eventType} ref=${e.reference ?? "-"} status=${e.status} attempts=${e.attempts}`;
    if (!apply) {
      console.log(`  ${label}`);
      continue;
    }

    let parsed: PaystackEvent;
    try {
      parsed = JSON.parse(e.rawBody);
    } catch {
      console.log(`  SKIP  ${label}  (stored body is not valid JSON)`);
      continue;
    }

    const outcome = await routeEvent(parsed, e.rawBody, e.signature);

    await prisma.paystackWebhookEvent.update({
      where: { id: e.id },
      data: {
        product: outcome.product,
        status: outcome.status,
        handledInternally: outcome.handledInternally,
        forwardResults: outcome.forwardResults.length
          ? JSON.parse(JSON.stringify(outcome.forwardResults))
          : undefined,
        lastError: outcome.error?.slice(0, 2000) ?? null,
        attempts: { increment: 1 },
      },
    });

    console.log(`  ${outcome.status.padEnd(9)} ${label}${outcome.error ? `  ${outcome.error}` : ""}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
