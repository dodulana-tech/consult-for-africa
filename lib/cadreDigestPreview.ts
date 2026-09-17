import {
  buildDigestForProfessional,
  renderDigestHtml,
  type DigestRecipient,
  type WeekContext,
} from "@/lib/cadreWeeklyDigest";
import { notifyInternal } from "@/lib/email";

/**
 * The dry run.
 *
 * Assembles the identical week for the identical people and puts one preview in
 * front of a human, instead of 901 emails in front of members. Sends nothing to
 * anybody on the list, writes no Communication rows, and issues no awards, so a
 * preview leaves no trace on any member's timeline.
 *
 * Lives here rather than in the route so the scheduled Thursday preview and a
 * preview run by hand are the same code. A preview that drifts from the send it
 * is previewing is worse than no preview.
 */

const PREVIEW_TO = (process.env.DIGEST_PREVIEW_EMAIL ?? "debo.odulana@consultforafrica.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface DigestPreview {
  previewedTo: string[];
  weekKey: string;
  ask: string;
  totalRecipients: number;
  asks: Record<string, number>;
  distinctSubjects: number;
  topSubjects: [string, number][];
  awardsWouldIssue: number;
}

export async function sendDigestPreview(
  recipients: DigestRecipient[],
  ctx: WeekContext,
  baseUrl: string,
): Promise<DigestPreview> {
  const subjects = new Map<string, number>();
  const asks = new Map<string, number>();
  const blocks = new Map<string, number>();
  const samples: { who: string; subject: string; html: string }[] = [];
  const seen = new Set<string>();

  for (const r of recipients) {
    const digest = buildDigestForProfessional(r, ctx);
    const { subject, html } = renderDigestHtml(digest, baseUrl);
    subjects.set(subject, (subjects.get(subject) ?? 0) + 1);
    asks.set(digest.ask.ask, (asks.get(digest.ask.ask) ?? 0) + 1);
    blocks.set(digest.onlyYou.kind, (blocks.get(digest.onlyYou.kind) ?? 0) + 1);

    // One example per distinct opening block, which is what actually varies.
    if (!seen.has(digest.onlyYou.kind) && samples.length < 3) {
      seen.add(digest.onlyYou.kind);
      samples.push({ who: `${r.cadre}${r.state ? ", " + r.state : ", no state"}`, subject, html });
    }
  }

  const topSubjects = [...subjects.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8) as [string, number][];
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${esc(k)}</td>
         <td style="padding:6px 12px;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #F3F4F6;">${esc(v)}</td></tr>`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;color:#374151;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#D4AF37;">Dry run, nothing was sent</p>
      <h1 style="margin:0 0 4px;font-size:22px;color:#0F2744;">CadreHealth weekly, ${esc(ctx.weekKey)}</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">This is what goes out on Friday at 08:00 Lagos. No member was emailed, no award was issued, and nothing was written to anybody's timeline.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:0 0 18px;">
        ${row("Recipients", String(recipients.length))}
        ${row("The week's ask", ctx.ask)}
        ${[...asks.entries()].map(([a, n]) => row(`asked ${a}`, String(n))).join("")}
        ${row("Distinct subject lines", String(subjects.size))}
        ${row("Largest single block", `${topSubjects[0]?.[1] ?? 0} of ${recipients.length}`)}
        ${row("Awards that would be issued", String(ctx.awardsIssued))}
      </table>
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0F2744;">Opening block, by kind</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:0 0 18px;">
        ${[...blocks.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => row(k, String(n))).join("")}
      </table>
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0F2744;">Subject lines</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;margin:0 0 24px;">
        ${topSubjects.map(([sub, n]) => row(sub, String(n))).join("")}
      </table>
      <p style="margin:0 0 10px;font-size:13px;color:#6B7280;">Three real examples follow, one per opening block, rendered exactly as they would arrive. To stop Friday's send, disable the cron in Vercel.</p>
    </div>
    ${samples
      .map(
        (sm) => `
      <div style="margin:24px 0 8px;padding:10px 14px;background:#0F2744;border-radius:8px;">
        <p style="margin:0;font-size:12px;color:#D4AF37;font-weight:700;">${esc(sm.who)}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#fff;">Subject: ${esc(sm.subject)}</p>
      </div>
      ${sm.html}`,
      )
      .join("")}`;

  await notifyInternal(
    PREVIEW_TO,
    `Dry run: CadreHealth weekly ${ctx.weekKey}, ${recipients.length} recipients, ask is ${ctx.ask}`,
    html,
  );

  return {
    previewedTo: PREVIEW_TO,
    weekKey: ctx.weekKey,
    ask: ctx.ask,
    totalRecipients: recipients.length,
    asks: Object.fromEntries(asks),
    distinctSubjects: subjects.size,
    topSubjects,
    awardsWouldIssue: ctx.awardsIssued,
  };
}
