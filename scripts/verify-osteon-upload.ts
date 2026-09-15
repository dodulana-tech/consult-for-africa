/**
 * Prove the Osteon document upload works, and prove it is not readable by the
 * public, before the link goes to anyone.
 *
 *   npx tsx --env-file=.env.local scripts/verify-osteon-upload.ts
 *
 * Walks the real path a browser takes: presign, PUT the bytes to storage,
 * record the row. Then reads the row back, and separately tries to fetch the
 * object from the bucket's public domain, which MUST fail. lib/r2.ts
 * getPublicUrl hands out a durable public link whenever R2_PUBLIC_URL is set,
 * and it is set, so this is the check that the upload route never called it.
 *
 * Cleans up after itself: the R2 object is deleted and so is the row.
 */

import { prisma } from "../lib/prisma";
import { deleteFile } from "../lib/r2";

const BASE = process.argv.includes("--local")
  ? "http://localhost:3000"
  : "https://www.consultforafrica.com";
const ENDPOINT = `${BASE}/api/osteon-audit/upload`;

const SEED_NAME = "cfa-seed-verification.csv";
const SEED_BODY = "section,note\nE,this row was written by the verification script\n";

let failures = 0;
const ok = (m: string) => console.log(`  ok    ${m}`);
const bad = (m: string) => {
  console.log(`  FAIL  ${m}`);
  failures++;
};

async function main() {
  console.log(`Verifying ${ENDPOINT}\n`);
  const bytes = Buffer.from(SEED_BODY, "utf8");
  let storageKey = "";

  // 1. presign
  const presignRes = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: SEED_NAME,
      contentType: "text/csv",
      fileSize: bytes.length,
      section: "E",
    }),
  });
  const presign = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok || !presign.uploadUrl || !presign.storageKey) {
    bad(`presign: HTTP ${presignRes.status} ${JSON.stringify(presign).slice(0, 160)}`);
    process.exit(1);
  }
  storageKey = presign.storageKey;
  ok(`presign: HTTP 200, key ${storageKey}`);

  // The response must not hand the browser anything readable.
  const leaked = Object.entries(presign).find(
    ([k, v]) => k !== "uploadUrl" && typeof v === "string" && /^https?:\/\//.test(v)
  );
  if (leaked) bad(`presign leaked a readable URL in "${leaked[0]}"`);
  else ok("presign returns no readable URL, only the signed PUT");

  // 2. the bytes actually go to storage
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": presign.contentType },
    body: bytes,
  });
  if (!put.ok) {
    bad(`storage PUT: HTTP ${put.status}`);
    process.exit(1);
  }
  ok(`storage PUT: HTTP ${put.status}`);

  // 3. record the row
  const recRes = await fetch(ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storageKey,
      filename: SEED_NAME,
      contentType: presign.contentType,
      fileSize: bytes.length,
      section: "E",
      uploadedBy: "CFA verification script",
      note: "seed row, deleted immediately",
    }),
  });
  const rec = await recRes.json().catch(() => ({}));
  if (!recRes.ok) bad(`record: HTTP ${recRes.status} ${JSON.stringify(rec).slice(0, 160)}`);
  else ok(`record: HTTP 200`);

  // 4. a 200 is not evidence, the row is
  const row = await prisma.auditUpload.findUnique({ where: { storageKey } });
  if (!row) bad("no AuditUpload row was written");
  else if (row.section !== "E" || row.sizeBytes !== bytes.length || row.filename !== SEED_NAME) {
    bad(`row stored but wrong: section=${row.section} size=${row.sizeBytes} name=${row.filename}`);
  } else {
    ok(`row stored: section ${row.section}, ${row.sizeBytes} bytes, uploadedBy "${row.uploadedBy}"`);
  }
  if (row && !row.ipHash) bad("row has no ipHash");

  // 5. THE IMPORTANT ONE: can the bucket serve this object to the open internet?
  //
  // This is a property of the bucket, not of our route. Every other upload flow
  // in the app relies on that public domain by design, so a failure here is an
  // infrastructure finding to put in front of a human, not a bug in this code.
  const publicBase = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (!publicBase) {
    console.log("  note  R2_PUBLIC_URL is unset here, so the public-read check is skipped");
  } else {
    const probe = await fetch(`${publicBase}/${storageKey}`).catch(() => null);
    if (probe && probe.ok) {
      const body = await probe.text().catch(() => "");
      // Count only the random segment. An earlier version of this line counted
      // the filename as entropy and reported 204 bits for a key that had 48.
      const stem = (storageKey.split("/").pop() ?? "").split(".")[0] ?? "";
      const random = /^[A-Za-z0-9_-]{43,}$/.test(stem) ? stem : stem.split("-")[0] ?? "";
      const entropyBits = Math.round(random.length * 6);
      bad(
        `THE BUCKET SERVES THIS OBJECT PUBLICLY.\n` +
          `        ${publicBase}/${storageKey}\n` +
          `        returned HTTP ${probe.status} with ${body.length} bytes to an unauthenticated request.\n` +
          `        This is the bucket's r2.dev public domain, not anything this route hands out,\n` +
          `        and it affects every file in cfa-uploads including CVs and deliverables.\n` +
          `        Mitigation in place: the key carries roughly ${entropyBits} bits of randomness and no\n` +
          `        filename, so it cannot be enumerated or guessed. That is defence in depth.\n` +
          `        The fix is to disable the public r2.dev domain on the bucket, or to move audit\n` +
          `        uploads to a bucket that has none. Until then the key is the only control.`
      );
    } else {
      ok(`not publicly readable (HTTP ${probe ? probe.status : "no response"} on the public domain)`);
    }
  }

  // 6. the unauthenticated reader must be turned away
  if (row) {
    const readRes = await fetch(`${BASE}/api/osteon-audit/upload/${row.id}`, { redirect: "manual" });
    if (readRes.status === 401) ok("reading a file back without a login is refused (401)");
    else bad(`read-back returned HTTP ${readRes.status}, expected 401 for an anonymous caller`);
  }

  // 7. clean up both sides
  try {
    await deleteFile(storageKey);
    ok("storage object deleted");
  } catch (err) {
    bad(`could not delete the storage object: ${(err as Error).message}`);
  }
  const { count } = await prisma.auditUpload.deleteMany({ where: { storageKey } });
  ok(`${count} seed row deleted`);

  try {
    const left = await prisma.auditUpload.count({ where: { engagement: "osteon" } });
    console.log(`\nReal Osteon uploads in the table: ${left}`);
  } catch {
    console.log("\n(could not count remaining rows; the checks above still stand)");
  }
  console.log(failures ? `\n${failures} check(s) FAILED.` : "\nAll checks passed.");
  process.exit(failures ? 1 : 0);
}

main().finally(() => prisma.$disconnect());
