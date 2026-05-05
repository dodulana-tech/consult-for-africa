/**
 * GET /api/health
 *
 * Public deploy-health probe. Curl this after every deploy to confirm
 * the runtime can reach the database and that no required environment
 * variable is missing. Returns 200 when healthy, 503 when not, with a
 * JSON body listing what is wrong so support can act in seconds rather
 * than waiting for users to complain.
 *
 * Returns BOOLEANS only for env presence, never the raw values.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface EnvCheck {
  name: string;
  required: boolean;
  present: boolean;
  affects: string;
}

const REQUIRED_ENVS: { name: string; affects: string }[] = [
  { name: "DATABASE_URL", affects: "everything" },
  { name: "DIRECT_URL", affects: "prisma migrate" },
  { name: "NEXTAUTH_SECRET", affects: "internal user auth" },
  { name: "ANTHROPIC_API_KEY", affects: "Nuru, AI features, report generation" },
  { name: "SMTP_HOST", affects: "transactional email" },
  { name: "SMTP_USER", affects: "transactional email" },
  { name: "SMTP_PASS", affects: "transactional email" },
  { name: "CRON_SECRET", affects: "all scheduled jobs" },
  { name: "CADRE_PORTAL_SECRET", affects: "cadre login, claim, dashboard" },
  { name: "MAAROVA_PORTAL_SECRET", affects: "maarova login, assessments, reports" },
  { name: "CLIENT_PORTAL_SECRET", affects: "client portal" },
  { name: "PARTNER_PORTAL_SECRET", affects: "partner firm portal" },
  { name: "R2_ACCOUNT_ID", affects: "file uploads, CV storage" },
  { name: "R2_ACCESS_KEY_ID", affects: "file uploads, CV storage" },
  { name: "R2_SECRET_ACCESS_KEY", affects: "file uploads, CV storage" },
  { name: "R2_BUCKET_NAME", affects: "file uploads, CV storage" },
];

const OPTIONAL_ENVS: { name: string; affects: string }[] = [
  { name: "PAYSTACK_SECRET_KEY", affects: "payments (optional until Paystack verification clears)" },
  { name: "ZEPTOMAIL_API_KEY", affects: "preferred email transport (falls back to SMTP)" },
  { name: "SMTP_FROM", affects: "default From address (hardcoded fallback used otherwise)" },
  { name: "CADRE_EMPLOYER_SECRET", affects: "cadre employer portal (falls back to CADRE_PORTAL_SECRET)" },
  { name: "OUTREACH_PAUSED", affects: "kill switch for cadre outreach crons" },
];

export async function GET() {
  const startedAt = Date.now();

  // Env check
  const envChecks: EnvCheck[] = [
    ...REQUIRED_ENVS.map((e) => ({
      name: e.name,
      required: true,
      present: !!process.env[e.name],
      affects: e.affects,
    })),
    ...OPTIONAL_ENVS.map((e) => ({
      name: e.name,
      required: false,
      present: !!process.env[e.name],
      affects: e.affects,
    })),
  ];
  const missingRequired = envChecks.filter((c) => c.required && !c.present);

  // DB check
  let dbOk = false;
  let dbError: string | null = null;
  let dbLatencyMs: number | null = null;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const ok = dbOk && missingRequired.length === 0;
  const status = ok ? 200 : 503;

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      database: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError },
      env: {
        ok: missingRequired.length === 0,
        missingRequired: missingRequired.map((c) => ({ name: c.name, affects: c.affects })),
        all: envChecks,
      },
    },
    { status },
  );
}
