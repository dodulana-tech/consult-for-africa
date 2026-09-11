/**
 * Send the HSH board instruments and the governance training summary.
 *
 * Two emails, in one run:
 *   1. BOARD  -> directors@havanaspecialisthospital.com + Ugo Nwokoro
 *               cc Susan Ofuasia (Company Secretary) and Debo
 *               The training summary and the instrument suite.
 *   2. COMPANY SECRETARY -> Susan Ofuasia, cc Ugo and Debo
 *               A note directed to her, requesting a working meeting on
 *               Company Secretary alignment, since she administers the suite.
 *
 * Sends via the ZeptoMail HTTP API only. Never Zoho SMTP.
 *
 * Dry run (default, validates and encodes but does not send):
 *   npx tsx --env-file=.env.local scripts/send-hsh-instruments.ts
 * Send for real:
 *   npx tsx --env-file=.env.local scripts/send-hsh-instruments.ts --send
 */
import fs from "fs";
import path from "path";

const SEND = process.argv.includes("--send");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

const DIRECTORS = "directors@havanaspecialisthospital.com";
const UGO = "ugonwokoro@havanaspecialisthospital.com";
const SECRETARY = "s.ofuasia@ootnominees.com";
const DEBO = "debo.odulana@consultforafrica.com";
const FROM = { address: "hello@consultforafrica.com", name: "Consult for Africa" };

type Attach = { file: string; name: string; mime: string };

const SUMMARY: Attach = {
  file: "docs/hsh-training-summary-cfa.pdf",
  name: "HSH Governance Training, Summary of the Programme.pdf",
  mime: "application/pdf",
};
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

// --------------------------------------------------------------- board email
const BOARD_SUBJECT =
  "Havana Specialist Hospital: governance training complete, and the board instruments";

const BOARD_TEXT = `Dear Directors,

The governance training programme is complete, and the board and committee instruments are ready. Both are attached, and this note is the short account of where we now stand.

WHAT WAS DELIVERED
Ten modules across five domains, taught as working sessions rather than lectures and practised on Havana's own documents rather than on generic examples. Barr. Gesiye Otuogha carried CAMA 2020 and directors' duties, Barr. Osahon Omoruyi carried practical board management and the legal side of clinical governance from live hospital experience, and Consult for Africa carried the operating model and the governance craft. Company law ran through the whole programme as a spine rather than as a single lecture, so the duties were reinforced ten times rather than covered once.

WHAT THE BOARD CAN NOW DO
Every director understands their duties under CAMA, can read and challenge a board pack, handles a conflict correctly, and governs without reaching into management. Every committee chair can set an agenda, run a compliant meeting, reach and record a decision, and report to the board on one page. Management and the Company Secretary can report by exception, escalate correctly, and keep the board's statutory records to standard.

THE INSTRUMENTS
Training on its own does not change a single meeting, so it comes with the instruments. The attached pack contains the eleven working instruments the board and committees now run on: the consolidated board pack, the agenda, the one-page board paper, the committee report used in common by all five committees and the Afya-HSH Governance Committee, the management report by exception, the performance dashboard and KPI pack, the risk register, the minutes, the action and decision log, the escalation thresholds schedule, and the registers of interests and attendance. A rolling twelve-month calendar sits alongside them.

Each instrument is also attached as an individual Word or Excel file, in the zip, so nothing has to be rebuilt from scratch.

WHAT THE BOARD IS ASKED TO DO IN SEPTEMBER
Six decisions turn this from a set of documents into the way Havana runs:

1. Adopt the instrument suite, with effect from the September meeting.
2. Set the escalation thresholds, filling the bracketed values.
3. Set the RAG thresholds for the dashboard metrics.
4. Adopt the calendar, and confirm six-weekly for the first three meetings before settling to quarterly.
5. Confirm the delegation thresholds, which the escalation schedule depends on.
6. Instruct the Company Secretary to administer the suite and report compliance with the seven-day pack rule at each meeting.

Deliberately, the thresholds are left blank. They are the board's to set, not the adviser's, and they are the substance of decisions two, three, and five.

TWO THINGS TO CONFIRM
The confirmed date of the September board meeting, which fixes the pack circulation date seven clear days before it, and Havana's financial year end, which fixes the annual general meeting and the annual return in the calendar. I am picking both up with Susan Ofuasia directly.

The test of all this is not that we sat through a programme. It is that the September meeting runs like the model: papers out seven days ahead and read, conflicts declared and minuted, exceptions challenged rather than received, decisions recorded with their reasons, and the Afya partnership taken as a standing item. Havana is now equipped for that.

Please do come back to me on anything here, and I will bring the adoption items to the September agenda.

Warm regards,
Debo

Dr Debo Odulana
Independent Non-Executive Director
Consult for Africa
hello@consultforafrica.com  ·  consultforafrica.com`;

