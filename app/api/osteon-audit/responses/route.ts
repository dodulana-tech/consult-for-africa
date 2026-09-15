import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyInternal } from "@/lib/email";

// Public, unauthenticated endpoint: submissions from the four Osteon Clinics
// organisational-audit forms.
//
//   public/osteon-staff-survey.html      -> osteon-staff-culture       (anonymous)
//   public/osteon-patient-survey.html    -> osteon-patient-experience  (anonymous)
//   public/osteon-referrer-survey.html   -> osteon-referrer            (attributed)
//   public/osteon-leadership-survey.html -> osteon-leadership-direction (attributed)
//
// The two anonymous forms collect no PII at all. The two attributed ones carry
// the respondent's name inside `responses` by design, because a referrer's
// answer is only actionable if we know which referrer gave it and the
// leadership instrument exists to compare named views against each other.

const ALLOWED = [
  "osteon-staff-culture",
  "osteon-patient-experience",
  "osteon-referrer",
  "osteon-leadership-direction",
] as const;

// Attributed surveys are chased by name, so tell us the moment one lands.
const NOTIFIES: Record<string, string> = {
  "osteon-referrer": "A referring doctor has completed the Osteon referrer survey",
  "osteon-leadership-direction": "An Osteon leader has completed the direction survey",
};

const bodySchema = z.object({
  survey: z.enum(ALLOWED),
  respondent: z.string().max(120).optional(),
  submittedAt: z.string().optional(),
  responses: z.record(z.string(), z.any()),
});

const NOTIFY_TO = "debo.odulana@consultforafrica.com";
const ADMIN_URL = "https://www.consultforafrica.com/admin/osteon-survey";

async function notifySubmission(survey: string, respondent?: string) {
  const count = await prisma.auditSurveyResponse.count({ where: { survey } });
  const who = respondent?.trim() || "Someone";
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1F2937">
<p><b>${who}</b> has completed the <b>${survey}</b> survey.</p>
<p>That is <b>${count}</b> in so far.</p>
<p><a href="${ADMIN_URL}" style="color:#0B3C5D">See the results</a></p>
</div>`;
  await notifyInternal(NOTIFY_TO, `${NOTIFIES[survey]} (${count} in)`, html);
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }
    if (JSON.stringify(parsed.data.responses).length > 20_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    await prisma.auditSurveyResponse.create({
      data: {
        survey: parsed.data.survey,
        payload: parsed.data.responses,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    // Never let a notification failure fail the submission for the respondent.
    if (NOTIFIES[parsed.data.survey]) {
      try {
        await notifySubmission(parsed.data.survey, parsed.data.respondent);
      } catch (err) {
        console.error("[osteon-audit] notification failed:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
