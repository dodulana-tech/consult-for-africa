/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Resend Maarova invites to the Consult For Africa users who never logged in.
 * Mirrors the re-enable route (fresh temp password, portal enabled, invitedAt
 * stamped), forces the production link, awaits each send, and records the new
 * inviteEmailStatus tracking on each row.
 *
 * Run:
 *   npx ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/resend-cfa-maarova-invites.ts
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...rest: unknown[]) {
  if (request === "@" || request.startsWith("@/")) request = path.join(ROOT, request.slice(1) || "/");
  return origResolve.call(this, request, ...rest);
};
function loadEnv(file: string) {
  let txt: string;
  try { txt = fs.readFileSync(path.join(ROOT, file), "utf8"); } catch { return; }
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv(".env.local");
loadEnv(".env");
process.env.NEXTAUTH_URL = "https://consultforafrica.com";

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const { emailMaarovaInvite } = require(path.join(ROOT, "lib/email"));

const prisma = new PrismaClient();

// Accept emails from argv; default to the two that failed/were missed in the
// first run (the other 8 already recorded inviteEmailStatus=SENT).
const EMAILS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["bidornigie@gmail.com", "tihinmikalu@gmail.com"];

async function main() {
  const results: string[] = [];
  for (const email of EMAILS) {
    const user = await prisma.maarovaUser.findUnique({
      where: { email },
      include: { organisation: { select: { name: true, isActive: true } } },
    });
    if (!user) { results.push(`NOT FOUND  ${email}`); continue; }
    if (!user.organisation.isActive) { results.push(`ORG INACTIVE  ${email}`); continue; }

    const tempPassword = randomBytes(12).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await prisma.maarovaUser.update({
      where: { id: user.id },
      data: { passwordHash, isPortalEnabled: true, invitedAt: new Date() },
    });

    let sent = false;
    try {
      await emailMaarovaInvite({
        email: user.email,
        name: user.name,
        organisationName: user.organisation.name,
        password: tempPassword,
      });
      await prisma.maarovaUser.update({
        where: { id: user.id },
        data: { inviteEmailStatus: "SENT", inviteEmailSentAt: new Date(), inviteEmailError: null },
      });
      sent = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.maarovaUser.update({
        where: { id: user.id },
        data: { inviteEmailStatus: "FAILED", inviteEmailError: msg.slice(0, 1000) },
      }).catch(() => {});
    }
    results.push(`${sent ? "SENT" : "FAILED"}  ${user.name} <${user.email}>  pw=${sent ? tempPassword : "-"}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Resend results:");
  results.forEach((r) => console.log("  " + r));
  const ok = results.filter((r) => r.startsWith("SENT")).length;
  console.log(`\n${ok}/${EMAILS.length} sent.`);
  console.log("=".repeat(60));
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
