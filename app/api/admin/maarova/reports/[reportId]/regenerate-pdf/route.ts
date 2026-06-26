import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { renderAndStoreReportPdf } from "@/lib/maarova/renderReportPdf";

export const maxDuration = 300;

/**
 * POST /api/admin/maarova/reports/[reportId]/regenerate-pdf
 *
 * Force re-render and re-upload the PDF for a single Maarova report.
 * Used by the admin dossier view when a report shows as READY but the
 * PDF link is missing (background render failed silently in the past).
 */
export const POST = handler(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportId } = await params;
  const report = await prisma.maarovaReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.status !== "READY") {
    return NextResponse.json(
      { error: `Report is not ready (status: ${report.status}). Generate the report first.` },
      { status: 400 },
    );
  }

  const result = await renderAndStoreReportPdf(reportId, { force: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Render failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pdfUrl: result.pdfUrl });
});
