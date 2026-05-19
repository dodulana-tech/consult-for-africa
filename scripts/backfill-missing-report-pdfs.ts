/**
 * Backfill: re-render and upload PDFs for any READY Maarova reports that
 * are missing pdfUrl. Used to recover from silent background-render
 * failures.
 *
 * Usage: npx tsx scripts/backfill-missing-report-pdfs.ts
 */

import { prisma } from "../lib/prisma";
import { renderAndStoreReportPdf } from "../lib/maarova/renderReportPdf";

async function main() {
  const reports = await prisma.maarovaReport.findMany({
    where: { status: "READY", pdfUrl: null },
    include: { user: { select: { name: true } } },
    orderBy: { generatedAt: "asc" },
  });

  if (reports.length === 0) {
    console.log("No READY reports are missing pdfUrl. Nothing to do.");
    return;
  }

  console.log(`Found ${reports.length} report(s) missing pdfUrl:`);
  for (const r of reports) {
    console.log(`  - ${r.user.name} (report ${r.id}, generated ${r.generatedAt?.toISOString() ?? "?"})`);
  }
  console.log("");

  let ok = 0;
  let failed = 0;
  for (const r of reports) {
    process.stdout.write(`Rendering for ${r.user.name}... `);
    try {
      const result = await renderAndStoreReportPdf(r.id, { force: true });
      if (result.ok) {
        ok++;
        console.log(`OK -> ${result.pdfUrl}`);
      } else {
        failed++;
        console.log(`FAILED: ${result.error}`);
      }
    } catch (err) {
      failed++;
      console.log(`THREW: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log("");
  console.log(`Done. ${ok} succeeded, ${failed} failed.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
