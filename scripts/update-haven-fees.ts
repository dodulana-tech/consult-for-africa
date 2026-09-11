/**
 * Non-destructive fee update for the live Haven Paediatric Centre engagement.
 *
 * Reflects the negotiated outcome (27 June 2026 meeting): core engagement
 * fee reduced from N10,200,000 to N9,300,000, with the diagnostic audit at
 * N1,800,000 (was N2,100,000) and the N7,500,000 balance over 5 equal
 * monthly instalments of N1,500,000.
 *
 * Updates in place (no deletes): engagement budget + pricing notes, the four
 * core track budgets, and the six payment milestones. The optional board
 * oversight retainer (track 5 / retainerMonthlyFee N600,000) is unchanged.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/update-haven-fees.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLIENT_NAME = "Haven Paediatric Centre";

// negotiated allocation of the N9.3M (audit fixed at N1.8M; N7.5M across 2-4)
const TRACK_BUDGET: Record<number, number> = {
  1: 1_800_000, // Diagnostic audit
  2: 2_800_000, // Culture, incentives & standards
  3: 2_200_000, // Process reengineering & operations
  4: 2_500_000, // Revenue & growth optimisation
};

const PRICING_NOTES =
  "NEGOTIATED FEE (agreed at 27 June 2026 meeting): N9,300,000 total core engagement " +
  "(standard CFA rate N17,000,000; concession N7,700,000 shown in full).\n" +
  "  Workstream 1  Diagnostic audit:                 N1,800,000\n" +
  "  Workstreams 2-4 (culture, process, growth):     N7,500,000\n" +
  "Payment: mobilisation N1,800,000 (diagnostic audit) on signing, then balance N7,500,000 " +
  "over 5 equal monthly instalments of N1,500,000.\n" +
  "Optional ongoing board-oversight retainer (track 5) unchanged: N600,000/month " +
  "(standard N1,000,000), opt-in.\n" +
  "Clean fixed-fee + retainer only. No success fee, to keep related-party optics clean.\n" +
  "Track 2-4 split is CFA's internal allocation of the N7.5M balance; total is the agreed figure.";

async function main() {
  console.log(`Updating fees on live "${CLIENT_NAME}" engagement (in place)...\n`);

  const client = await prisma.client.findFirst({ where: { name: CLIENT_NAME } });
  if (!client) {
    console.error(`No client named "${CLIENT_NAME}" found.`);
    return;
  }

  const engagements = await prisma.engagement.findMany({
    where: { clientId: client.id },
    select: { id: true },
  });

  for (const eng of engagements) {
    await prisma.engagement.update({
      where: { id: eng.id },
      data: { budgetAmount: 9_300_000, pricingNotes: PRICING_NOTES },
    });
    console.log(`✓ Engagement ${eng.id}: budgetAmount -> N9,300,000, pricingNotes updated.`);

    // tracks 1-4 budgets
    const tracks = await prisma.engagementTrack.findMany({
      where: { engagementId: eng.id },
      select: { id: true, order: true, name: true, budgetAmount: true },
    });
    for (const tr of tracks) {
      const newBudget = TRACK_BUDGET[tr.order];
      if (newBudget != null) {
        await prisma.engagementTrack.update({ where: { id: tr.id }, data: { budgetAmount: newBudget } });
        console.log(`  ✓ Track ${tr.order} (${tr.name}): N${newBudget.toLocaleString()}`);
      }
    }

    // payment milestones: mobilisation -> 1.8M, instalments -> 1.5M
    const pms = await prisma.paymentMilestone.findMany({
      where: { engagementId: eng.id },
      select: { id: true, name: true, amount: true },
    });
    for (const pm of pms) {
      const isMobilisation = /mobilis/i.test(pm.name);
      const isInstalment = /instal?lment/i.test(pm.name);
      if (isMobilisation) {
        await prisma.paymentMilestone.update({ where: { id: pm.id }, data: { amount: 1_800_000 } });
        console.log(`  ✓ Payment "${pm.name}": N1,800,000`);
      } else if (isInstalment) {
        await prisma.paymentMilestone.update({ where: { id: pm.id }, data: { amount: 1_500_000 } });
        console.log(`  ✓ Payment "${pm.name}": N1,500,000`);
      }
    }
  }

  // ── Read-back ───────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  const v = await prisma.engagement.findFirst({
    where: { clientId: client.id },
    select: {
      budgetAmount: true,
      tracks: { select: { order: true, budgetAmount: true }, orderBy: { order: "asc" } },
      paymentMilestones: { select: { name: true, amount: true, dueDate: true }, orderBy: { dueDate: "asc" } },
    },
  });
  console.log("Engagement budgetAmount:", "N" + Number(v?.budgetAmount).toLocaleString());
  const trackSum = (v?.tracks ?? []).reduce((s, t) => s + Number(t.budgetAmount ?? 0), 0);
  console.log("Tracks 1-4:", (v?.tracks ?? []).map((t) => `T${t.order}=N${Number(t.budgetAmount ?? 0).toLocaleString()}`).join("  "), `(sum N${trackSum.toLocaleString()})`);
  const paySum = (v?.paymentMilestones ?? []).reduce((s, p) => s + Number(p.amount), 0);
  console.log("Payment schedule:");
  for (const p of v?.paymentMilestones ?? []) {
    console.log(`  ${p.dueDate?.toISOString().slice(0, 10)}  N${Number(p.amount).toLocaleString().padStart(11)}  ${p.name}`);
  }
  console.log("Payment total:", "N" + paySum.toLocaleString(), paySum === 9_300_000 ? "✓ reconciles to N9,300,000" : "!! does not reconcile");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
