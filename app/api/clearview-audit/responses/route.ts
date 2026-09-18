import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyInternal } from "@/lib/email";

// Public, unauthenticated endpoint: submissions from the five Clearview forms.
// Generated from lib/clearview-survey.ts by
// scripts/build-clearview-survey-pages.ts into public/clearview-*-survey.html.
//
//   clearview-patient     (anonymous)   patients who have had treatment
//   clearview-enquirer    (anonymous)   people who got in touch and did not proceed
//   clearview-staff       (anonymous)   everyone who works in either business
//   clearview-referrer    (attributed)  referring gynaecologists
//   clearview-leadership  (attributed)  Dr Ajayi and the senior team
//
// The three anonymous forms collect no PII at all: the client script strips
// `respondent` before posting and the schema below refuses it for those ids, so
// an anonymous submission cannot carry a name even if the form is tampered with.
// Mirrors app/api/dennis-ashley-audit/responses.

const ANONYMOUS = ["clearview-patient", "clearview-enquirer", "clearview-staff"] as const;
const ATTRIBUTED = ["clearview-referrer", "clearview-leadership"] as const;
const ALLOWED = [...ANONYMOUS, ...ATTRIBUTED] as const;

type Survey = (typeof ALLOWED)[number];

const isAnonymous = (s: Survey): boolean =>
  (ANONYMOUS as readonly string[]).includes(s);

// Who we want to hear about the moment it lands, and why.
const NOTIFIES: Record<string, string> = {
  "clearview-enquirer": "Someone who did not proceed has completed the Clearview enquirer survey",
  "clearview-referrer": "A referring colleague has completed the Clearview referrer survey",
  "clearview-leadership": "A Clearview leader has completed the direction survey",
};

const bodySchema = z.object({
  survey: z.enum(ALLOWED),
  respondent: z.string().max(120).optional(),
  submittedAt: z.string().optional(),
  responses: z.record(z.string(), z.any()),
});

const NOTIFY_TO = "debo.odulana@consultforafrica.com";
const ADMIN_URL = "https://www.consultforafrica.com/admin/clearview-audit";

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
    const { survey, responses } = parsed.data;

    if (JSON.stringify(responses).length > 20_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // An anonymous instrument must stay anonymous, whatever arrives.
    const respondent = isAnonymous(survey) ? undefined : parsed.data.respondent;
    if (isAnonymous(survey) && "respondent" in responses) {
      delete (responses as Record<string, unknown>).respondent;
    }

    await prisma.auditSurveyResponse.create({
      data: {
        survey,
        payload: responses,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    // Never let a notification failure fail the submission for the respondent.
    if (NOTIFIES[survey]) {
      try {
        await notifySubmission(survey, respondent);
      } catch (err) {
        console.error("[clearview-audit] notification failed:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
