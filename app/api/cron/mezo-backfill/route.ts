import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { handler } from "@/lib/api-handler";
import { surnameFor } from "@/lib/cadreSalutation";
import {
  MEZO_BATCH_SIZE,
  MEZO_COHORT_SELECT,
  isMezoConfigured,
  provisionMezoBatch,
  toMezoPayload,
  type MezoBatchResult,
} from "@/lib/mezo/provision";

/**
 * POST or GET /api/cron/mezo-backfill
 *
 * Opens a Mezo place for every registered CadreHealth doctor who never
 * answered the private practice survey.
 *
 * Why this exists as an endpoint and not only as a script. The register was
 * seeded once, by hand, on 12 August 2026: 388 accounts, which was everyone
 * who held a real CadreHealth account at the time. CadreHealth kept growing
 * (556 doctors logged in during September alone) and nothing seeded any of
 * them, so by late September 582 eligible doctors had no Mezo place. The
 * survey path cannot close that on its own: 25 of 988 eligible members have
 * answered it. A hand-run script only helps on the days somebody remembers to
 * run it, and the secret it needs lives in the deployment environment rather
 * than on anybody's laptop.
 *
 * SILENT BY DESIGN, and this is the part to be careful with. It writes no
 * CadreMezoInterest row and sends no email. /api/cron/mezo-provision-retry
 * emails anyone holding a claim link with no claimEmailSentAt stamp, so
 * recording these the ordinary way would put a thousand unsolicited emails on
 * the next hourly run. Accounts are opened; nobody is told anything until
 * someone decides to tell them, deliberately, in a campaign.
 *
 * Because nothing is written back, progress is carried by an id cursor rather
 * than by state: the caller pages with ?after=<lastId> until done is true. The
 * far side is idempotent on email, so a repeated page costs nothing and a stub
 * that already exists simply has its claim token refreshed.
 *
 * Both verbs, because Vercel fires scheduled crons as GET. Exporting POST
 * alone is what left mezo-provision-retry returning 405 every hour from the
 * day it merged.
 */

export const maxDuration = 300;

/** Rows per invocation. Three Mezo batches fits comfortably inside 300s. */
const DEFAULT_LIMIT = 300;
const MAX_LIMIT = 600;

export const POST = handler(async function POST(req: NextRequest) { return run(req); });
export const GET = handler(async function GET(req: NextRequest) { return run(req); });

async function run(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMezoConfigured()) {
    // Not an error. Until the environment is set there is nothing this can do,
    // and saying so plainly beats a run that reports zero and looks healthy.
    return Response.json({ skipped: "Mezo handoff is not configured" });
  }

  const url = new URL(req.url);
  const after = url.searchParams.get("after") ?? undefined;
  const dryRun = url.searchParams.get("dryRun") === "1";
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  // A real account holder, eligible for the MDCN-backed register Mezo runs on,
  // who has not already been through the survey path. Ordered by id so the
  // cursor is stable across calls even as the table changes underneath.
  const where: Prisma.CadreProfessionalWhereInput = {
    passwordHash: { not: null },
    cadre: { in: ["MEDICINE", "DENTISTRY"] },
    mezoInterest: null,
    ...(after ? { id: { gt: after } } : {}),
  };

  const cohort = await prisma.cadreProfessional.findMany({
    where,
    orderBy: { id: "asc" },
    take: limit,
    select: MEZO_COHORT_SELECT,
  });

  const remaining = await prisma.cadreProfessional.count({ where });

  if (cohort.length === 0) {
    return Response.json({ done: true, scanned: 0, remaining: 0 });
  }

  const payloads = cohort.map((p) => toMezoPayload(p, surnameFor));
  const nextCursor = cohort[cohort.length - 1].id;

  if (dryRun) {
    return Response.json({
      dryRun: true,
      scanned: payloads.length,
      remaining,
      nextCursor,
      done: remaining <= payloads.length,
      sample: payloads.slice(0, 2).map((p) => ({ email: p.email, lastName: p.lastName })),
    });
  }

  const results: MezoBatchResult[] = [];
  const batchErrors: string[] = [];

  for (let i = 0; i < payloads.length; i += MEZO_BATCH_SIZE) {
    const batch = payloads.slice(i, i + MEZO_BATCH_SIZE);
    try {
      results.push(...(await provisionMezoBatch(batch)));
    } catch (err) {
      // Idempotent on email, so a failed batch is re-runnable rather than
      // lost. Record it and keep going: one bad batch must not strand the
      // pages behind it.
      const reason = err instanceof Error ? err.message : String(err);
      batchErrors.push(`${i + 1}-${i + batch.length}: ${reason}`);
      console.error(`[mezo-backfill] batch ${i + 1}-${i + batch.length} failed: ${reason}`);
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const existing = results.filter((r) => r.status === "existing").length;
  const skipped = results.filter((r) => r.status === "skipped");

  return Response.json({
    scanned: payloads.length,
    created,
    existing,
    skipped: skipped.length,
    // The reasons, not just the count: a skip is a data problem on our side and
    // it is worth seeing which one without opening the logs.
    skipReasons: [...new Set(skipped.map((s) => s.reason ?? "unknown"))].slice(0, 10),
    batchErrors,
    nextCursor,
    remaining: remaining - payloads.length,
    done: remaining <= payloads.length,
  });
}
