/**
 * Non-destructive update of the Haven payment schedule: 5 instalments -> 3.
 *
 * New structure (negotiated, less admin overhead):
 *   Mobilisation (Diagnostic Audit), on acceptance:  N1,800,000
 *   Instalment 1 of 3, 31 Jul 2026:                  N2,500,000
 *   Instalment 2 of 3, 31 Aug 2026:                  N2,500,000
 *   Instalment 3 of 3, 30 Sep 2026:                  N2,500,000
 *   Total:                                           N9,300,000
 *
 * Updates instalments 1-3 in place, deletes the two surplus milestones
 * (4 of 5, 5 of 5), and refreshes pricingNotes. Mobilisation unchanged.
 *
 * Usage: npx ts-node --transpile-only scripts/update-haven-schedule.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CLIENT_NAME = "Haven Paediatric Centre";

const NEW_INSTALMENTS: Record<string, { name: string; amount: number; dueDate: Date }> = {
  "1 of 5": { name: "Monthly instalment 1 of 3", amount: 2_500_000, dueDate: new Date("2026-07-31") },
  "2 of 5": { name: "Monthly instalment 2 of 3", amount: 2_500_000, dueDate: new Date("2026-08-31") },
  "3 of 5": { name: "Monthly instalment 3 of 3", amount: 2_500_000, dueDate: new Date("2026-09-30") },
};

const PRICING_NOTES =
  "NEGOTIATED FEE (agreed at 27 June 2026 meeting): N9,300,000 total core engagement " +
  "(standard CFA rate N17,000,000; concession N7,700,000 shown in full).\n" +
  "  Workstream 1  Diagnostic audit:                 N1,800,000\n" +
  "  Workstreams 2-4 (culture, process, growth):     N7,500,000\n" +
  "Payment (3 instalments, to reduce admin overhead): mobilisation N1,800,000 (diagnostic audit) on " +
  "acceptance, then balance N7,500,000 over 3 equal monthly instalments of N2,500,000 (Jul/Aug/Sep 2026).\n" +
  "Optional ongoing board-oversight retainer (track 5) unchanged: N600,000/month " +
  "(standard N1,000,000), opt-in.\n" +
  "Clean fixed-fee + retainer only. No success fee, to keep related-party optics clean.\n" +
  "Invoice CFA-HAV-2026-001 issued 30 June 2026.";

async function main() {
  const client = await prisma.client.findFirst({ where: { name: CLIENT_NAME } });
  if (!client) {
    console.error(`No client "${CLIENT_NAME}".`);
    return;
  }
  const engagements = await prisma.engagement.findMany({
    where: { clientId: client.id },
    select: { id: true },
  });

  for (const eng of engagements) {
    await prisma.engagement.update({ where: { id: eng.id }, data: { pricingNotes: PRICING_NOTES } });

    const pms = await prisma.paymentMilestone.findMany({
      where: { engagementId: eng.id },
      select: { id: true, name: true },
    });
    for (const pm of pms) {
      const key = Object.keys(NEW_INSTALMENTS).find((k) => pm.name.includes(k));
      if (key) {
        const u = NEW_INSTALMENTS[key];
        await prisma.paymentMilestone.update({ where: { id: pm.id }, data: u });
        console.log(`✓ "${pm.name}" -> "${u.name}" N${u.amount.toLocaleString()} (${u.dueDate.toISOString().slice(0, 10)})`);
      } else if (/4 of 5|5 of 5/.test(pm.name)) {
        await prisma.paymentMilestone.delete({ where: { id: pm.id } });
        console.log(`✗ deleted surplus milestone "${pm.name}"`);
      }
    }
  }

  // read-back
  const v = await prisma.engagement.findFirst({
    where: { clientId: client.id },
    select: { paymentMilestones: { select: { name: true, amount: true, dueDate: true }, orderBy: { dueDate: "asc" } } },
  });
  console.log("\n" + "=".repeat(56));
  let sum = 0;
  for (const p of v?.paymentMilestones ?? []) {
    sum += Number(p.amount);
    console.log(`  ${p.dueDate?.toISOString().slice(0, 10)}  N${Number(p.amount).toLocaleString().padStart(10)}  ${p.name}`);
  }
  console.log(`  Total: N${sum.toLocaleString()}`, sum === 9_300_000 ? "✓" : "!! mismatch");
  console.log("=".repeat(56));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
