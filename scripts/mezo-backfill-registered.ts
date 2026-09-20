/**
 * Opens a Mezo place for registered CadreHealth doctors who never answered the
 * survey.
 *
 * The ordinary path is give-to-get: a member answers the private practice
 * survey and a place opens for them, inline, seconds later. This is the other
 * thing, run deliberately and by hand: the 900-odd doctors who hold a real
 * CadreHealth account, are eligible for Mezo, and have not answered. Their
 * accounts are created so a campaign has somewhere to send them.
 *
 * SILENT BY DESIGN. It writes no CadreMezoInterest row, and that is the whole
 * point rather than an oversight: /api/cron/mezo-provision-retry emails anyone
 * holding a claim link with no claimEmailSentAt stamp, so recording these the
 * ordinary way would put a thousand unsolicited emails on the next hourly run.
 * The links go to a file. Nobody is told anything until someone decides to
 * tell them.
 *
 * Claim links last CLAIM_TTL_DAYS (30) on the Mezo side. The accounts are
 * permanent; the links in the output file are not. Re-run before a campaign
 * that is more than a month behind this one: the call is idempotent on email
 * and reissues the token of any stub still unclaimed.
 *
 *   npx tsx scripts/mezo-backfill-registered.ts              # dry run
 *   npx tsx scripts/mezo-backfill-registered.ts --live
 *   npx tsx scripts/mezo-backfill-registered.ts --live --limit 25
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { publishableSpecialty } from "../lib/mezo/provision";
import { surnameFor } from "../lib/cadreSalutation";

const prisma = new PrismaClient();

/** Under the endpoint's MAX_BATCH of 200, with room to spare. */
const BATCH_SIZE = 100;
/** Mezo opens an account per row inside one transaction; give it room. */
const REQUEST_TIMEOUT_MS = 120_000;

interface ApiResult {
  externalId: string;
  status: "created" | "existing" | "skipped";
  claimUrl?: string;
  reason?: string;
}

async function main() {
  const live = process.argv.includes("--live");
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : undefined;

  const secret = process.env.MEZO_PARTNER_SECRET;
  const baseUrl = process.env.MEZO_BASE_URL;
  if (live && (!secret || !baseUrl)) {
    throw new Error("MEZO_PARTNER_SECRET and MEZO_BASE_URL must be set to run --live");
  }

  // A real account holder, eligible for the MDCN-backed register Mezo runs on,
  // who has not already been through the survey path.
  const cohort = await prisma.cadreProfessional.findMany({
    where: {
      passwordHash: { not: null },
      cadre: { in: ["MEDICINE", "DENTISTRY"] },
      mezoInterest: null,
    },
    orderBy: { createdAt: "asc" },
    ...(limit ? { take: limit } : {}),
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      cadre: true,
      subSpecialty: true,
      state: true,
      isDiaspora: true,
      specialtyConfirmedAt: true,
      credentials: {
        where: { regulatoryBody: "MDCN" },
        select: { licenseNumber: true },
        take: 1,
      },
    },
  });

  const payloads = cohort.map((p) => ({
    externalId: p.id,
    email: p.email,
    firstName: cleanFirstName(p.firstName),
    lastName: surnameFor(p.lastName) ?? p.lastName,
    phone: p.phone,
    primarySpecialty: publishableSpecialty(p),
    subSpecialty: p.specialtyConfirmedAt ? p.subSpecialty : null,
    state: p.state,
    isDiaspora: p.isDiaspora,
    mdcnFolioNumber: p.credentials[0]?.licenseNumber ?? null,
  }));

  console.log(`Cohort: ${payloads.length} registered doctors with no survey answer`);
  if (!live) {
    console.log("DRY RUN. Nothing sent. Sample of three:");
    console.log(JSON.stringify(payloads.slice(0, 3), null, 2));
    console.log("Re-run with --live to open these accounts.");
    return;
  }

  const results: ApiResult[] = [];
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE);
    const label = `${i + 1}-${i + batch.length}`;
    try {
      const batchResults = await send(batch, secret!, baseUrl!);
      results.push(...batchResults);
      const opened = batchResults.filter((r) => r.claimUrl).length;
      console.log(`  ${label}: ${opened} with a link, ${batch.length - opened} without`);
    } catch (err) {
      // Idempotent on email, so a failed batch is re-runnable rather than lost.
      console.error(`  ${label}: FAILED, ${err instanceof Error ? err.message : err}`);
      for (const p of batch) {
        results.push({ externalId: p.externalId, status: "skipped", reason: "batch failed" });
      }
    }
  }

  const byId = new Map(cohort.map((p) => [p.id, p]));
  const rows = results.map((r) => {
    const p = byId.get(r.externalId);
    return [
      r.externalId,
      p?.email ?? "",
      `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim(),
      p?.cadre ?? "",
      r.status,
      r.claimUrl ?? "",
      (r.reason ?? "").replace(/[",\n]/g, " "),
    ];
  });

  const outDir = path.join(__dirname, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = path.join(outDir, `mezo-backfill-${stamp}.csv`);
  fs.writeFileSync(
    outFile,
    ["externalId,email,name,cadre,status,claimUrl,reason", ...rows.map((r) => r.map(csv).join(","))].join("\n"),
  );

  const created = results.filter((r) => r.status === "created").length;
  const existing = results.filter((r) => r.status === "existing").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const withLink = results.filter((r) => r.claimUrl).length;
  console.log(`\ncreated ${created}, existing ${existing}, skipped ${skipped}, links ${withLink}`);
  console.log(`Links expire in 30 days. Written to ${outFile}`);
}

async function send(batch: unknown[], secret: string, baseUrl: string): Promise<ApiResult[]> {
  // Signed over the exact string sent. Serialise once and send that string:
  // re-serialising would change the bytes and the signature would not verify.
  const body = JSON.stringify({ professionals: batch });
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/partners/cadrehealth/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cfa-signature": signature },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Mezo returned ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const data = (await res.json()) as { results?: ApiResult[] };
  return data.results ?? [];
}

/** The register import put titles in the first name field, so "Dr Francis". */
function cleanFirstName(firstName: string): string {
  return firstName.replace(/^\s*(dr|prof|professor|mr|mrs|ms|miss)\.?\s+/i, "").trim() || firstName;
}

function csv(value: string): string {
  return /[",]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
