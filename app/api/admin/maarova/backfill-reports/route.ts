import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { generateMaarovaReport } from "@/lib/maarova/generateReport";
import { renderAndStoreReportPdf } from "@/lib/maarova/renderReportPdf";

export const maxDuration = 600;

/**
 * POST /api/admin/maarova/backfill-reports
 *
 * Two-pass backfill for Maarova reports:
 *   1. Sessions with status=COMPLETED and no MaarovaReport (or report not READY)
 *      -> trigger report generation
 *   2. Reports with status=READY and pdfUrl=NULL
 *      -> render PDF + upload to R2 + save pdfUrl
 *
 * Used to fix completed assessments that never had reports generated
 * (because the user closed the tab before clicking "Generate Report")
 * and ready reports that never had PDFs persisted.
 */
export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pass 1: completed sessions without a READY report
  const sessionsNeedingReports = await prisma.maarovaAssessmentSession.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ report: null }, { report: { status: { not: "READY" } } }],
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { completedAt: "asc" },
  });

  const generationResults: Array<{ sessionId: string; user: string; ok: boolean; error?: string }> = [];
  for (const s of sessionsNeedingReports) {
    try {
      const result = await generateMaarovaReport(s.id);
      generationResults.push({
        sessionId: s.id,
        user: s.user.name,
        ok: result.ok,
        error: result.ok ? undefined : result.error,
      });
    } catch (err) {
      generationResults.push({
        sessionId: s.id,
        user: s.user.name,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  // Pass 2: ready reports without pdfUrl
  const reportsNeedingPdf = await prisma.maarovaReport.findMany({
    where: { status: "READY", pdfUrl: null },
    include: { user: { select: { name: true } } },
    orderBy: { generatedAt: "asc" },
  });

  const pdfResults: Array<{ reportId: string; user: string; ok: boolean; pdfUrl?: string; error?: string }> = [];
  for (const r of reportsNeedingPdf) {
    try {
      const result = await renderAndStoreReportPdf(r.id);
      pdfResults.push({
        reportId: r.id,
        user: r.user.name,
        ok: result.ok,
        pdfUrl: result.pdfUrl,
        error: result.ok ? undefined : result.error,
      });
    } catch (err) {
      pdfResults.push({
        reportId: r.id,
        user: r.user.name,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    reportsGenerated: {
      total: generationResults.length,
      successful: generationResults.filter((r) => r.ok).length,
      failed: generationResults.filter((r) => !r.ok).length,
      details: generationResults,
    },
    pdfsRendered: {
      total: pdfResults.length,
      successful: pdfResults.filter((r) => r.ok).length,
      failed: pdfResults.filter((r) => !r.ok).length,
      details: pdfResults,
    },
  });
});
