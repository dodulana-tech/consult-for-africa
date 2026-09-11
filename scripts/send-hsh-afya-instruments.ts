/**
 * Send the HSH board and committee instruments to Afya Care's operational lead.
 *
 * One email:
 *   Favour Olewuenyi (Afya Care), cc Debo.
 *   The instruments pack, every instrument as a working Word/Excel file, and
 *   the manager's card from the management interface session. Written around
 *   the committee-meeting templates, since that is what she asked for and what
 *   the Afya-HSH Governance Committee runs on.
 *
 * Sends via the ZeptoMail HTTP API only. Never Zoho SMTP.
 *
 * Dry run (default, validates and encodes but does not send):
 *   npx tsx --env-file=.env.local scripts/send-hsh-afya-instruments.ts
 * Send for real:
 *   npx tsx --env-file=.env.local scripts/send-hsh-afya-instruments.ts --send
 */
import fs from "fs";
import path from "path";

const SEND = process.argv.includes("--send");

const FAVOUR = "Favour.olewuenyi@afya.care";
const DEBO = "debo.odulana@consultforafrica.com";
const FROM = { address: "hello@consultforafrica.com", name: "Consult for Africa" };

type Attach = { file: string; name: string; mime: string };

const PACK: Attach = {
  file: "docs/hsh-board-instruments-pack-cfa.pdf",
  name: "HSH Board and Committee Instruments Pack.pdf",
  mime: "application/pdf",
};
const ZIP: Attach = {
  file: "docs/hsh-board-instruments-pack-cfa.zip",
  name: "HSH Board and Committee Instruments, working files.zip",
  mime: "application/zip",
};
const CARD: Attach = {
  file: "docs/hsh-manager-card-cfa.pdf",
  name: "HSH Manager's Card, reporting and escalation.pdf",
  mime: "application/pdf",
};

const SUBJECT =
  "Havana Specialist Hospital: the board and committee instruments, and the meeting templates";

const TEXT = `Dear Favour,

As requested, here is the Havana board and committee instruments pack, with the templates for committee meetings.

Three things are attached. The pack itself, which explains the system and why each instrument is shaped the way it is. A zip containing every instrument as an individual Word or Excel file, so nothing has to be rebuilt. And a one-page card on reporting and escalation, which is the short version of all of it and the one thing worth keeping on the desk.

THE TEMPLATES FOR COMMITTEE MEETINGS
In the zip, these are the ones you will use:

02  Agenda template. The standing shape of a committee agenda, set with the Company Secretary.
04  Committee report template, generic. One page, the same shape for all five board committees and for the Afya-HSH Governance Committee, so the board reads six reports in one familiar format.
04f Committee report, prefilled for the Afya-HSH Governance Committee. This is yours. It is already scoped to operational performance against the agreed KPI set, partnership milestones, service issues and their resolution, decisions taken within delegated authority, and matters being escalated to the board.
05  Management report by exception. Three pages maximum, for the board, written by the Medical Director with the Afya operational lead.
08  Minutes template, and 09, the action and decision log, which is what carries an item from one meeting to the next rather than letting it quietly disappear.
06  The performance dashboard and KPI pack, produced monthly for the joint committee and consolidated quarterly for the board.

TWO RULES THAT MAKE THEM WORK
First, nothing reaches the board except through one of these instruments. A verbal update with no paper behind it is not a board item. Second, every template asks the same four things at the end: what is the position against target, what is the exception, what is the risk, and what decision is requested. Once the shape is familiar, any instrument in the pack can be filled in quickly.

THE SEQUENCING, WHICH IS THE PART THAT BITES
The Afya-HSH Governance Committee meets monthly, first Tuesday. The board committees meet two to three weeks before the board. The board pack is circulated seven clear days before the meeting, and nothing is added after it goes out.

For this cycle that means committee week runs from Tuesday 8 to Tuesday 15 September, the management report is with the Company Secretary by Monday 14 September, the pack circulates on Thursday 17 September, and the board meets on Thursday 24 September to adopt the suite.

The escalation thresholds and the delegation bands are deliberately left blank in the documents. They are the board's to set, and they are on the agenda for the 24th. The structure holds whatever the numbers turn out to be.

If it would help, I am happy to spend half an hour with you and the team before next week's committee week, walking through 04f and 05 on a real set of numbers rather than on the template. That tends to be worth more than reading them cold. Do say if that would be useful and I will find a time.

Warm regards,
Debo

Dr Debo Odulana
Independent Non-Executive Director, Havana Specialist Hospital
Founding Partner, Consult for Africa
hello@consultforafrica.com  ·  consultforafrica.com`;

// ------------------------------------------------------------------- sending
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const html = (t: string) =>
  `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1F2937">${esc(
    t
  ).replace(/\n/g, "<br>")}</div>`;

function encode(a: Attach) {
  const p = path.resolve(process.cwd(), a.file);
  if (!fs.existsSync(p)) throw new Error(`Attachment not found: ${a.file} (build it first)`);
  return {
    content: fs.readFileSync(p).toString("base64"),
    mime_type: a.mime,
    name: a.name,
    _kb: Math.round(fs.statSync(p).size / 1024),
  };
}

async function main() {
  const rawKey = process.env.ZEPTOMAIL_API_KEY;
  if (!rawKey) {
    throw new Error(
      "ZEPTOMAIL_API_KEY not set. Run with: npx tsx --env-file=.env.local scripts/send-hsh-afya-instruments.ts"
    );
  }
  const apiKey = rawKey.replace(/^Zoho-enczapikey\s*/i, "").trim();

  const attachments = [PACK, ZIP, CARD].map(encode);
  const totalKb = attachments.reduce((s, a) => s + a._kb, 0);

  console.log(`
  From:    ${FROM.name} <${FROM.address}>
  To:      ${FAVOUR}
  Cc:      ${DEBO}
  Subject: ${SUBJECT}
  Attach:  ${attachments.map((a) => `${a.name} (${a._kb}KB)`).join("\n           ")}
  Total:   ${totalKb}KB`);

  if (!SEND) {
    console.log("\n  DRY RUN, not sent. Validated and encoded OK.");
    console.log("  To send: npx tsx --env-file=.env.local scripts/send-hsh-afya-instruments.ts --send");
    return;
  }

  const body = {
    from: FROM,
    to: [{ email_address: { address: FAVOUR } }],
    cc: [{ email_address: { address: DEBO } }],
    reply_to: [{ address: DEBO }],
    subject: SUBJECT,
    htmlbody: html(TEXT),
    textbody: TEXT,
    attachments: attachments.map(({ content, mime_type, name }) => ({
      content,
      mime_type,
      name,
    })),
  };

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
    const msg =
      data?.error?.details?.[0]?.message ??
      data?.error?.message ??
      data?.message ??
      `HTTP ${res.status}`;
    throw new Error(`send failed: ${msg}`);
  }
  console.log(
    `\n  Sent. requestId: ${data?.request_id}  messageId: ${data?.data?.[0]?.message_id}`
  );
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exitCode = 1;
});
