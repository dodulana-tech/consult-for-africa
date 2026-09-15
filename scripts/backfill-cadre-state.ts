/**
 * Derives `state` for CadreProfessionals who have a currentFacility but no state.
 *
 * Why it matters: 741 doctors have no state, so the weekly digest cannot quote
 * them a state salary band and falls through to the national median. That is
 * why 762 of 837 recipients would otherwise get an identical subject line.
 *
 * The rule throughout is that a wrong state is worse than no state. It feeds
 * the public salary map and mandate matching, so anything ambiguous is left
 * alone rather than guessed at.
 *
 *   npx tsx --env-file=.env.local scripts/backfill-cadre-state.ts          # dry run
 *   npx tsx --env-file=.env.local scripts/backfill-cadre-state.ts --apply  # writes
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

type Tier = "EXACT_FACILITY" | "FACILITY_IN_TEXT" | "STATE_IN_TEXT" | "CITY_IN_TEXT" | "AMBIGUOUS" | "NONE";

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

/** Whole-word containment, so "Ondo" never matches inside another word. */
function containsWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s)`).test(haystack);
}

async function main() {
  const facilities = await prisma.cadreFacility.findMany({
    select: { name: true, state: true, city: true },
  });

  const byExactName = new Map<string, string>();
  for (const f of facilities) if (f.state) byExactName.set(norm(f.name), f.state);

  // Only keep names long enough to be distinctive as a substring.
  const namesForContains = facilities
    .filter((f) => f.state && norm(f.name).length >= 12)
    .map((f) => ({ n: norm(f.name), state: f.state as string }))
    .sort((a, b) => b.n.length - a.n.length);

  const states = [...new Set(facilities.map((f) => f.state).filter(Boolean) as string[])];
  const stateByNorm = new Map(states.map((s) => [norm(s), s]));

  // A city is only usable if every facility in it agrees on the state.
  const cityStates = new Map<string, Set<string>>();
  for (const f of facilities) {
    if (!f.city || !f.state) continue;
    const k = norm(f.city);
    if (!cityStates.has(k)) cityStates.set(k, new Set());
    cityStates.get(k)!.add(f.state);
  }
  const unambiguousCity = new Map<string, string>();
  for (const [city, set] of cityStates) if (set.size === 1) unambiguousCity.set(city, [...set][0]);

  function derive(facilityText: string): { tier: Tier; state: string | null } {
    const t = norm(facilityText);
    if (!t) return { tier: "NONE", state: null };

    const exact = byExactName.get(t);
    if (exact) return { tier: "EXACT_FACILITY", state: exact };

    const hit = namesForContains.find((f) => t.includes(f.n) || f.n.includes(t));
    if (hit) return { tier: "FACILITY_IN_TEXT", state: hit.state };

    const stateHits = [...new Set(
      [...stateByNorm.entries()].filter(([n]) => containsWord(t, n)).map(([, s]) => s),
    )];
    const cityHits = [...new Set(
      [...unambiguousCity.entries()].filter(([c]) => containsWord(t, c)).map(([, s]) => s),
    )];

    // The import appended a state token to currentFacility and it is not always
    // right: one row reads "Ebonyi State, Nigeria. Kano". Where the text also
    // names a city, the city is the better evidence, so a disagreement between
    // the two means we know less than one signal alone would suggest, not more.
    if (stateHits.length === 1 && cityHits.length === 1 && stateHits[0] !== cityHits[0]) {
      return { tier: "AMBIGUOUS", state: null };
    }

    if (stateHits.length === 1) return { tier: "STATE_IN_TEXT", state: stateHits[0] };
    if (stateHits.length > 1) return { tier: "AMBIGUOUS", state: null };

    if (cityHits.length === 1) return { tier: "CITY_IN_TEXT", state: cityHits[0] };
    if (cityHits.length > 1) return { tier: "AMBIGUOUS", state: null };

    return { tier: "NONE", state: null };
  }

  const targets = await prisma.cadreProfessional.findMany({
    where: {
      passwordHash: { not: null },
      OR: [{ state: null }, { state: "" }],
      currentFacility: { not: null },
    },
    select: { id: true, currentFacility: true, cadre: true },
  });

  const counts: Record<Tier, number> = {
    EXACT_FACILITY: 0, FACILITY_IN_TEXT: 0, STATE_IN_TEXT: 0, CITY_IN_TEXT: 0, AMBIGUOUS: 0, NONE: 0,
  };
  const samples: Record<string, string[]> = {};
  const writes: Array<{ id: string; state: string; tier: Tier }> = [];

  for (const t of targets) {
    const { tier, state } = derive(t.currentFacility ?? "");
    counts[tier]++;
    samples[tier] ??= [];
    if (samples[tier].length < 4) samples[tier].push(`${t.currentFacility}  ->  ${state ?? "(none)"}`);
    if (state) writes.push({ id: t.id, state, tier });
  }

  console.log(`candidates (claimed, no state, has a facility): ${targets.length}\n`);
  for (const tier of Object.keys(counts) as Tier[]) {
    if (!counts[tier]) continue;
    console.log(`${tier.padEnd(18)} ${counts[tier]}`);
    for (const s of samples[tier] ?? []) console.log(`    ${s}`);
  }
  console.log(`\nwould set a state on ${writes.length} of ${targets.length}`);
  const byState = writes.reduce<Record<string, number>>((a, w) => ((a[w.state] = (a[w.state] ?? 0) + 1), a), {});
  console.log("top states:", Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 8));

  if (!APPLY) {
    console.log("\nDRY RUN. Nothing written. Re-run with --apply to write.");
    return;
  }

  let written = 0;
  for (const w of writes) {
    await prisma.cadreProfessional.update({ where: { id: w.id }, data: { state: w.state } });
    written++;
  }
  console.log(`\nWROTE ${written} records.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
