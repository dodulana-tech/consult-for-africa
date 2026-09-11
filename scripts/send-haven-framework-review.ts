/**
 * Send the reviewable audit approach + framework + interview guides to Debo & Tito.
 *   npx ts-node --transpile-only scripts/send-haven-framework-review.ts
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

const TO = ["debo.odulana@consultforafrica.com", "tito.ipinmoye@consultforafrica.com"];
const SUBJECT = "FOR REVIEW — Haven audit approach, framework & interview guides";
const ATT = [
  ["haven-audit-framework-cfa.pdf", "Haven - Audit Approach & Framework (for review).pdf"],
  ["haven-interview-guides-cfa.pdf", "Haven - Interview Guides.pdf"],
];

const TEXT = `Debo, Tito,

The deeper research is in — here is the reviewable version of our approach before anything client-facing goes out.

ATTACHED
1. Approach & Framework — the locked two-axis MECE structure (10 functional domains x 6 cross-cutting lenses), the evidence-based method + signature KPI per domain, the hypothesis bank, the stakeholder instruments, and two honest evidence gaps.
2. Interview Guides — nine interviews covering all ten domains, each with core and sharp / hypothesis-testing questions, split by who leads.

TWO THINGS THE RESEARCH CHANGED, WORTH YOUR EYE
- Infrastructure is now a top-tier CLINICAL risk, not a facilities line. In Nigerian secondary hospitals only ~3.5% of oxygen concentrators meet WHO fit-for-use; power outages interrupt oxygen with ~19% case-fatality among affected patients; paediatric hypoxemia raises death risk ~5x. We audit oxygen purity (>=82%, WHO-UNICEF) and layered power resilience (grid + generator + battery) as first-order safety. Credible, sobering, and board-ready.
- We are transparent about two gaps: no reliable Nigerian revenue-cycle benchmarks exist publicly (we baseline from Haven's own data), and "MECE" is our analytic architecture, not an external certification — its rigour is in the domain / lens definitions we have locked.

Please mark up anything, especially the hypotheses — they are meant to be argued with before we lock them. Tito, shape the interview guides however you would run them.

Once you are both happy, next steps are: (a) I reflow the client-facing kickoff deck and Information & Data Request to match this exact structure, and (b) we send the project-launch email to the five founders.`;

async function main() {
  const attachments = ATT.map(([file, name]) => {
    const p = path.resolve(process.cwd(), "docs", file);
    if (!fs.existsSync(p)) throw new Error(`Missing ${p}`);
    return { filename: name, path: p, contentType: "application/pdf" };
  });
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com", port: Number(process.env.SMTP_PORT ?? 465), secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM ?? "Consult for Africa <hello@consultforafrica.com>";
  console.log(`Sending framework review...\n  To: ${TO.join(", ")}\n  Attachments: ${attachments.length}`);
  const info = await transporter.sendMail({
    from, to: TO, replyTo: process.env.REPLY_TO_EMAIL ?? "hello@consultforafrica.com",
    subject: SUBJECT, text: TEXT, html: TEXT.replace(/\n/g, "<br>"), attachments,
  });
  console.log("✓ Sent. messageId:", info.messageId, "\n  accepted:", info.accepted, "rejected:", info.rejected);
}
main().catch((e) => { console.error("Send failed:", e?.message ?? e); process.exitCode = 1; });
