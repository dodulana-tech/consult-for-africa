/**
 * Backfill consultant CVs from their originating TalentApplication.
 *
 * Many consultants were converted from a careers application that
 * already had a CV uploaded (TalentApplication.cvFileUrl / cvText),
 * but the ConsultantProfile.cvFileUrl was never populated. This script
 * walks every consultant whose ConsultantProfile has no cvFileUrl,
 * looks up:
 *   1. The user's sourceApplicationId, if set
 *   2. Failing that, any TalentApplication with the same email
 * and copies the CV across (URL + text).
 *
 * Run with:
 *   DATABASE_URL=$DIRECT_URL npx tsx scripts/backfill-consultant-cvs.ts --dry
 *   DATABASE_URL=$DIRECT_URL npx tsx scripts/backfill-consultant-cvs.ts
 */
import { prisma } from "../lib/prisma";

async function main() {
  const dry = process.argv.includes("--dry");

  const profilesMissingCv = await prisma.consultantProfile.findMany({
    where: { cvFileUrl: null },
    select: {
      id: true,
      userId: true,
      user: { select: { id: true, name: true, email: true, sourceApplicationId: true } },
    },
  });

  console.log(`${profilesMissingCv.length} consultants have no CV on their profile.`);
  let matched = 0;
  let copied = 0;

  for (const p of profilesMissingCv) {
    // 1. Direct link via sourceApplicationId
    let app = null;
    if (p.user.sourceApplicationId) {
      app = await prisma.talentApplication.findUnique({
        where: { id: p.user.sourceApplicationId },
        select: { id: true, cvFileUrl: true, cvText: true },
      });
    }
    // 2. Fallback: email match
    if (!app && p.user.email) {
      app = await prisma.talentApplication.findUnique({
        where: { email: p.user.email },
        select: { id: true, cvFileUrl: true, cvText: true },
      });
    }

    if (!app || (!app.cvFileUrl && !app.cvText)) continue;

    matched++;
    console.log(`  ${p.user.name} <${p.user.email}> -> app ${app.id} (cv: ${app.cvFileUrl ? "file" : ""}${app.cvText ? " text" : ""})`);

    if (!dry) {
      await prisma.consultantProfile.update({
        where: { id: p.id },
        data: {
          cvFileUrl: app.cvFileUrl,
          cvText: app.cvText,
          cvUploadedAt: new Date(),
        },
      });
      copied++;
    }
  }

  console.log(`\nMatched: ${matched}`);
  if (dry) {
    console.log("Dry run. Re-run without --dry to write.");
  } else {
    console.log(`Copied: ${copied}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
