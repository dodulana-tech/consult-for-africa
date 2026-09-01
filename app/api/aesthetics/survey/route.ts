import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyInternal } from "@/lib/email";

// Public, unauthenticated endpoint for the aesthetics partnership position
// survey (public/aesthetics-partnership-survey.html).
//
// Deliberately NOT anonymous. There are three principals and the whole point is
// to compare their stated positions against each other, so the respondent's
// name rides in the payload.
//
// The survey exists because the numbers that matter, being the visits Dr
// Kpaduwa can genuinely sustain and the capital Medbury will genuinely commit,
// are the ones nobody wants to be first to state in a group chat.

const ALLOWED = [
  "aesthetics-clinical-partner",
  "aesthetics-capital-partner",
  "aesthetics-operating-partner",
] as const;

const bodySchema = z.object({
  survey: z.enum(ALLOWED),
  respondent: z.string().min(1).max(120),
  submittedAt: z.string().optional(),
  responses: z.record(z.string(), z.any()),
});

const NOTIFY_TO = "debo.odulana@consultforafrica.com";

const ROLE_LABEL: Record<(typeof ALLOWED)[number], string> = {
  "aesthetics-clinical-partner": "clinical partner",
  "aesthetics-capital-partner": "capital partner",
  "aesthetics-operating-partner": "operating partner",
};

/** Which of the three principals are still outstanding. */
async function outstanding(): Promise<string[]> {
  const rows = await prisma.auditSurveyResponse.findMany({
    where: { survey: { in: [...ALLOWED] } },
    select: { survey: true },
  });
  const done = new Set(rows.map((r) => r.survey));
  return ALLOWED.filter((s) => !done.has(s)).map((s) => ROLE_LABEL[s]);
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!,
  );
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
        payload: {
          respondent: parsed.data.respondent,
          submittedAt: parsed.data.submittedAt ?? new Date().toISOString(),
          ...parsed.data.responses,
        },
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    const still = await outstanding();
    const who = esc(parsed.data.respondent.trim());
    const role = ROLE_LABEL[parsed.data.survey];
    const subject =
      still.length === 0
        ? `Aesthetics survey: all three in (${who} was last)`
        : `Aesthetics survey: ${who} (${role})`;

    const rows = Object.entries(parsed.data.responses)
      .filter(([, v]) => String(v ?? "").trim().length > 0)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#6B7280;vertical-align:top;white-space:nowrap">${esc(k)}</td>` +
          `<td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(String(v))}</td></tr>`,
      )
      .join("");

    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1F2937">
<p><b>${who}</b> has completed the ${esc(role)} survey.</p>
<p>${still.length ? `Still outstanding: ${still.map(esc).join(", ")}.` : "That is all three. The positions can be compared."}</p>
<table style="border-collapse:collapse;font-size:13px;margin-top:12px">${rows}</table>
</div>`;

    await notifyInternal(NOTIFY_TO, subject, html);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record submission" }, { status: 500 });
  }
}
