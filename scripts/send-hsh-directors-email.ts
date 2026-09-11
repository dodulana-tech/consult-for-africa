/**
 * Email the HSH board the enablement-phase cover note + three attachments:
 *   - Governance Training Curriculum
 *   - Board and Committee Handbook
 *   - Director's Duties and Conflicts Card
 *
 *   To:  directors@havanaspecialisthospital.com   (board distribution list)
 *   Cc:  debo.odulana@consultforafrica.com         (Debo's own copy / record)
 *   Reply-To: debo.odulana@consultforafrica.com
 *
 * Sends via the ZeptoMail HTTP API directly (the lib helper does not carry
 * attachments). Run with the env file so the API key is loaded, NOT plain SMTP:
 *   npx tsx --env-file=.env.local scripts/send-hsh-directors-email.ts
 *
 * Add --dry-run to build and validate everything WITHOUT sending.
 */
import fs from "fs";
import path from "path";

// ── minimal .env loader (so ZEPTOMAIL_* / SMTP_* are available standalone) ──
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

const DRY = process.argv.includes("--dry-run");

const TO = "directors@havanaspecialisthospital.com";
const CC = "debo.odulana@consultforafrica.com";
const REPLY_TO = "debo.odulana@consultforafrica.com";
const FROM = process.env.SMTP_FROM ?? "Consult For Africa <hello@consultforafrica.com>";
const SUBJECT =
  "The enablement phase, your training programme, handbook, and a card for the pocket";

const ATTACHMENTS: { file: string; name: string }[] = [
  { file: "docs/hsh-governance-training-curriculum-cfa.pdf", name: "HSH Governance Training Curriculum.pdf" },
  { file: "docs/hsh-board-committee-handbook-cfa.pdf", name: "HSH Board and Committee Handbook.pdf" },
  { file: "docs/hsh-duties-conflicts-card-cfa.pdf", name: "HSH Directors Duties and Conflicts Card.pdf" },
];

const TEXT = `Dear Directors,

Thank you again for the confidence to move into this next phase. With the operating model adopted, the work now turns to the part that makes it real: equipping each of us to govern well and hold the board to a high standard.

I am pleased to share three things ahead of the sessions:

- The training programme: a full curriculum that takes us, executive directors and management alike, from the fundamentals of a director's duties through to chairing a committee. Company law, and CAMA in particular, runs through all of it.
- The Board and Committee Handbook: the standing reference to keep close, how the board works, what each committee is for, and how each of us plays our part.
- A one-page duties and conflicts card: the essentials for the pocket, for the moments between meetings.

I am also glad to tell you that two experienced legal practitioners, Barr. Gesiye Otuogha and Barr. Osahon Omoruyi, senior legal counsel at Evercare Hospital, will deliver the legal side of the training with us. Between them we will cover company law and directors' duties end to end, taught from real hospital experience rather than a textbook.

None of this asks you to know it all on day one. Learning it is exactly what this phase is for, and it is entirely learnable with the support around you. Our aim is simple: to have a confident, well-run board and framework in place ahead of the September meeting.

I look forward to the sessions and to building this together.

Warm regards,
Debo

Dr Debo Odulana
Independent Non-Executive Director
Consult for Africa
hello@consultforafrica.com  ·  consultforafrica.com

Attachments: Governance Training Curriculum; Board and Committee Handbook; Director's Duties and Conflicts Card.`;

const HTML = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#1F2937;max-width:640px;">
  <p>Dear Directors,</p>
  <p>Thank you again for the confidence to move into this next phase. With the operating model adopted, the work now turns to the part that makes it real: equipping each of us to govern well and hold the board to a high standard.</p>
  <p>I am pleased to share three things ahead of the sessions:</p>
  <ul style="padding-left:20px;">
    <li style="margin-bottom:8px;"><strong>The training programme</strong>: a full curriculum that takes us, executive directors and management alike, from the fundamentals of a director's duties through to chairing a committee. Company law, and CAMA in particular, runs through all of it.</li>
    <li style="margin-bottom:8px;"><strong>The Board and Committee Handbook</strong>: the standing reference to keep close, how the board works, what each committee is for, and how each of us plays our part.</li>
    <li style="margin-bottom:8px;"><strong>A one-page duties and conflicts card</strong>: the essentials for the pocket, for the moments between meetings.</li>
  </ul>
  <p>I am also glad to tell you that two experienced legal practitioners, <strong>Barr. Gesiye Otuogha</strong> and <strong>Barr. Osahon Omoruyi</strong>, senior legal counsel at Evercare Hospital, will deliver the legal side of the training with us. Between them we will cover company law and directors' duties end to end, taught from real hospital experience rather than a textbook.</p>
  <p>None of this asks you to know it all on day one. Learning it is exactly what this phase is for, and it is entirely learnable with the support around you. Our aim is simple: to have a confident, well-run board and framework in place ahead of the September meeting.</p>
  <p>I look forward to the sessions and to building this together.</p>
  <p style="margin-bottom:2px;">Warm regards,<br>Debo</p>
  <p style="color:#6B7280;font-size:13px;margin-top:14px;">
    Dr Debo Odulana<br>
    Independent Non-Executive Director<br>
    Consult for Africa<br>
    hello@consultforafrica.com &nbsp;&middot;&nbsp; consultforafrica.com
  </p>
  <p style="color:#6B7280;font-size:12px;border-top:1px solid #E5E7EB;padding-top:10px;margin-top:16px;">
    Attachments: Governance Training Curriculum; Board and Committee Handbook; Director's Duties and Conflicts Card.
  </p>
</div>`;

function parseAddress(input: string): { address: string; name?: string } {
  const m = input.match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  return m ? { address: m[2].trim(), name: m[1].trim() } : { address: input.trim() };
}

async function main() {
  const attachments = ATTACHMENTS.map(({ file, name }) => {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) throw new Error(`Attachment not found: ${file} (build it first)`);
    return { content: fs.readFileSync(p).toString("base64"), mime_type: "application/pdf", name };
  });

  const rawKey = process.env.ZEPTOMAIL_API_KEY;
  if (!rawKey) throw new Error("ZEPTOMAIL_API_KEY not set. Run with: npx tsx --env-file=.env.local scripts/send-hsh-directors-email.ts");
  const apiKey = rawKey.replace(/^Zoho-enczapikey\s*/i, "").trim();

  const from = parseAddress(FROM);
  const body = {
    from: { address: from.address, name: from.name },
    to: [{ email_address: { address: TO } }],
    cc: [{ email_address: { address: CC } }],
    reply_to: [{ address: REPLY_TO }],
    subject: SUBJECT,
    htmlbody: HTML,
    textbody: TEXT,
    attachments,
  };

  console.log(`HSH directors email
  From:    ${FROM}
  To:      ${TO}
  Cc:      ${CC}
  ReplyTo: ${REPLY_TO}
  Subject: ${SUBJECT}
  Attach:  ${attachments.map((a) => a.name).join("; ")}
  Sizes:   ${ATTACHMENTS.map((a) => Math.round(fs.statSync(path.resolve(process.cwd(), a.file)).size / 1024) + "KB").join(", ")}
`);

  if (DRY) {
    console.log("DRY RUN, not sending. Everything validated and encoded OK.");
    return;
  }

  const res = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: {
      Authorization: `Zoho-enczapikey ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.details?.[0]?.message ?? data?.error?.message ?? data?.message ?? `HTTP ${res.status}`;
    throw new Error(`Send failed: ${msg}`);
  }
  console.log("Sent. requestId:", data?.request_id, "messageId:", data?.data?.[0]?.message_id);
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exitCode = 1;
});
