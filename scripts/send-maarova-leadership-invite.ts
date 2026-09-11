/**
 * Send the Maarova Healthcare Leadership Assessment complimentary-place invite
 * to a hand-picked list of clinicians (Nimi's Maarova growth push).
 *
 * The recipient list is inline below (not a DB query) — these are contacts
 * sourced by comms, not CadreProfessional records.
 *
 * Usage:
 *   npx tsx scripts/send-maarova-leadership-invite.ts                                             # dry-run, lists recipients
 *   npx tsx scripts/send-maarova-leadership-invite.ts --limit 1 --to debo.odulana@consultforafrica.com --apply  # self-test
 *   npx tsx scripts/send-maarova-leadership-invite.ts --apply                                     # full batch
 *
 * From / Reply-To are set via env (MAAROVA_SMTP_FROM, MAAROVA_REPLY_TO) so
 * replies land in the mailbox Nimi actually monitors.
 */
import {
  sendMaarovaInviteEmail,
  FROM,
  REPLY_TO,
  SUBJECT,
  type InviteRecipient,
} from "@/lib/maarova/maarovaLeadershipInviteEmail";

// Names recovered from LinkedIn slugs; primary email chosen where two listed.
const RECIPIENTS: InviteRecipient[] = [
  { firstName: "Chijioke", lastName: "Mbelu", email: "cjmbelu@yahoo.com" },
  { firstName: "Oluwadarasimi", lastName: "Afolabi", email: "dorcasafolabi97@gmail.com" },
  { firstName: "Chinwe", lastName: "Nwokedinobi", email: "jomeigh@yahoo.com" },
  { firstName: "Chukwuka", lastName: "Amadi", email: "achuka2003@yahoo.com" },
  { firstName: "Nkiru", lastName: "Jibuaku", email: "nkjibuaku@gmail.com" },
  { firstName: "Michael", lastName: "Kayode", email: "mikekayodemike@yahoo.com" },
  { firstName: "Ekuase", lastName: "Sanusi", email: "ekuase.sanusi@choa.org" },
  { firstName: "Babatunde", lastName: "Ogunkinle", email: "ogunkinle@gmail.com" },
  { firstName: "Folajimi", lastName: "Adebowale", email: "folajimiadebowale@gmail.com" },
  { firstName: "Sewuese", lastName: "Bitto", email: "swissbitto@yahoo.com" },
  { firstName: "Ogochukwu", lastName: "Sokunbi", email: "lumzylu@yahoo.com" },
  { firstName: "Aniekan", lastName: "Jacob", email: "aniekanj@yahoo.com" },
  { firstName: "Olufemi", lastName: "Ogunremi", email: "dr.ogunremi@careoneng.com" },
  { firstName: "Clement", lastName: "Aransiola", email: "aransiolak@yahoo.com" },
  { firstName: "Olumuyiwa", lastName: "Ariyo", email: "olumuyiwaariyo@gmail.com" },
  { firstName: "Michael", lastName: "Iroezindu", email: "mikezindu@yahoo.com" },
  { firstName: "Ubong", lastName: "Umoren", email: "drubongumoren84@gmail.com" },
  { firstName: "Chizaram", lastName: "Onyeaghala", email: "chizero15@gmail.com" },
  { firstName: "Violet", lastName: "Ekpudu", email: "docviolet@yahoo.com" },
  { firstName: "Osigwe", lastName: "Agabi", email: "osigweagabi@yahoo.co.uk" },
  { firstName: "Ebenezer", lastName: "Ozomata", email: "ebenezerozomata@gmail.com" },
  { firstName: "Abiona", lastName: "Odeyemi", email: "drdammy_01@yahoo.com" },
];

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
  console.log(`Subject:     ${SUBJECT}`);
  if (limit) console.log(`Limit:       ${limit}`);
  if (skip) console.log(`Skip:        ${skip}`);
  if (overrideTo) console.log(`Override to: ${overrideTo}`);
  console.log();

  const recipients = RECIPIENTS.slice(skip || 0, limit ? (skip || 0) + limit : undefined);
  console.log(`Recipients: ${recipients.length} of ${RECIPIENTS.length}`);
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
    const result = await sendMaarovaInviteEmail(target);
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
