/**
 * Send the Haven Paediatrics organisational audit to the five founders.
 *
 * Five individual emails, one per founder, personalised salutation, cc Debo.
 * Never a bulk To/Cc. Attaches the full report and the board deck, and links
 * the founders' direction survey that sets up the strategy session.
 *
 * Sends via the ZeptoMail HTTP API only. Never Zoho SMTP.
 *
 * Dry run (default, encodes attachments and prints, sends nothing):
 *   npx tsx --env-file=.env.local scripts/send-haven-audit-report.ts
 * Test to Debo only:
 *   npx tsx --env-file=.env.local scripts/send-haven-audit-report.ts --test --send
 * Live to the five founders:
 *   npx tsx --env-file=.env.local scripts/send-haven-audit-report.ts --send
 */
import fs from "fs";
import path from "path";

const SEND = process.argv.includes("--send");
const TEST = process.argv.includes("--test");

const DEBO = "debo.odulana@consultforafrica.com";
const FROM = { address: "hello@consultforafrica.com", name: "Consult for Africa" };
const SURVEY_URL = "https://www.consultforafrica.com/haven-leadership-survey.html";

const FOUNDERS = [
  { first: "Kabir",    salutation: "Kabir",        email: "kabir@aurorahills.co" },
  { first: "Abisodun", salutation: "Mrs Alli",     email: "abisodunalli@yahoo.com" },
  { first: "Shakirah", salutation: "Dr Saliu",     email: "shakirahsaliu@gmail.com" },
  { first: "Odedina",  salutation: "Dr Odedina",   email: "gbajoodedina@gmail.com" },
  { first: "Ogochukwu",salutation: "Ogochukwu",    email: "odumogo@gmail.com" },
];

const ATTACHMENTS = [
  { file: "docs/haven-organisational-audit-report-cfa.pdf",
    name: "Haven Paediatrics - Organisational Audit Report.pdf" },
  { file: "docs/haven-audit-findings-deck-cfa.pdf",
    name: "Haven Paediatrics - Audit Findings for the Board.pdf" },
];

const SUBJECT = "Haven Paediatrics: the audit report, and one thing we need from each of you";

function body(salutation: string) {
  return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.62;color:#1F2937;max-width:620px">
<p>Dear ${salutation},</p>

<p>The organisational audit is finished. You have seen the documents on WhatsApp already; this is the
formal copy for your records. Both are attached: the full report, and the shorter deck we will work
from at the board session.</p>

<p>A word on how to read it. Your patients rate you 4.60 out of 5 and thirteen of fifteen would
definitely recommend you to another family. Your staff rate the safety of the care they give as very
good or excellent in twenty-two cases out of twenty-three. That is the hard part, and it is done.
What the report describes is a hospital that has grown faster than the systems around it. Almost
none of it is the fault of the people doing the work.</p>

<p>If you read three things, read the note at the front, Section 8, and Section 28.</p>

<p><b>One thing we need from each of you before the strategy session.</b> There is a short survey,
about twenty minutes, and it is the reason the session will be worth holding. It is built on forced
choices rather than agreement scales, because asked whether you support investing in staff and being
financially disciplined, all five of you will say yes, and that teaches us nothing. Please complete
it on your own and do not confer with the others first. The divergence is the point.</p>

<p style="margin:26px 0">
  <a href="${SURVEY_URL}"
     style="background:#0B3C5D;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:4px;
            font-weight:bold;display:inline-block">Complete the founders' survey</a>
</p>

<p style="font-size:13.5px;color:#6B7280">If the button does not work, the link is
<a href="${SURVEY_URL}" style="color:#0B3C5D">${SURVEY_URL}</a></p>

<p>We will synthesise all five and bring the pattern back to you before the session, so nobody walks
in cold. Individual answers are not attributed to you without your say-so.</p>

<p>Happy to walk any of you through the report before we all sit down.</p>

<p style="margin-top:26px">Warm regards,<br>Debo</p>

<p style="font-size:13px;color:#6B7280;margin-top:22px;padding-top:14px;border-top:1px solid #E5E7EB">
Dr Debo Odulana<br>Founding Partner, Consult for Africa<br>
hello@consultforafrica.com &nbsp;&middot;&nbsp; +234 913 813 8553 &nbsp;&middot;&nbsp; consultforafrica.com
</p>
</div>`;
}

async function main() {
  const files = ATTACHMENTS.map((a) => {
    const p = path.join(process.cwd(), a.file);
    if (!fs.existsSync(p)) throw new Error(`Missing attachment: ${a.file}`);
    const buf = fs.readFileSync(p);
    console.log(`  attachment ${a.name}  ${(buf.length / 1024).toFixed(0)} KB`);
    return { name: a.name, content: buf.toString("base64"), mime_type: "application/pdf" };
  });

  const recipients = TEST
    ? [{ first: "Debo", salutation: "Debo (test send)", email: DEBO }]
    : FOUNDERS;

  console.log(`\n${TEST ? "TEST" : "LIVE"} mode, ${recipients.length} email(s), ` +
              `${SEND ? "SENDING" : "DRY RUN"}\n`);

  if (!SEND) {
    recipients.forEach((r) => console.log(`  would send to ${r.email}  (cc ${DEBO})`));
    console.log(`\nSubject: ${SUBJECT}`);
    console.log(`Survey:  ${SURVEY_URL}`);
    console.log("\nDry run only. Add --send to dispatch.");
    return;
  }

  const rawKey = process.env.ZEPTOMAIL_API_KEY;
  if (!rawKey) {
    throw new Error(
      "ZEPTOMAIL_API_KEY not set. Run with: npx tsx --env-file=.env.local " +
      "scripts/send-haven-audit-report.ts --send"
    );
  }
  const apiKey = rawKey.replace(/^Zoho-enczapikey\s*/i, "").trim();

  for (const r of recipients) {
    const payload: any = {
      from: FROM,
      to: [{ email_address: { address: r.email, name: r.first } }],
      subject: SUBJECT,
      htmlbody: body(r.salutation),
      attachments: files,
    };
    if (!TEST) payload.cc = [{ email_address: { address: DEBO, name: "Debo Odulana" } }];

    const res = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        Authorization: `Zoho-enczapikey ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data: any = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.details?.[0]?.message ?? data?.error?.message ??
                  data?.message ?? `HTTP ${res.status}`;
      throw new Error(`[${r.email}] send failed: ${msg}`);
    }
    console.log(`  Sent to ${r.email}  messageId: ${data?.data?.[0]?.message_id ?? "?"}`);
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
