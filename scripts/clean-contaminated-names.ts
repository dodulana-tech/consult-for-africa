/**
 * Clean CadreProfessional records where firstName or lastName contains
 * fragments that belong in `currentFacility` instead (e.g. "Dr Wisdom
 * Aziegbe Federal Neuropsychiatric Hospital,").
 *
 * Detection patterns we fix:
 *   1. Facility keyword in name (Hospital, Clinic, Centre, Teaching, University,
 *      Federal, Polytechnic, College, FMC, LUTH, UCH, OAUTH, UATH, UMTH, etc.)
 *      -> strip everything from the keyword onward; if currentFacility is null,
 *         promote the stripped chunk
 *   2. Trailing comma in firstName or lastName -> strip
 *   3. Leading comma in lastName -> strip
 *   4. Postnominal designations (mni, FMCS, FRCS, FWACS, FWACP, MD, MBBS, MPH,
 *      FNANS) -> strip
 *   5. Embedded title duplicate ("Dr Dr X") -> strip extra
 *
 * Each proposed change is shown in dry-run. Pass --apply to write.
 *
 * Usage:
 *   npx tsx scripts/clean-contaminated-names.ts           # dry run
 *   npx tsx scripts/clean-contaminated-names.ts --apply   # commit
 *   npx tsx scripts/clean-contaminated-names.ts --limit 50
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Words that, even on their own, signal a facility (matched case-insensitively)
const FACILITY_WORDS = [
  "Hospital", "Hospitals", "Clinic", "Clinics", "Centre", "Center",
  "Teaching", "University", "Polytechnic", "College", "Federal",
  "Specialist", "Maternity",
];
// All-caps abbreviations for Nigerian hospitals — match only when ALL CAPS
// to avoid false positives on names like "Noha" or "Buth".
const FACILITY_ABBREVS_UPPER = [
  "FMC", "LUTH", "OAUTH", "OAUTHC", "UATH", "UMTH", "AEFUTHA", "ABUTH",
  "NOHA", "NOHIL", "JUTH", "BUTH", "NAUTH", "UCH",
];
const FACILITY_RX_CI = new RegExp(`\\b(${FACILITY_WORDS.join("|")})\\b`, "i");
const FACILITY_RX_UC = new RegExp(`\\b(${FACILITY_ABBREVS_UPPER.join("|")})\\b`);

function matchFacility(s: string): RegExpMatchArray | null {
  return s.match(FACILITY_RX_CI) ?? s.match(FACILITY_RX_UC);
}

// Postnominal designations to strip
const POSTNOMINAL_RX = /\b(mni|fmcs|fmcp|frcs|fwacs|fwacp|md|mbbs|mph|fnans|fmcs|fmcsogh|fmcg|frcog|frcp)\b\.?/gi;

interface DirtyRow {
  id: string;
  first_name: string;
  last_name: string;
  current_facility: string | null;
}

interface Proposal {
  id: string;
  oldFirst: string;
  oldLast: string;
  oldFacility: string | null;
  newFirst: string;
  newLast: string;
  newFacility: string | null;
  reasons: string[];
}

/**
 * For a name field that contains a facility keyword, split it so the keyword
 * AND everything between the first word and the keyword end up in the
 * facility bucket. E.g. "Aziegbe Federal Neuropsychiatric Hospital," ->
 * { keep: "Aziegbe", facility: "Federal Neuropsychiatric Hospital" }
 */
function splitOnFacility(s: string): { keep: string; facility: string } | null {
  const match = matchFacility(s);
  if (!match || match.index === undefined) return null;
  // Walk back to the start of the word containing the keyword
  const keywordStart = match.index;
  // Take all text from the keyword onward; also walk back to grab the word
  // immediately before the keyword (likely part of the facility name like
  // "Royan Hospital", "Federal X Hospital").
  let cutAt = keywordStart;
  // Find previous whitespace before keyword to identify word boundary
  const before = s.slice(0, keywordStart).trimEnd();
  const beforeTokens = before.split(/\s+/);
  if (beforeTokens.length >= 2) {
    // Keep first word(s) as name, push trailing word(s) up to the keyword into facility
    // Heuristic: keep only the FIRST word as name; anything else goes to facility
    cutAt = (beforeTokens[0]?.length ?? 0);
    // Re-find the cut position in the original string
    cutAt = s.indexOf(beforeTokens[0]) + beforeTokens[0].length;
  } else {
    // Only one word before keyword; that word stays as the name
    cutAt = before.length;
  }
  const keep = s.slice(0, cutAt).trim().replace(/[,\s]+$/g, "");
  const facility = s.slice(cutAt).trim().replace(/^[,\s.]+|[,\s.]+$/g, "");
  return { keep, facility };
}

