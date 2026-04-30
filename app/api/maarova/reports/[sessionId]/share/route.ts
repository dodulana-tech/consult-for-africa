import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";
import { randomBytes } from "crypto";

async function loadOwnedReport(sessionId: string, subjectId: string) {
  const report = await prisma.maarovaReport.findUnique({
    where: { sessionId },
    select: {
      id: true,
      userId: true,
      status: true,
      shareToken: true,
      shareEnabledAt: true,
    },
  });
  if (!report) return { error: "Report not found", status: 404 as const };
  if (report.userId !== subjectId) return { error: "Forbidden", status: 403 as const };
  return { report };
}

export const POST = handler(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getMaarovaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const result = await loadOwnedReport(sessionId, session.sub);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { report } = result;

  if (report.status !== "READY" && report.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Report is not ready to share yet." },
      { status: 400 }
    );
  }

  const token = report.shareToken ?? randomBytes(32).toString("base64url");
  const updated = await prisma.maarovaReport.update({
    where: { id: report.id },
    data: { shareToken: token, shareEnabledAt: new Date() },
    select: { shareToken: true, shareEnabledAt: true },
  });

  return NextResponse.json({ shareToken: updated.shareToken, shareEnabledAt: updated.shareEnabledAt });
});

export const DELETE = handler(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await getMaarovaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const result = await loadOwnedReport(sessionId, session.sub);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await prisma.maarovaReport.update({
    where: { id: result.report.id },
    data: { shareToken: null, shareEnabledAt: null },
  });

  return NextResponse.json({ ok: true });
});
