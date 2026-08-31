import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyInternal } from "@/lib/email";
import { FOUNDER_ROSTER } from "@/lib/haven-founders";

// Public, unauthenticated endpoint: anonymous survey submissions from the
// Haven diagnostic-audit forms (public/haven-audit.html, public/haven-patient-survey.html).
// No PII is collected; we store the raw form payload as JSON.

const HAVEN_ENGAGEMENT_ID = "cmqazdnsx0002nzx3kfh8gop0";
const ALLOWED = [
  "haven-safety-culture",
  "haven-patient-experience",
  // Founders' direction survey. Unlike the two above this is NOT anonymous:
  // the respondent's name rides inside `responses` (and the optional
  // top-level `respondent`), by design, so the board can compare instincts.
  "haven-leadership-instinct",
] as const;

const bodySchema = z.object({
  survey: z.enum(ALLOWED),
  respondent: z.string().max(120).optional(),
  submittedAt: z.string().optional(),
  responses: z.record(z.string(), z.any()),
});

const NOTIFY_TO = "debo.odulana@consultforafrica.com";
const ADMIN_URL = "https://www.consultforafrica.com/admin/haven-survey";

/** Short internal ping when a founder completes the direction survey. */
async function notifyFounderSubmission(respondent?: string) {
  const rows = await prisma.auditSurveyResponse.findMany({
    where: { survey: "haven-leadership-instinct" },
    select: { payload: true },
  });
  const names = rows
    .map((r) => String((r.payload as Record<string, unknown>)?.respondent ?? "").trim())
    .filter(Boolean);
  const done = new Set(names.map((n) => n.toLowerCase()));
  const outstanding = FOUNDER_ROSTER.filter((n) => !done.has(n.toLowerCase()));
  const who = respondent?.trim() || "A founder";
  const inCount = rows.length;

  const subject =
    outstanding.length === 0
      ? `Haven founders survey: all 5 in (${who} was last)`
      : `Haven founders survey: ${who} (${inCount} of 5)`;

  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1F2937">
<p><b>${who}</b> has completed the founders' direction survey.</p>
<p><b>${inCount} of 5 in.</b>${
    outstanding.length
      ? ` Still to complete: ${outstanding.join(", ")}.`
      : " That is everyone. The synthesis can be built."
  }</p>
<p><a href="${ADMIN_URL}" style="color:#0B3C5D">See the results</a></p>
</div>`;

  await notifyInternal(NOTIFY_TO, subject, html);
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }
    // guard against oversized payloads
    if (JSON.stringify(parsed.data.responses).length > 20_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    await prisma.auditSurveyResponse.create({
      data: {
        survey: parsed.data.survey,
        engagementId: HAVEN_ENGAGEMENT_ID,
        payload: parsed.data.responses,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    // The founders' survey is chased by name, so tell us the moment one lands.
    // Never let a notification failure fail the submission for the respondent.
    if (parsed.data.survey === "haven-leadership-instinct") {
      try {
        await notifyFounderSubmission(parsed.data.respondent);
      } catch (err) {
        console.error("[haven-audit] founder notification failed:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
