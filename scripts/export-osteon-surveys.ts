/**
 * Export the Osteon survey metadata to JSON so the printable instruments and
 * the QR posters are built from the same question set the live forms use, and
 * cannot drift from it.
 *
 *   npx tsx scripts/export-osteon-surveys.ts
 *
 * Writes docs/data/osteon-surveys.json, which scripts/build-osteon-surveys.py
 * reads. No database access, so the PDF build stays reproducible offline.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { OSTEON_SURVEYS } from "../lib/osteon-survey";

const out = join(process.cwd(), "docs", "data");
mkdirSync(out, { recursive: true });

const file = join(out, "osteon-surveys.json");
writeFileSync(file, JSON.stringify(OSTEON_SURVEYS, null, 2) + "\n", "utf8");

const items = OSTEON_SURVEYS.reduce(
  (n, s) => n + s.questions.length + s.categorical.length + s.multi.length + s.open.length,
  0
);
console.log(`wrote ${file} (${OSTEON_SURVEYS.length} surveys, ${items} items)`);
