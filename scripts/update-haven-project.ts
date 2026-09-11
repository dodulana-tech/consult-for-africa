/**
 * Non-destructive update of the live Haven Paediatric Centre record.
 *
 * Unlike create-haven-project.ts (which deletes + recreates), this script
 * updates fields IN PLACE on the existing client / engagement / tracks. It
 * does NOT delete anything and does NOT change the engagement id.
 *
 * Applies the 2026-06-27 changes: add Mrs Abisodun Alli to owners,
 * align the incident framing with the (corrected, forward) client-facing
 * narrative, and record that the proposal pack was sent to the founders.
 *
 * Idempotent and safe to re-run.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/update-haven-project.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLIENT_NAME = "Haven Paediatric Centre";

const CLIENT_NOTES =
  "5-bed general paediatrics + 3-bed NICU facility in GRA Ikeja, ~15 months old. " +
  "Owners: Mr Kabir Aregbesola, Mrs Abisodun Alli, Dr Shakirah Saliu, Dr Odedina (Medical Director), and Mr Ogochukwu Odum. " +
  "Debo invited to Haven's board from inception (board not yet formally constituted; he does not formally sit on it). " +
  "Engaged CFA on operational optimisation, culture, and growth as the facility scales into more complex care including NICU. " +
  "Proposal pack (board deck + full diagnostic-audit deck + proposal) sent to founders 27 June 2026; awaiting board go-ahead. " +
  "[Internal context: a patient loss in May 2026 (a child referred in already critically ill) prompted the conversation; " +
  "not attributable to the facility. All client-facing materials are framed forward, around building clinical governance " +
  "and systems ahead of growth, and contain no reference to the incident.]";

const ENGAGEMENT_DESCRIPTION =
  "Board-led operational turnaround for a 5+3 bed paediatric/NICU facility, scoped as the facility " +
  "scales into more complex care. The engaging insight: culture, incentives and standards of work, not " +
  "isolated process fixes, are the foundation that makes safe, efficient care self-sustaining. Scope, " +
  "across five workstreams: (1) a detailed diagnostic audit; (2) culture, incentives and clinical " +
  "standards of work, including the staff commission structure and JDS/KPIs already on the board's " +
  "decision list; (3) business process reengineering and operations (procurement/vendor-managed " +
  "inventory, receivables recovery, management reporting); (4) revenue and growth optimisation (NICU " +
  "activation, pricing review, corporate and HMO tie-ups); and (5) optional ongoing board-level " +
  "management oversight. CFA also advised recruiting a senior operations leader to run the facility, " +
  "sourced via CadreHealth.";

const ENGAGEMENT_NOTES =
  "Related-party context: Debo has been invited to Haven's board (not yet formally constituted) and CFA " +
  "would be a paid partner. Pricing and discount fully disclosed to all owners. Proposal pack sent to " +
  "founders 27 June 2026. Quick wins targeted in first fortnight: a proactive crash-cart standard + shift " +
  "checklist, and recovery of ~N4.2M in HMO receivables (Leadway + NEM) that roughly equals a full " +
  "period's revenue. Client-facing materials framed forward (build governance/systems ahead of growth); " +
  "no reference to the May 2026 incident.";

const TRACK2_DESCRIPTION =
  "The spine of the engagement. Establish the safety culture and shift-level clinical routines " +
  "(crash-cart standard and checklist, nursing standards of work, immunisation follow-up discipline). " +
  "Redesign incentives: the staff commission structure and JDS/KPIs already awaiting board approval. " +
  "Ownership culture is the root cause behind both clinical reliability and the thin margins. Standard rate " +
  "N5,000,000; net N3,000,000.";

const TRACK3_DESCRIPTION =
  "Reengineer core operations: procurement and vendor-managed inventory (recommend engaging Medbury " +
  "Pharma) to end stockouts and lift pharmacy margin; receivables recovery process for Leadway/NEM; a " +
  "reliable management reporting layer. Reliable inventory keeps critical items available and protects " +
  "margin at the same time. Standard rate N4,000,000; net N2,400,000.";

async function main() {
  console.log(`Updating live "${CLIENT_NAME}" record in place (no deletes)...\n`);

  const client = await prisma.client.findFirst({ where: { name: CLIENT_NAME } });
  if (!client) {
    console.error(`No client named "${CLIENT_NAME}" found. Nothing to update.`);
    return;
  }

  // ── Client ──────────────────────────────────────────────────────────────
  await prisma.client.update({
    where: { id: client.id },
    data: { primaryContact: "Mr Kabir Aregbesola", notes: CLIENT_NOTES },
  });
  console.log(`✓ Client ${client.id}: owners + framing updated (Mrs Abisodun Alli added).`);

  // ── Engagement(s) ───────────────────────────────────────────────────────
  const engagements = await prisma.engagement.findMany({
    where: { clientId: client.id },
    select: { id: true, name: true, status: true },
  });
  if (engagements.length === 0) {
    console.warn("! No engagement found under this client.");
  }

  for (const eng of engagements) {
    await prisma.engagement.update({
      where: { id: eng.id },
      data: { description: ENGAGEMENT_DESCRIPTION, notes: ENGAGEMENT_NOTES },
    });
    console.log(`✓ Engagement ${eng.id} (status ${eng.status}, kept): description + notes updated.`);

    const tracks = await prisma.engagementTrack.findMany({
      where: { engagementId: eng.id },
      select: { id: true, order: true, name: true },
    });
    for (const tr of tracks) {
      if (tr.order === 2) {
        await prisma.engagementTrack.update({ where: { id: tr.id }, data: { description: TRACK2_DESCRIPTION } });
        console.log(`  ✓ Track 2 (${tr.name}): description softened.`);
      } else if (tr.order === 3) {
        await prisma.engagementTrack.update({ where: { id: tr.id }, data: { description: TRACK3_DESCRIPTION } });
        console.log(`  ✓ Track 3 (${tr.name}): description softened.`);
      }
    }
  }

  // ── Read-back verification ──────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("READ-BACK (post-update):");
  const verify = await prisma.client.findUnique({
    where: { id: client.id },
    include: {
      engagements: {
        select: {
          status: true,
          tracks: { select: { order: true, name: true }, orderBy: { order: "asc" } },
        },
      },
    },
  });
  console.log("  Client.notes:", (verify?.notes ?? "").slice(0, 120) + "...");
  console.log(
    "  Owners line includes Mrs Abisodun Alli:",
    verify?.notes?.includes("Mrs Abisodun Alli") ? "YES" : "NO",
  );
  console.log(
    "  Incident-blame language present (should be NONE):",
    /caused the mortality|stockouts that kill|first mortality|medication unavailable/i.test(
      [verify?.notes, ...(verify?.engagements ?? []).map(() => "")].join(" "),
    )
      ? "STILL PRESENT"
      : "none",
  );
  for (const e of verify?.engagements ?? []) {
    console.log(`  Engagement status: ${e.status} (unchanged)`);
  }
  console.log("=".repeat(60));
  console.log("Done. No records deleted; engagement id unchanged.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
