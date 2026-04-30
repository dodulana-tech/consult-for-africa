import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const maarovaSession = await getMaarovaSession();
  if (!maarovaSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Fetch the assessment session with ownership check
  const assessmentSession = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      moduleResponses: {
        include: {
          module: {
            select: {
              id: true,
              name: true,
              type: true,
              slug: true,
              order: true,
            },
          },
        },
        orderBy: {
          module: { order: "asc" },
        },
      },
    },
  });

  if (!assessmentSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (assessmentSession.userId !== maarovaSession.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch the report
  const report = await prisma.maarovaReport.findUnique({
    where: { sessionId },
  });

  return NextResponse.json({
    session: {
      id: assessmentSession.id,
      status: assessmentSession.status,
      stream: assessmentSession.stream,
      completedAt: assessmentSession.completedAt,
      totalTimeMinutes: assessmentSession.totalTimeMinutes,
      moduleResponses: assessmentSession.moduleResponses.map((mr) => ({
        id: mr.id,
        moduleId: mr.moduleId,
        moduleName: mr.module.name,
        moduleType: mr.module.type,
        moduleSlug: mr.module.slug,
        status: mr.status,
        scaledScores: mr.scaledScores,
        completedAt: mr.completedAt,
        timeSpentSeconds: mr.timeSpentSeconds,
      })),
    },
    report: report
      ? {
          id: report.id,
          status: report.status,
          overallScore: report.overallScore,
          dimensionScores: report.dimensionScores,
          radarChartData: report.radarChartData,
          benchmarkComparisons: report.benchmarkComparisons,
          executiveSummary: report.executiveSummary,
          strengthsAnalysis: report.strengthsAnalysis,
          developmentAreas: report.developmentAreas,
          nextLeadershipEdge: report.nextLeadershipEdge,
          blindSpotAnalysis: report.blindSpotAnalysis,
          coachingPriorities: report.coachingPriorities,
          leadershipArchetype: report.leadershipArchetype,
          archetypeNarrative: report.archetypeNarrative,
          signatureStrengths: report.signatureStrengths,
          fullReportContent: report.fullReportContent,
          generatedAt: report.generatedAt,
          pdfUrl: report.pdfUrl,
          shareToken: report.shareToken,
          shareEnabledAt: report.shareEnabledAt,
        }
      : null,
  });
});
