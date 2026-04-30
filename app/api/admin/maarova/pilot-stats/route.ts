/**
 * Maarova Pilot Cohort Stats
 *
 * Read-only JSON endpoint for tracking the validation pilot cohort.
 * Used by the weekly progress-report routine and any future admin
 * dashboard.
 *
 * Auth: Bearer CRON_SECRET (same secret used by cron endpoints).
 *
 * GET /api/admin/maarova/pilot-stats?since=2026-04-01
 *
 *   since (optional) ISO date. Activity in the "recent" block uses this.
 *                   Defaults to 7 days ago.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

const PILOT_TARGET = 75; // upper bound of the 50-75 pilot goal

export const GET = handler(async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam
    ? new Date(sinceParam)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    sessionsByStatus,
    reportsTotal,
    reportsByStatus,
    reportsShared,
    archetypeRows,
    sessionsRecent,
    completionsRecent,
    reportsRecent,
    sharesEnabledRecent,
    moduleResponseRows,
    organisationsByStream,
  ] = await Promise.all([
    prisma.maarovaAssessmentSession.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.maarovaReport.count(),
    prisma.maarovaReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.maarovaReport.count({ where: { shareEnabledAt: { not: null } } }),
    prisma.maarovaReport.groupBy({
      by: ["leadershipArchetype"],
      _count: { _all: true },
      where: { leadershipArchetype: { not: null } },
    }),
    prisma.maarovaAssessmentSession.count({ where: { startedAt: { gte: since } } }),
    prisma.maarovaAssessmentSession.count({ where: { completedAt: { gte: since } } }),
    prisma.maarovaReport.count({ where: { generatedAt: { gte: since } } }),
    prisma.maarovaReport.count({ where: { shareEnabledAt: { gte: since } } }),
    prisma.maarovaModuleResponse.groupBy({
      by: ["moduleId", "status"],
      _count: { _all: true },
    }),
    prisma.maarovaOrganisation.groupBy({
      by: ["stream"],
      _count: { _all: true },
      where: { isActive: true },
    }),
  ]);

  const modules = await prisma.maarovaModule.findMany({
    select: { id: true, slug: true, name: true, type: true, order: true },
    orderBy: { order: "asc" },
  });

  const sessionsByStatusMap: Record<string, number> = {};
  for (const r of sessionsByStatus) sessionsByStatusMap[r.status] = r._count._all;

  const reportsByStatusMap: Record<string, number> = {};
  for (const r of reportsByStatus) reportsByStatusMap[r.status] = r._count._all;

  const archetypes = archetypeRows
    .map((r) => ({ archetype: r.leadershipArchetype ?? "Unknown", count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  const moduleStats = modules.map((m) => {
    const rows = moduleResponseRows.filter((r) => r.moduleId === m.id);
    const total = rows.reduce((s, r) => s + r._count._all, 0);
    const completed = rows.filter((r) => r.status === "COMPLETED")
      .reduce((s, r) => s + r._count._all, 0);
    return {
      slug: m.slug,
      name: m.name,
      type: m.type,
      started: total,
      completed,
    };
  });

  const completedSessions = sessionsByStatusMap["COMPLETED"] ?? 0;
  const totalSessions = Object.values(sessionsByStatusMap).reduce((s, n) => s + n, 0);

  const cohortProgress = {
    target: PILOT_TARGET,
    completed: completedSessions,
    progressPct: Math.round((completedSessions / PILOT_TARGET) * 100),
    needed: Math.max(0, 50 - completedSessions), // gap to lower bound
  };

  const streamMap: Record<string, number> = {};
  for (const r of organisationsByStream) streamMap[r.stream] = r._count._all;

  return Response.json({
    generatedAt: new Date().toISOString(),
    since: since.toISOString(),
    cohort: cohortProgress,
    sessions: {
      total: totalSessions,
      byStatus: sessionsByStatusMap,
    },
    reports: {
      total: reportsTotal,
      byStatus: reportsByStatusMap,
      sharingEnabled: reportsShared,
      sharingAdoptionPct: reportsTotal > 0
        ? Math.round((reportsShared / reportsTotal) * 100)
        : 0,
    },
    archetypes,
    modules: moduleStats,
    organisationsByStream: streamMap,
    recentActivity: {
      sessionsStarted: sessionsRecent,
      sessionsCompleted: completionsRecent,
      reportsGenerated: reportsRecent,
      sharesEnabled: sharesEnabledRecent,
    },
  });
});
