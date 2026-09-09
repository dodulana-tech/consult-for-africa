/**
 * Restore the "CadreHealth Go-to-Market and Growth" engagement
 * (id cmo5we2u200012u3fm7an8kfx, code C4A-2026-002).
 *
 * On 2026-08-17 the Medbury setup script upserted by engagementCode and
 * overwrote this row's scalar fields, repointing it at Medbury. Child records
 * were untouched: 16 milestones, 12 deliverables, 6 phases, 1 update all
 * survived and are still attached to this id.
 *
 * Recovered from evidence, not guessed:
 *   clientId       Consult For Africa
 *   name           from the surviving EngagementUpdate ("Project created: ...")
 *   startDate      first surviving phase start, 2026-07-08T23:00:00.000Z
 *   endDate        last surviving phase end, 2026-09-27T23:00:00.000Z ("90-day sprint")
 *   managerId      createdById on the surviving EngagementUpdate
 *
 * Reconstructed to match the sibling internal-product engagement
 * (C4A-2026-003 Maarova Go-to-Market and Growth), so these may differ from
 * what was there before: description, serviceType, budgetAmount, healthScore,
 * riskLevel, notes.
 *
 * Supabase point-in-time recovery to just before 2026-08-17T16:34Z would give
 * an exact restore of the original field values and is the better option if
 * available on the plan. Running this script does not prevent that.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/restore-cadrehealth-engagement.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ENGAGEMENT_ID = "cmo5we2u200012u3fm7an8kfx";
const CFA_CLIENT_NAME = "Consult For Africa";
const MANAGER_ID = "cmmui72wm0001z5kx5ijbhrx9";

async function main() {
  const cfa = await prisma.client.findFirst({ where: { name: CFA_CLIENT_NAME } });
  if (!cfa) throw new Error(`No client "${CFA_CLIENT_NAME}".`);

  const restored = await prisma.engagement.update({
    where: { id: ENGAGEMENT_ID },
    data: {
      clientId: cfa.id,
      engagementManagerId: MANAGER_ID,
      name: "CadreHealth Go-to-Market and Growth",
      description:
        "Go-to-market execution for CadreHealth, the healthcare workforce platform. Covers professional " +
        "registration and review acquisition, NMA state chapter partnerships, published workforce data " +
        "reports and content, and the recruitment-service pipeline. 90-day sprint to critical mass: " +
        "500 reviews and 2,000 registered professionals.",
      serviceType: "DIGITAL_HEALTH",
      engagementType: "PROJECT",
      startDate: new Date("2026-07-08T23:00:00.000Z"),
      endDate: new Date("2026-09-27T23:00:00.000Z"),
      status: "ACTIVE",
      budgetAmount: 0,
      budgetCurrency: "NGN",
      healthScore: 5,
      riskLevel: "MEDIUM",
      engagementCode: "C4A-2026-002",
      notes:
        "Internal CFA product. Record restored 17 August 2026 after an overwrite; description, " +
        "budget, health score and risk level are reconstructed from the sibling Maarova engagement " +
        "and may differ from the originals. Dates, name, client and manager are recovered from " +
        "surviving child records.",
    },
    include: {
      client: { select: { name: true } },
      _count: { select: { milestones: true, deliverables: true, phases: true, invoices: true } },
    },
  });

  console.log(`Restored ${restored.engagementCode}  ${restored.name}`);
  console.log(`  client      ${restored.client.name}`);
  console.log(`  dates       ${restored.startDate.toISOString().slice(0, 10)} to ${restored.endDate?.toISOString().slice(0, 10)}`);
  console.log(`  children    ${restored._count.milestones} milestones, ${restored._count.deliverables} deliverables, ${restored._count.phases} phases`);
  console.log(`  invoices    ${restored._count.invoices}`);
  if (restored._count.invoices > 0) {
    console.log("  WARNING: an invoice is still attached to this engagement. Expected 0.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
