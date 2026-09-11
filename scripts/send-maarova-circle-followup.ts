/**
 * Follow-up to the Maarova Founding Circle invite, this time with the direct
 * application link (https://www.consultforafrica.com/maarova/circle).
 *
 * Goes to the same 22 clinicians as the first invite (shared recipient list).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/send-maarova-circle-followup.ts                                             # dry-run
 *   npx tsx --env-file=.env.local scripts/send-maarova-circle-followup.ts --limit 1 --to debo.odulana@consultforafrica.com --apply  # self-test
 *   npx tsx --env-file=.env.local scripts/send-maarova-circle-followup.ts --apply                                     # full batch
 *
 * NOTE: must be run with --env-file=.env.local so ZEPTOMAIL_API_KEY loads and
 * sends go over the ZeptoMail HTTP API, not the blocked Zoho SMTP fallback.
 */
import {
  sendMaarovaCircleFollowup,
  FROM,
  REPLY_TO,
  FOLLOWUP_SUBJECT,
  CIRCLE_URL,
} from "@/lib/maarova/maarovaCircleFollowupEmail";
import { MAAROVA_CIRCLE_RECIPIENTS } from "@/lib/maarova/maarovaInviteRecipients";

function parseFlags() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;
  const skipIdx = args.indexOf("--skip");
  const skip = skipIdx >= 0 ? parseInt(args[skipIdx + 1], 10) : 0;
  const toIdx = args.indexOf("--to");
  const overrideTo = toIdx >= 0 ? args[toIdx + 1] : null;
  return { apply, limit, skip, overrideTo };
}

async function main() {
  const { apply, limit, skip, overrideTo } = parseFlags();
  console.log(`Mode:        ${apply ? "APPLY (real sends)" : "DRY RUN"}`);
  console.log(`From:        ${FROM}`);
  console.log(`Reply-To:    ${REPLY_TO}`);
  console.log(`Subject:     ${FOLLOWUP_SUBJECT}`);
  console.log(`CTA link:    ${CIRCLE_URL}`);
  if (limit) console.log(`Limit:       ${limit}`);
  if (skip) console.log(`Skip:        ${skip}`);
  if (overrideTo) console.log(`Override to: ${overrideTo}`);
  console.log();

  const recipients = MAAROVA_CIRCLE_RECIPIENTS.slice(
    skip || 0,
    limit ? (skip || 0) + limit : undefined,
  );
  console.log(`Recipients: ${recipients.length} of ${MAAROVA_CIRCLE_RECIPIENTS.length}`);
  console.log();

  if (!apply) {
    for (const r of recipients) {
      console.log(`  Dr ${r.lastName} (${r.firstName}) <${overrideTo ?? r.email}>`);
    }
    console.log("\nDRY RUN — re-run with --apply to send.");
    return;
  }

  console.log(`Sending ${recipients.length} email(s)...`);
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const target = overrideTo ? { ...r, email: overrideTo } : r;
    const result = await sendMaarovaCircleFollowup(target);
    if (result.ok) {
      sent++;
      console.log(`  ✓ Dr ${target.lastName} -> ${target.email}`);
    } else {
      failed++;
      console.log(`  ✗ Dr ${target.lastName} -> ${target.email}: ${result.error}`);
    }
    // Pacing: 300ms between sends to stay within Zoho/ZeptoMail caps.
    await new Promise((res) => setTimeout(res, 300));
  }
  console.log(`\nSent: ${sent}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
