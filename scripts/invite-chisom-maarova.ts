/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Fix: invite Dr Chisom Nriezedi to Maarova under "Consult for Africa".
 *
 * Mirrors app/api/maarova/admin/users/route.ts (temp password, bcrypt hash,
 * isPortalEnabled, invitedAt) and sends the real emailMaarovaInvite, but forces
 * BASE_URL to the production domain so the assessment link is valid (the local
 * NEXTAUTH_URL points at localhost). Sends via the configured transport and
 * AWAITS the result so delivery is confirmed, not fire-and-forget.
 *
 * Run (CommonJS so the @/ alias + .env.local can be wired up manually):
 *   npx ts-node --transpile-only --compiler-options '{"module":"commonjs"}' scripts/invite-chisom-maarova.ts
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..");

// Resolve the project's "@/..." path alias to the repo root.
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...rest: unknown[]) {
  if (request === "@" || request.startsWith("@/")) {
    request = path.join(ROOT, request.slice(1) || "/");
  }
  return origResolve.call(this, request, ...rest);
};

// Load .env.local then .env (Prisma only auto-loads .env; mail keys are in .env.local).
function loadEnv(file: string) {
  let txt: string;
  try {
    txt = fs.readFileSync(path.join(ROOT, file), "utf8");
  } catch {
    return;
  }
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv(".env.local");
loadEnv(".env");

// Force the production base URL so the emailed link is valid (must be set
// before requiring lib/email, which reads NEXTAUTH_URL at module load).
process.env.NEXTAUTH_URL = "https://consultforafrica.com";

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const { emailMaarovaInvite } = require(path.join(ROOT, "lib/email"));

const prisma = new PrismaClient();

const EMAIL = "chisomnriezedi@gmail.com";
const NAME = "Chisom Nriezedi";
const TITLE = "Dr";

async function main() {
  const org = await prisma.maarovaOrganisation.findFirst({
    where: { name: { contains: "consult for africa", mode: "insensitive" } },
    select: { id: true, name: true, isActive: true },
  });
  if (!org) {
    const all = await prisma.maarovaOrganisation.findMany({ select: { name: true, isActive: true } });
    console.error('No org matching "Consult for Africa". Existing orgs:', all);
    return;
  }
  if (!org.isActive) {
    console.error(`Org "${org.name}" is inactive; cannot invite.`);
    return;
  }
  console.log(`Org: ${org.name} (${org.id})`);

  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const existing = await prisma.maarovaUser.findUnique({ where: { email: EMAIL } });
  let user;
  if (existing) {
    console.log(`User already exists (${existing.id}); re-enabling and resetting temp password.`);
    user = await prisma.maarovaUser.update({
      where: { id: existing.id },
      data: { passwordHash, isPortalEnabled: true, invitedAt: new Date() },
      select: { id: true, name: true, email: true },
    });
  } else {
    user = await prisma.maarovaUser.create({
      data: {
        organisationId: org.id,
        name: NAME,
        email: EMAIL,
        passwordHash,
        title: TITLE,
        role: "USER",
        isPortalEnabled: true,
        invitedAt: new Date(),
      },
      select: { id: true, name: true, email: true },
    });
    console.log(`Created MaarovaUser ${user.id}`);
  }

  let sent = false;
  try {
    await emailMaarovaInvite({
      email: user.email,
      name: user.name,
      organisationName: org.name,
      password: tempPassword,
    });
    sent = true;
  } catch (err) {
    console.error("Invite email FAILED to send:", err);
  }

  console.log("=".repeat(56));
  console.log(`Maarova invite for ${user.name} <${user.email}>`);
  console.log(`  Email sent:      ${sent ? "YES" : "NO (see error above)"}`);
  console.log(`  Login URL:       https://consultforafrica.com/maarova/portal/login`);
  console.log(`  Temp password:   ${tempPassword}   (backup; also in her email)`);
  console.log("=".repeat(56));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
