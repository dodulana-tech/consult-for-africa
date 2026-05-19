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

  // Best-effort: await the PDF render for up to ~25s so the user typically
  // sees the link immediately. If it takes longer or fails, we kick the work
  // into the background (with retry + admin notification inside the helper)
  // and still return the report so the user is unblocked.
  if (result.reportId) {
    const reportId = result.reportId;
    const renderPromise = renderAndStoreReportPdf(reportId).catch((err) => {
      console.error("[generate] background PDF render failed:", err);
      return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
    });
    const timeout = new Promise<{ ok: false; timeout: true }>((resolve) =>
      setTimeout(() => resolve({ ok: false, timeout: true }), 25_000),
    );
    const raceResult = await Promise.race([renderPromise, timeout]);
    if ("timeout" in raceResult) {
      // Let the original promise keep running in the background. The
      // helper will retry once on failure and notify admins if it can't
      // recover - so the silent-failure mode that produced this bug is gone.
      renderPromise.then((r) => {
        if (!r.ok) console.error("[generate] PDF render eventually failed:", r);
      });
    }
  }

  const report = await prisma.maarovaReport.findUnique({ where: { id: result.reportId! } });
  return NextResponse.json({ report });
});
