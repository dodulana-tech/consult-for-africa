import { prisma } from "@/lib/prisma";
import { emailMaarovaReportReady } from "@/lib/email";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";

export interface NotifyResult {
  ok: boolean;
  alreadyDelivered?: boolean;
  error?: string;
}

/**
 * Send the leader an email saying their Maarova report is ready, with a link
 * to view in the portal and a direct PDF download. Stamps deliveredAt on the
 * report so the same person isn't emailed twice. Idempotent.
 */
export async function notifyReportReady(reportId: string): Promise<NotifyResult> {
  const report = await prisma.maarovaReport.findUnique({
    where: { id: reportId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      session: {
        select: {
          id: true,
          moduleResponses: { include: { module: { select: { type: true } } } },
        },
      },
    },
  });

  if (!report) return { ok: false, error: "report not found" };
  if (report.status !== "READY") return { ok: false, error: `report not ready (${report.status})` };
  if (report.deliveredAt) return { ok: true, alreadyDelivered: true };

  const has360 = report.session.moduleResponses.some(
    (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED",
  );

  try {
    await emailMaarovaReportReady({
      email: report.user.email,
      name: report.user.name,
      reportUrl: `${BASE_URL}/maarova/portal/results/${report.session.id}`,
      pdfUrl: report.pdfUrl,
      inviteRatersUrl: `${BASE_URL}/maarova/portal/three-sixty`,
      has360,
    });

    await prisma.maarovaReport.update({
      where: { id: reportId },
      data: { deliveredAt: new Date() },
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[notifyReportReady] email failed:", msg);
    return { ok: false, error: `email failed: ${msg}` };
  }
}