// ---------------------------------------------------- company secretary email
const SEC_SUBJECT =
  "Havana Specialist Hospital: the board instruments, and a meeting on Company Secretary alignment";

const SEC_TEXT = `Dear Susan,

I hope this finds you well.

The governance training for the Havana board and management is now complete, and the board and committee instruments are ready. I am sending them to you directly as well as to the board, because the suite is designed to be administered by the Company Secretary, and that means most of it lands with you.

Attached are the instruments pack, which explains the system and why each instrument is shaped as it is, the training summary for context, and a zip containing every instrument as an individual Word or Excel file so nothing has to be rebuilt.

WHAT SITS WITH YOUR OFFICE
The consolidated board pack and the seven-day circulation rule, the agenda and minutes, the rolling action and decision log, the registers of interests, attendance, and related-party transactions, the annual board and committee calendar, and reporting compliance with the pack rule at each meeting.

COULD WE MEET
I would like to sit down with you for about forty five minutes, before the September board meeting, to align on how this runs in practice rather than leave it to the documents. I would want to cover:

1. Pack assembly and the seven-day rule: how the pack is compiled, who chases whom, and how we report compliance to the board.
2. The registers: how the interests, attendance, and related-party registers are maintained, and the annual refresh of declarations.
3. The minute standard: recording decisions and their reasons, and handling declarations and recusals precisely.
4. The calendar: confirming the September board date, the committee week that feeds it, and the sequencing thereafter.
5. Havana's financial year end and incorporation date, so the annual general meeting and the annual return sit correctly in the calendar.
6. Anything in the suite you would change. You will administer it, so your view on what is workable carries real weight, and I would rather adjust it now than have it strain in practice.

Could you let me know a couple of times that suit you over the next two weeks? I am happy to come to you, or to meet by video, whichever is easier. If it is simpler, tell me what works and I will fit around it.

Thank you, and I look forward to working together on this.

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

type Job = {
  key: string;
  to: string[];
  cc: string[];
  subject: string;
  text: string;
  attachments: Attach[];
};

const JOBS: Job[] = [
  {
    key: "board",
    to: [DIRECTORS, UGO],
    cc: [SECRETARY, DEBO],
    subject: BOARD_SUBJECT,
    text: BOARD_TEXT,
    attachments: [SUMMARY, PACK, ZIP],
  },
  {
    key: "secretary",
    to: [SECRETARY],
    cc: [UGO, DEBO],
    subject: SEC_SUBJECT,
    text: SEC_TEXT,
    attachments: [PACK, SUMMARY, ZIP],
  },
];

async function main() {
  const rawKey = process.env.ZEPTOMAIL_API_KEY;
  if (!rawKey) {
    throw new Error(
      "ZEPTOMAIL_API_KEY not set. Run with: npx tsx --env-file=.env.local scripts/send-hsh-instruments.ts"
    );
  }
  const apiKey = rawKey.replace(/^Zoho-enczapikey\s*/i, "").trim();

  const jobs = ONLY ? JOBS.filter((j) => j.key === ONLY) : JOBS;
  if (!jobs.length) throw new Error(`No job matches --only=${ONLY}`);

  for (const job of jobs) {
    const attachments = job.attachments.map(encode);
    const totalKb = attachments.reduce((s, a) => s + a._kb, 0);

    console.log(`\n[${job.key}]
  From:    ${FROM.name} <${FROM.address}>
  To:      ${job.to.join(", ")}
  Cc:      ${job.cc.join(", ")}
  Subject: ${job.subject}
  Attach:  ${attachments.map((a) => `${a.name} (${a._kb}KB)`).join("\n           ")}
  Total:   ${totalKb}KB`);

    if (!SEND) {
      console.log("  DRY RUN, not sent. Validated and encoded OK.");
      continue;
    }

    const body = {
      from: FROM,
      to: job.to.map((address) => ({ email_address: { address } })),
      cc: job.cc.map((address) => ({ email_address: { address } })),
      reply_to: [{ address: DEBO }],
      subject: job.subject,
      htmlbody: html(job.text),
      textbody: job.text,
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
      throw new Error(`[${job.key}] send failed: ${msg}`);
    }
    console.log(
      `  Sent. requestId: ${data?.request_id}  messageId: ${data?.data?.[0]?.message_id}`
    );
  }
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exitCode = 1;
});
