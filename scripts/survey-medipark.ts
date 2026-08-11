/**
 * Read and analyse the premium medipark consultant survey.
 *
 * Does not just dump rows. Reads the responses against the assumptions the
 * financial model rests on, and says whether each one holds.
 *
 *   npx tsx --env-file=.env.local scripts/survey-medipark.ts
 *   npx tsx --env-file=.env.local scripts/survey-medipark.ts --csv > responses.csv
 *
 * The van Westendorp block (Q9 to Q12) yields two numbers that matter:
 *   OPP  optimal price point, where "too cheap" and "too expensive" cross.
 *        The price at which fewest people reject on either side.
 *   IPP  indifference price point, where "good value" and "getting expensive"
 *        cross. Usually read as the price the market considers normal.
 */

import { prisma } from "@/lib/prisma";

const naira = (n: number) => "NGN " + Math.round(n).toLocaleString("en-NG");
const pct = (a: number, b: number) => (b === 0 ? "0%" : Math.round((a / b) * 100) + "%");

function parseMoney(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const digits = v.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  // Guard against someone typing "50" meaning fifty thousand, or a stray year.
  if (n < 1000 || n > 5_000_000) return null;
  return n;
}

/** Price at which the two cumulative curves cross. */
function crossover(asc: number[], desc: number[]): number | null {
  if (!asc.length || !desc.length) return null;
  const prices = [...new Set([...asc, ...desc])].sort((a, b) => a - b);
  let prev: { p: number; d: number } | null = null;
  for (const p of prices) {
    // share who find it at or below p acceptable-low, vs at or below p acceptable-high
    const a = asc.filter((x) => x <= p).length / asc.length;
    const d = desc.filter((x) => x >= p).length / desc.length;
    const diff = a - d;
    if (prev && prev.d <= 0 && diff >= 0) return Math.round((prev.p + p) / 2);
    prev = { p, d: diff };
  }
  return null;
}

