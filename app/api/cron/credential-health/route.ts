/**
 * Daily check of the credentials that fail silently.
 *
 * Daily rather than weekly on purpose: if the Google OAuth consent screen is
 * ever left in Testing status, Google expires the refresh token after seven
 * days. A weekly check could miss that window entirely and you would find out
 * from a client who never received an invitation.
 *
 * Only emails when something is wrong. An all-clear every morning is an email
 * nobody reads, and an alert nobody reads is the failure this exists to stop.
 */

import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";
import { runCredentialChecks } from "@/lib/credentialHealth";
import { notifyInternal } from "@/lib/email";

export const maxDuration = 60;

const ALERT_TO = (process.env.CREDENTIAL_ALERT_EMAIL ?? "hello@consultforafrica.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function authorise(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return req.headers.get("authorization") === `Bearer ${expected}`;
}

export const POST = handler(async function POST(req: NextRequest) { return run(req); });
export const GET = handler(async function GET(req: NextRequest) { return run(req); });

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function run(req: NextRequest): Promise<Response> {
  if (!authorise(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const checks = await runCredentialChecks();
  const failing = checks.filter((c) => !c.ok);

  if (failing.length > 0) {
    const rows = failing
      .map(
        (c) => `
        <div style="border-left:3px solid #DC2626;padding:12px 16px;margin:0 0 12px;background:#FEF2F2;border-radius:6px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#991B1B;">${esc(c.name)}</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#7F1D1D;">${esc(c.detail)}</p>
          ${c.remedy ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#7F1D1D;"><strong>Fix:</strong> ${esc(c.remedy)}</p>` : ""}
        </div>`,
      )
      .join("");

    const working = checks
      .filter((c) => c.ok)
      .map((c) => `<li style="margin:0 0 4px;">${esc(c.name)}: ${esc(c.detail)}</li>`)
      .join("");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#991B1B;">Platform check</p>
        <h1 style="margin:0 0 12px;font-size:20px;color:#0F2744;">${failing.length} thing${failing.length === 1 ? "" : "s"} ${failing.length === 1 ? "is" : "are"} broken and will not announce ${failing.length === 1 ? "itself" : "themselves"}</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">
          These fail without throwing anything a person would see. Left alone, you find out from whoever did not get invited.
        </p>
        ${rows}
        ${working ? `<p style="margin:20px 0 6px;font-size:13px;font-weight:600;color:#6B7280;">Working:</p><ul style="margin:0;padding-left:18px;font-size:13px;color:#6B7280;">${working}</ul>` : ""}
        <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;">Checked automatically each morning. You only hear from this when something is wrong.</p>
      </div>`;

    await notifyInternal(
      ALERT_TO,
      `${failing.map((c) => c.name).join(", ")}: needs attention`,
      html,
    ).catch((err) => console.error("[credential-health] alert email failed:", err));
  }

  // Logged either way, so a healthy run leaves a trace even though it is quiet.
  console.log(
    `[credential-health] ${checks.length} checked, ${failing.length} failing${failing.length ? ": " + failing.map((c) => c.name).join(", ") : ""}`,
  );

  return Response.json({
    ok: failing.length === 0,
    checkedAt: new Date().toISOString(),
    alerted: failing.length > 0,
    alertedTo: failing.length > 0 ? ALERT_TO : [],
    checks,
  });
}