function clean(row: DirtyRow): Proposal | null {
  const reasons: string[] = [];
  let first = row.first_name ?? "";
  let last = row.last_name ?? "";
  let facility = row.current_facility;

  // 1. Strip duplicate title (e.g. "Dr Dr Fatima")
  const dupTitle = first.match(/^(Dr|Prof)\.?\s+(Dr|Prof)\.?\s+/i);
  if (dupTitle) {
    first = first.replace(dupTitle[0], dupTitle[1] + " ");
    reasons.push("dedup title");
  }

  // 2. Facility leakage in firstName
  const facSplitFirst = splitOnFacility(first);
  if (facSplitFirst && facSplitFirst.facility) {
    first = facSplitFirst.keep;
    if (!facility || facility.length < 3) {
      facility = facSplitFirst.facility;
    }
    reasons.push(`extracted facility from firstName: "${facSplitFirst.facility}"`);
  }

  // 3. Facility leakage in lastName
  const facSplitLast = splitOnFacility(last);
  if (facSplitLast && facSplitLast.facility) {
    last = facSplitLast.keep;
    if (!facility || facility.length < 3) {
      facility = facSplitLast.facility;
    }
    reasons.push(`extracted facility from lastName: "${facSplitLast.facility}"`);
  }

  // 4. Postnominals
  if (POSTNOMINAL_RX.test(first)) {
    first = first.replace(POSTNOMINAL_RX, "").trim();
    reasons.push("removed postnominals from firstName");
  }
  if (POSTNOMINAL_RX.test(last)) {
    last = last.replace(POSTNOMINAL_RX, "").trim();
    reasons.push("removed postnominals from lastName");
  }

  // 5. Strip leading/trailing COMMAS only (preserve dots — initials are valid)
  // Also collapse repeated whitespace.
  const stripCommas = (s: string) =>
    s.replace(/^[,\s]+|[,\s]+$/g, "").replace(/\s+/g, " ").trim();
  const newFirst = stripCommas(first);
  const newLast = stripCommas(last);
  if (newFirst !== first) {
    reasons.push("trimmed firstName commas/spaces");
    first = newFirst;
  }
  if (newLast !== last) {
    reasons.push("trimmed lastName commas/spaces");
    last = newLast;
  }

  // 6. If we ended up with empty lastName and firstName has more than one word, move tail
  if (!last && first.split(/\s+/).length > 1) {
    const parts = first.split(/\s+/);
    first = parts.slice(0, parts.length - 1).join(" ");
    last = parts[parts.length - 1];
    reasons.push("rebalanced firstName/lastName split");
  }

  // Bail out if nothing actually changed
  if (
    first === (row.first_name ?? "") &&
    last === (row.last_name ?? "") &&
    facility === row.current_facility
  ) {
    return null;
  }
  if (reasons.length === 0) return null;

  return {
    id: row.id,
    oldFirst: row.first_name,
    oldLast: row.last_name,
    oldFacility: row.current_facility,
    newFirst: first,
    newLast: last,
    newFacility: facility,
    reasons,
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : null;

  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN (pass --apply to commit)"}`);

  // Use raw SQL for whole-word match (Prisma's contains is substring only).
  // Only flag commas (not dots — initials with dots are legitimate).
  // Two patterns: case-insensitive facility words + case-sensitive UC abbreviations.
  const patternCI = `\\m(${FACILITY_WORDS.join("|")})\\M`;
  const patternUC = `\\m(${FACILITY_ABBREVS_UPPER.join("|")})\\M`;
  const query = `
    SELECT id, "firstName" AS first_name, "lastName" AS last_name, "currentFacility" AS current_facility
    FROM "CadreProfessional"
    WHERE "lastName" ~* $1
       OR "firstName" ~* $1
       OR "lastName" ~ $2
       OR "firstName" ~ $2
       OR "lastName" ~ '^[,\\s]|[,\\s]$'
       OR "firstName" ~ '^[,\\s]|[,\\s]$'
       OR "firstName" ~* '\\m(Dr|Prof)\\.?\\s+(Dr|Prof)\\.?\\M'
       OR "lastName" ~* '\\m(mni|fmcs|fmcp|frcs|fwacs|fwacp|fnans|frcog|frcp)\\M'
       OR "firstName" ~* '\\m(mni|fmcs|fmcp|frcs|fwacs|fwacp|fnans|frcog|frcp)\\M'
    ${limit ? `LIMIT ${limit}` : ""}
  `;
  const candidates: DirtyRow[] = await prisma.$queryRawUnsafe(query, patternCI, patternUC);

  console.log(`Candidates inspected: ${candidates.length}`);

  const proposals: Proposal[] = [];
  for (const row of candidates) {
    const prop = clean(row);
    if (prop) proposals.push(prop);
  }

  console.log(`Records that need cleaning: ${proposals.length}\n`);

  for (const p of proposals) {
    console.log(`[${p.id.slice(0, 8)}]`);
    console.log(`  before:  "${p.oldFirst}" | "${p.oldLast}"`);
    console.log(`  after:   "${p.newFirst}" | "${p.newLast}"`);
    if (p.oldFacility !== p.newFacility) {
      console.log(`  facility: ${p.oldFacility ?? "—"}  →  ${p.newFacility ?? "—"}`);
    }
    console.log(`  reasons: ${p.reasons.join("; ")}`);
    console.log();
  }

  if (!apply) {
    console.log(`DRY RUN — re-run with --apply to write ${proposals.length} updates.`);
    await prisma.$disconnect();
    return;
  }

  console.log(`Applying ${proposals.length} updates...`);
  let updated = 0;
  for (const p of proposals) {
    await prisma.cadreProfessional.update({
      where: { id: p.id },
      data: {
        firstName: p.newFirst || "Unknown",
        lastName: p.newLast,
        currentFacility: p.newFacility,
      },
    });
    updated++;
    if (updated % 25 === 0) console.log(`  ... ${updated} / ${proposals.length}`);
  }
  console.log(`Done. Updated ${updated} records.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
