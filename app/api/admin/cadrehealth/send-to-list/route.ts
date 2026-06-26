/**
 * POST /api/admin/cadrehealth/send-to-list
 *
 * Send a one-off targeted email to a specified list of CadreProfessional
 * email addresses. Used when the founder has a specific cohort that
 * doesn't match an automated rule -- e.g., users who emailed in to
 * complain, users surfaced by an external query, users hand-curated.
 *
 * Body: { emails: string[], subject: string, body: string }
 *
 * Each recipient gets a personalised greeting (Dr <lastName>) if they
 * are found in CadreProfessional. Unknown emails are skipped and
 * reported as notFound.
 *
 * Suppression filter is applied -- bounced, opted-out and complained
 * recipients are skipped.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { sendCadreEmail } from "@/lib/cadreEmail";
import { logAudit } from "@/lib/audit";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "ASSOCIATE_DIRECTOR", "DIRECTOR"];
const SEND_DELAY_MS = 250;
const MAX_RECIPIENTS = 500;

interface SendResult {
  ok: boolean;
  total: number;
  sent: number;
  failed: number;
  notFound: number;
  skippedSuppressed: number;
  errorSample: { email: string; error: string }[];
}

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const rawEmails = body.emails as string[] | undefined;
  const subject = (body.subject as string | undefined)?.trim();
  const messageBody = (body.body as string | undefined)?.trim();

  if (!Array.isArray(rawEmails) || rawEmails.length === 0) {
    return NextResponse.json({ error: "emails (string[]) is required" }, { status: 400 });
  }
  if (!subject || !messageBody) {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }

  // Normalise + dedupe
  const emails = Array.from(
    new Set(
      rawEmails
        .map((e) => e?.toLowerCase().trim())
        .filter((e): e is string => !!e && e.includes("@")),
    ),
  );

  if (emails.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Max ${MAX_RECIPIENTS} recipients per call. Got ${emails.length}.` },
      { status: 400 },
    );
  }

  const result: SendResult = {
    ok: true,
    total: emails.length,
    sent: 0,
    failed: 0,
    notFound: 0,
    skippedSuppressed: 0,
    errorSample: [],
  };

  // Look up all professionals in one query
  const pros = await prisma.cadreProfessional.findMany({
    where: { email: { in: emails } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  const proByEmail = new Map(pros.map((p) => [p.email.toLowerCase(), p]));

  // Suppression check in one query
  const suppressions = await prisma.communicationSuppression.findMany({
    where: {
      email: { in: emails },
      OR: [{ channel: "EMAIL" }, { channel: null }],
    },
    select: { email: true },
  });
  const suppressedSet = new Set(
    suppressions.map((s) => s.email?.toLowerCase()).filter((e): e is string => !!e),
  );

  for (const email of emails) {
    if (suppressedSet.has(email)) {
      result.skippedSuppressed++;
      continue;
    }
    const pro = proByEmail.get(email);
    if (!pro) {
      result.notFound++;
      continue;
    }

    // Replace {{firstName}} / {{lastName}} placeholders so the same
    // template personalises per recipient.
    const personalisedBody = messageBody
      .replace(/\{\{\s*firstName\s*\}\}/g, pro.firstName)
      .replace(/\{\{\s*lastName\s*\}\}/g, pro.lastName);

    try {
      await sendCadreEmail({
        to: pro.email,
        subject,
        heading: `Dr ${pro.lastName}`,
        body: personalisedBody,
        ctaText: "Sign in to CadreHealth",
        ctaHref: "https://www.consultforafrica.com/oncadre/login",
        footer: "If this no longer applies to you, simply ignore this message.",
      });
      result.sent++;
    } catch (err) {
      result.failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (result.errorSample.length < 5) {
        result.errorSample.push({ email: pro.email, error: msg });
      }
      console.error(`[send-to-list] failed to send to ${pro.email}:`, err);
    }

    if (result.sent + result.failed < emails.length - result.skippedSuppressed - result.notFound) {
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "CadreProfessional",
    entityId: "targeted-list-batch",
    entityName: `Targeted list send to ${emails.length} addresses`,
    details: {
      cohortSize: emails.length,
      sent: result.sent,
      failed: result.failed,
      notFound: result.notFound,
      skippedSuppressed: result.skippedSuppressed,
      subject,
    },
  });

  return NextResponse.json(result);
});
