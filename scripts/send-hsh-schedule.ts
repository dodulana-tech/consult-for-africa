/**
 * Email the Havana Specialist Hospital enablement SCHEDULE to Debo (forward-ready).
 *
 *   To: debo.odulana@consultforafrica.com
 *   Attachment: docs/hsh-governance-enablement-proposal-cfa.pdf
 *
 * Sends via Zoho SMTP. Run:
 *   npx ts-node --transpile-only scripts/send-hsh-schedule.ts
 */
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

for (const f of [".env", ".env.local"]) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const TO = "directors@havanaspecialisthospital.com, ugonwokoro@havanaspecialisthospital.com";
const CC = "debo.odulana@consultforafrica.com";
const SUBJECT = "Havana Specialist Hospital, governance enablement: our plan and schedule";
const SCHEDULE = path.resolve(process.cwd(), "docs/hsh-enablement-schedule-cfa.pdf");
const PROPOSAL = path.resolve(process.cwd(), "docs/hsh-governance-enablement-proposal-cfa.pdf");

const TEXT = `Dear Directors,

Thank you for the nudge, and you are right: you should have heard from us sooner after mobilisation, and I am sorry for the quiet week. That is not the standard we hold ourselves to, and it is put right from here, including a short written update from us at the end of each phase so you always know where things stand.

Here is the plan for the work, with tentative, high-level dates we will confirm with you at kickoff. The engagement builds Havana's board and committee instruments and trains the executive directors and management to run the board and its committees well. It runs over about six weeks, followed by light support through the first governance cycle.

PHASE 1 — Kickoff and instruments   (tentative: week of 28 July to mid-August)
We finalise the board pack template, the committee report templates, the agenda, minutes and action-log templates, the annual board calendar, and the Delegation of Authority and committee terms of reference, working alongside your Company Secretary.
From you: a named point of contact (ideally the Company Secretary), access to the current board papers, and 45 minutes for a kickoff call.

PHASE 2 — Training and capability   (tentative: 11 to 29 August)
Practical working sessions for the executive directors and management: reporting and escalation, using the templates, chairing a committee, and how information should flow between management, the Afya-HSH Governance Committee, the committees, and the Board.
From you: scheduling two to three short sessions with the directors and management.

PHASE 3 — Handbook and handover   (tentative: week of 1 September)
The Board and Committee Handbook, and a clean handover to the Company Secretary so the system runs without us.
From you: a final review session.

PHASE 4 — Supported first cycle (optional)   (tentative: September to November)
We attend and quietly coach through the first board and committee meetings, refining the templates against real use.

Immediate next step: a 30 to 45 minute kickoff call. Could we hold it on Tuesday 28 or Wednesday 29 July? On that call we confirm the point of contact, agree the document list, and lock these dates.

The attached plan sets this schedule out visually, phase by phase, and the proposal covers the full scope and terms for reference. Thank you again, we are glad to be underway and looking forward to it.

Warm regards,
Debo

Dr Debo Odulana
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  consultforafrica.com`;

const HTML = TEXT.replace(/\n/g, "<br>");

async function main() {
  for (const p of [SCHEDULE, PROPOSAL]) if (!fs.existsSync(p)) throw new Error(`PDF not found at ${p}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  const replyTo = process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com";

  console.log(`Sending HSH schedule email...\n  From: ${from}\n  To:   ${TO}\n  Cc:   ${CC}`);

  const info = await transporter.sendMail({
    from, to: TO, cc: CC, replyTo, subject: SUBJECT, text: TEXT, html: HTML,
    attachments: [
      { filename: "HSH Enablement Plan & Schedule.pdf", path: SCHEDULE, contentType: "application/pdf" },
      { filename: "HSH Governance Enablement Proposal.pdf", path: PROPOSAL, contentType: "application/pdf" },
    ],
  });

  console.log("\n✓ Sent. messageId:", info.messageId);
  console.log("  accepted:", info.accepted, " rejected:", info.rejected);
}

main().catch((e) => { console.error("✗ Send failed:", e.message); process.exit(1); });
