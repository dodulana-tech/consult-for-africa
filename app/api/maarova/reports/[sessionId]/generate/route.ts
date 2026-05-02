export const maxDuration = 300;

import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";
import { generateMaarovaReport } from "@/lib/maarova/generateReport";
import { renderAndStoreReportPdf } from "@/lib/maarova/renderReportPdf";

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const maarovaSession = await getMaarovaSession();
  if (!maarovaSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Verify ownership
  const session = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.userId !== maarovaSession.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("regenerate") === "true";

  const result = await generateMaarovaReport(sessionId, { force });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Report generation failed" }, { status: 500 });
  }

  // Fire-and-forget PDF render and store. The PDF link will appear on next
  // page load. We don't await so the user gets their report immediately.
  if (result.reportId) {
    renderAndStoreReportPdf(result.reportId).catch((err) => {
      console.error("[generate] background PDF render failed:", err);
    });
  }

  const report = await prisma.maarovaReport.findUnique({ where: { id: result.reportId! } });
  return NextResponse.json({ report });
});
