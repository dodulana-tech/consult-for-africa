import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { notifyReportReady } from "@/lib/maarova/notifyReportReady";

export const maxDuration = 300;

/**
 * POST /api/admin/maarova/notify-completed-reports
 *
 * Sends the "your Maarova report is ready" email to every leader whose
 * report is READY but has not yet been delivered (deliveredAt IS NULL).
 * Idempotent: each leader is emailed at most once. Includes the 360 viral
 * hook in the email body when the leader has not completed the 360 module.
 */
export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reports = await prisma.maarovaReport.findMany({
    where: { status: "READY", deliveredAt: null },
    include: { user: { select: { name: true } } },
    orderBy: { generatedAt: "asc" },
  });

  const results: Array<{ reportId: string; user: string; ok: boolean; error?: string }> = [];
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    try {
      const result = await notifyReportReady(r.id);
      results.push({
        reportId: r.id,
        user: r.user.name,
        ok: result.ok,
        error: result.ok ? undefined : result.error,
      });
    } catch (err) {
      results.push({
        reportId: r.id,
        user: r.user.name,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
    if (i < reports.length - 1) await new Promise((res) => setTimeout(res, 2000));
  }

  return NextResponse.json({
    total: results.length,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
});
