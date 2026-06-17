/**
 * Recover a Maarova report whose pipeline failed (e.g. the row was deleted
 * by the delete-on-error path in generateReport.ts while a PDF render was
 * still in flight, leaving the user with no downloadable PDF).
 *
 * Looks up a user by email or name, finds their latest COMPLETED session,
 * and re-runs the full generate -> render -> notify pipeline with force=true.
 *
 * Usage:
 *   npx tsx scripts/recover-maarova-report.ts <email-or-name>
 *
 * Examples:
 *   npx tsx scripts/recover-maarova-report.ts yewande@example.com
 *   npx tsx scripts/recover-maarova-report.ts "Yewande Ajayi"
 */

import { prisma } from "../lib/prisma";
import { generateMaarovaReport } from "../lib/maarova/generateReport";
import { renderAndStoreReportPdf } from "../lib/maarova/renderReportPdf";
import { notifyReportReady } from "../lib/maarova/notifyReportReady";

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/recover-maarova-report.ts <email-or-name>");
    process.exit(1);
  }

  const looksLikeEmail = arg.includes("@");
  const user = looksLikeEmail
    ? await prisma.maarovaUser.findUnique({
        where: { email: arg.toLowerCase() },
        select: { id: true, name: true, email: true },
      })
    : await prisma.maarovaUser.findFirst({
        where: { name: { equals: arg, mode: "insensitive" } },
        select: { id: true, name: true, email: true },
      });

  if (!user) {
    console.error(`No MaarovaUser found matching "${arg}"`);
    process.exit(1);
  }

  const session = await prisma.maarovaAssessmentSession.findFirst({
    where: { userId: user.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { id: true, completedAt: true },
  });
  if (!session) {
    console.error(`No COMPLETED session for ${user.name} <${user.email}>`);
    process.exit(1);
  }

  console.log(`Recovering report for ${user.name} <${user.email}>`);
  console.log(`  session ${session.id} completed ${session.completedAt?.toISOString() ?? "?"}`);

  console.log("Generating report (force)...");
  const gen = await generateMaarovaReport(session.id, { force: true });
  if (!gen.ok || !gen.reportId) {
    console.error(`  generate failed: ${gen.error}`);
    process.exit(1);
  }
  console.log(`  reportId ${gen.reportId}`);

  console.log("Rendering and uploading PDF (force)...");
  const render = await renderAndStoreReportPdf(gen.reportId, { force: true });
  if (!render.ok) {
    console.error(`  render failed: ${render.error}`);
    process.exit(1);
  }
  console.log(`  pdfUrl ${render.pdfUrl}`);

  console.log("Notifying user (idempotent)...");
  const notify = await notifyReportReady(gen.reportId);
  if (!notify.ok) {
    console.warn(`  notify failed (non-fatal): ${notify.error}`);
  } else if (notify.alreadyDelivered) {
    console.log("  already delivered earlier; no email sent");
  } else {
    console.log("  email sent");
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error("Recovery failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
