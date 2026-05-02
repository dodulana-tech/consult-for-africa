import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";
import {
  LeadershipReport,
  MODULE_ORDER,
  SKIP_KEYS,
  type ModuleScore,
  type FullReport,
} from "@/app/api/maarova/reports/[sessionId]/pdf/route";
import { generateUploadUrl, buildKey, getPublicUrl } from "@/lib/r2";
import React from "react";

export interface RenderResult {
  ok: boolean;
  pdfUrl?: string;
  error?: string;
}

/**
 * Render a Maarova leadership report PDF, upload to R2, and persist the URL
 * on the MaarovaReport row. Idempotent: skips if pdfUrl already set unless
 * opts.force is true. Server-only helper - performs no auth.
 */
export async function renderAndStoreReportPdf(
  reportId: string,
  opts: { force?: boolean } = {},
): Promise<RenderResult> {
  const report = await prisma.maarovaReport.findUnique({ where: { id: reportId } });
  if (!report) return { ok: false, error: "report not found" };
  if (report.status !== "READY") return { ok: false, error: `report not ready (status: ${report.status})` };
  if (report.pdfUrl && !opts.force) {
    return { ok: true, pdfUrl: report.pdfUrl };
  }

  const session = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: report.sessionId },
    include: {
      user: { include: { organisation: { select: { name: true } } } },
      moduleResponses: {
        include: { module: { select: { name: true, type: true, order: true } } },
        orderBy: { module: { order: "asc" } },
      },
    },
  });
  if (!session) return { ok: false, error: "session not found" };

  // Load logo
  let logoBase64 = "";
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-cfa.png");
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    // Logo is optional
  }

  // Build module scores
  const moduleScores: ModuleScore[] = session.moduleResponses
    .filter((mr) => mr.status === "COMPLETED" && mr.scaledScores)
    .sort((a, b) => (MODULE_ORDER[a.module.type] ?? 99) - (MODULE_ORDER[b.module.type] ?? 99))
    .map((mr) => {
      const allScores = mr.scaledScores as Record<string, unknown>;
      const numericScores: Record<string, number> = {};
      for (const [k, v] of Object.entries(allScores)) {
        if (typeof v === "number" && !SKIP_KEYS.has(k) && !k.startsWith("raw")) {
          numericScores[k] = v;
        }
      }
      return { name: mr.module.name, type: mr.module.type, scores: numericScores };
    })
    .filter((m) => Object.keys(m.scores).length > 0);

  const has360 = session.moduleResponses.some(
    (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED",
  );

  const developmentGoals = await prisma.maarovaDevelopmentGoal.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
    select: {
      title: true,
      description: true,
      dimension: true,
      status: true,
      progress: true,
      targetDate: true,
    },
  });

  const fullReport = (report.fullReportContent as FullReport) ?? {};

  if (!fullReport.executiveSummary && report.executiveSummary) fullReport.executiveSummary = report.executiveSummary;
  if (!fullReport.strengthsAnalysis && report.strengthsAnalysis) fullReport.strengthsAnalysis = report.strengthsAnalysis;
  if (!fullReport.nextLeadershipEdge && (report.nextLeadershipEdge || report.developmentAreas)) {
    fullReport.nextLeadershipEdge = report.nextLeadershipEdge ?? report.developmentAreas;
  }
  if (!fullReport.blindSpotAnalysis && report.blindSpotAnalysis) fullReport.blindSpotAnalysis = report.blindSpotAnalysis;
  if (!fullReport.leadershipArchetype && report.leadershipArchetype) fullReport.leadershipArchetype = report.leadershipArchetype;
  if (!fullReport.archetypeNarrative && report.archetypeNarrative) fullReport.archetypeNarrative = report.archetypeNarrative;
  if (!fullReport.signatureStrengths && report.signatureStrengths) fullReport.signatureStrengths = report.signatureStrengths;
  if (!fullReport.coachingPriorities && report.coachingPriorities) fullReport.coachingPriorities = report.coachingPriorities;

  let buffer: Buffer;
  try {
    const stream = await renderToBuffer(
      <LeadershipReport
        userName={session.user.name}
        userTitle={session.user.title}
        orgName={session.user.organisation?.name ?? null}
        completedAt={session.completedAt?.toISOString() ?? null}
        logoBase64={logoBase64}
        moduleScores={moduleScores}
        fullReport={fullReport}
        developmentGoals={developmentGoals}
        has360={has360}
      />,
    );
    buffer = Buffer.from(stream as unknown as Buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[renderAndStoreReportPdf] render failed:", msg);
    return { ok: false, error: `render failed: ${msg}` };
  }

  // Upload to R2
  try {
    const safeName = session.user.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const key = buildKey("maarova-reports", `${safeName}.pdf`);
    const uploadUrl = await generateUploadUrl(key, "application/pdf", 600, buffer.length);
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: new Uint8Array(buffer),
    });
    if (!putRes.ok) return { ok: false, error: `r2 upload status ${putRes.status}` };

    const pdfUrl = await getPublicUrl(key);
    await prisma.maarovaReport.update({
      where: { id: reportId },
      data: { pdfUrl, deliveredAt: report.deliveredAt ?? new Date() },
    });

    return { ok: true, pdfUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[renderAndStoreReportPdf] upload failed:", msg);
    return { ok: false, error: `upload failed: ${msg}` };
  }
}
