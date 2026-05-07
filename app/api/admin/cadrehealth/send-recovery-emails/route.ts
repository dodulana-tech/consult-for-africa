/**
 * Recovery email for the cohort of CadreProfessionals who set a password
 * but have never successfully logged in -- the orphan-state cohort
 * created by the May 2026 CADRE_PORTAL_SECRET incident, plus anyone in
 * the future who hits the same shape of env-misconfig.
 *
 *   GET  /api/admin/cadrehealth/send-recovery-emails
 *        -> { stuckCount: N }   (no side effects; preview the cohort size)
 *
 *   POST /api/admin/cadrehealth/send-recovery-emails
 *        -> { ok, sent, failed, total, errorSample }
 *
 * Admin-only. Idempotent in spirit: once a user logs in, lastLoginAt
 * populates and they drop out of the cohort, so re-running is safe.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { logAudit } from "@/lib/audit";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];
const SEND_DELAY_MS = 250;

async function findStuckCohort() {
  return prisma.cadreProfessional.findMany({
    where: {
      passwordHash: { not: null },
      lastLoginAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
}

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cohort = await findStuckCohort();
  return NextResponse.json({ stuckCount: cohort.length });
});

export const POST = handler(async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cohort = await findStuckCohort();
  if (cohort.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0, errorSample: [] });
  }

  let sent = 0;
  let failed = 0;
  const errorSample: { email: string; error: string }[] = [];

  for (const p of cohort) {
    try {
      await sendCadreEmail({
        to: p.email,
        subject: "Your CadreHealth profile is active. Please sign in.",
        heading: `Dr ${p.lastName}, your profile is active`,
        body: `Earlier this week you set a password to activate your CadreHealth profile and the page returned an error. The error was on our side. Your account was actually saved with the password you chose.

Your profile is active now. Please sign in at https://www.consultforafrica.com/oncadre/login using the email this message was sent to and the password you set during your first attempt. If you do not remember it, request a reset on the same page.

Apologies for the friction.

Dr Debo Odulana
Founding Partner, Consult For Africa`,
        ctaText: "Sign in to CadreHealth",
        ctaHref: "https://www.consultforafrica.com/oncadre/login",
        footer: "If you no longer wish to be contacted, simply ignore this message.",
      });
      sent++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (errorSample.length < 5) {
        errorSample.push({ email: p.email, error: msg });
      }
      console.error(`[recovery-emails] failed to send to ${p.email}:`, err);
    }

    if (sent + failed < cohort.length) {
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "CadreProfessional",
    entityId: "recovery-batch",
    entityName: `Recovery email to ${cohort.length} stuck users`,
    details: { cohortSize: cohort.length, sent, failed },
  });

  return NextResponse.json({ ok: true, sent, failed, total: cohort.length, errorSample });
});