function tally(rows: any[], key: string) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = (r.payload as any)?.[key];
    for (const item of Array.isArray(v) ? v : v ? [v] : []) {
      counts.set(String(item), (counts.get(String(item)) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function bar(n: number, total: number, width = 24) {
  const filled = total === 0 ? 0 : Math.round((n / total) * width);
  return "#".repeat(filled) + ".".repeat(width - filled);
}

async function main() {
  const rows = await prisma.mediparkSurveyResponse.findMany({
    where: { survey: "premium-medipark" },
    orderBy: { createdAt: "asc" },
  });
  const N = rows.length;

  if (process.argv.includes("--csv")) {
    const keys = new Set<string>();
    rows.forEach((r) => Object.keys(r.payload as object).forEach((k) => keys.add(k)));
    const cols = [...keys];
    console.log(["createdAt", ...cols, "contactChoice", "name", "specialty", "email", "phone"].join(","));
    for (const r of rows) {
      const p = r.payload as any;
      const cells = [
        r.createdAt.toISOString(),
        ...cols.map((c) => (Array.isArray(p[c]) ? p[c].join("; ") : (p[c] ?? ""))),
        r.contactChoice ?? "", r.name ?? "", r.specialty ?? "", r.email ?? "", r.phone ?? "",
      ];
      console.log(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    }
    return;
  }

  console.log("\n" + "=".repeat(74));
  console.log("  PREMIUM MEDIPARK CONSULTANT SURVEY");
  console.log("=".repeat(74));
  console.log(`\n  ${N} responses` + (N ? `, ${rows[0].createdAt.toDateString()} to ${rows[N - 1].createdAt.toDateString()}` : ""));
  if (N < 25) console.log("  Below 25 responses. Read with caution; 40 to 60 is the target.");
  if (N === 0) { await prisma.$disconnect(); return; }

  // ---- the assumption that matters most ----
  console.log("\n" + "-".repeat(74));
  console.log("  Q5  SESSIONS A WEEK      <- the model's fill assumption lives or dies here");
  console.log("-".repeat(74));
  const sess = tally(rows, "sessions");
  const order = ["None", "1", "2", "3", "4 or more"];
  const answered = sess.reduce((a, [, c]) => a + c, 0);
  let twoPlus = 0;
  for (const label of order) {
    const c = sess.find(([k]) => k === label)?.[1] ?? 0;
    if (["2", "3", "4 or more"].includes(label)) twoPlus += c;
    console.log(`   ${label.padEnd(11)} ${bar(c, answered)} ${String(c).padStart(3)}  ${pct(c, answered)}`);
  }
  console.log(`\n   Two or more a week: ${twoPlus} of ${answered}, ${pct(twoPlus, answered)}`);
  console.log(twoPlus / answered >= 0.4
    ? "   >= 40%. The fill assumption holds and the membership tiers have a market."
    : "   BELOW 40%. The fill assumption fails and the plaza needs re-sizing.");

  // ---- price ----
  console.log("\n" + "-".repeat(74));
  console.log("  Q9 to Q12  PRICE PER SESSION, van Westendorp");
  console.log("-".repeat(74));
  const grab = (k: string) => rows.map((r) => parseMoney((r.payload as any)?.[k])).filter((x): x is number => x !== null);
  const cheap = grab("vwCheap"), good = grab("vwGood"), pricey = grab("vwPricey"), tooMuch = grab("vwTooMuch");
  const med = (a: number[]) => a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0;
  for (const [label, arr] of [["Too cheap to trust", cheap], ["Good value", good],
                              ["Getting expensive", pricey], ["Too expensive", tooMuch]] as const) {
    console.log(`   ${label.padEnd(20)} n=${String(arr.length).padStart(3)}  median ${naira(med(arr))}`);
  }
  const opp = crossover(cheap, tooMuch);
  const ipp = crossover(good, pricey);
  console.log("");
  if (opp) console.log(`   OPP, optimal price point   ${naira(opp)}`);
  if (ipp) console.log(`   IPP, indifference point    ${naira(ipp)}`);
  console.log(`\n   Model assumes a 4-hour evening block at NGN 94,000 (member),`);
  console.log(`   NGN 141,000 (guest). Compare against the range above.`);

  // ---- membership ----
  console.log("\n" + "-".repeat(74));
  console.log("  Q13  MEMBERSHIP WILLINGNESS      <- tiers are 1.2M / 2.4M / 4.2M");
  console.log("-".repeat(74));
  const memb = tally(rows, "membership");
  const mTotal = memb.reduce((a, [, c]) => a + c, 0);
  for (const [k, c] of memb) console.log(`   ${k.padEnd(30)} ${bar(c, mTotal, 18)} ${String(c).padStart(3)}  ${pct(c, mTotal)}`);
  const wontPay = memb.find(([k]) => k.startsWith("I would not"))?.[1] ?? 0;
  const overOneM = memb.filter(([k]) => /1 to 2|2 to 3|Over NGN 3/.test(k)).reduce((a, [, c]) => a + c, 0);
  console.log(`\n   Would pay NGN 1M or more: ${overOneM} of ${mTotal}, ${pct(overOneM, mTotal)}`);
  console.log(`   Would not pay a membership: ${wontPay}, ${pct(wontPay, mTotal)}  <- these are the panel tier`);

  // ---- everything else, briefly ----
  for (const [label, key] of [["Q6  Time bands that work", "bands"],
                              ["Q3  Private patients a week", "volume"],
                              ["Q4  First consultation fee", "fee"],
                              ["Q2  Where they practise now", "where"],
                              ["Q15 Procedures performed", "procedures"]] as const) {
    console.log("\n  " + label);
    const t = tally(rows, key);
    const tt = t.reduce((a, [, c]) => a + c, 0);
    for (const [k, c] of t.slice(0, 6)) console.log(`     ${k.padEnd(44)} ${String(c).padStart(3)}  ${pct(c, tt)}`);
  }

  // ---- what matters ----
  console.log("\n  Q14 What would matter most, share saying Important or Essential");
  const LABELS = ["Address and how it feels", "On-site lab and imaging", "Billing handled",
    "Nurse or chaperone", "Parking and discretion", "Session booking, no lease",
    "Which other consultants", "A room of your own"];
  LABELS.forEach((label, i) => {
    const t = tally(rows, `matters_${i}`);
    const tt = t.reduce((a, [, c]) => a + c, 0);
    const hi = t.filter(([k]) => k === "Important" || k === "Essential").reduce((a, [, c]) => a + c, 0);
    console.log(`     ${label.padEnd(30)} ${bar(hi, tt, 18)} ${pct(hi, tt)}`);
  });

  // ---- the founding cohort ----
  console.log("\n" + "-".repeat(74));
  console.log("  Q16  FOUNDING COHORT");
  console.log("-".repeat(74));
  const wants = rows.filter((r) => r.contactChoice === "contact");
  console.log(`   Asked to be contacted: ${wants.length} of ${N}`);
  console.log(`   Findings only:         ${rows.filter((r) => r.contactChoice === "findings").length}`);
  for (const r of wants) {
    console.log(`     ${(r.name ?? "?").padEnd(26)} ${(r.specialty ?? "").padEnd(22)} ${r.email ?? ""} ${r.phone ?? ""}`);
  }
  console.log("");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
