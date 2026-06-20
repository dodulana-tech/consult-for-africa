/**
 * One-off: update Dr Maryam's CadreProfessional email.
 * Usage: npx ts-node --transpile-only scripts/update-maryam-email.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ID = "cmpft16ed02j9gitbvrmdf54p";
const OLD = "maryam.dantata@eha.ng";
const NEW = "dantatamb@gmail.com"; // lowercased to match login normalization

async function main() {
  const current = await prisma.cadreProfessional.findUnique({
    where: { id: ID },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!current) throw new Error("Record not found");
  if (current.email.toLowerCase() !== OLD.toLowerCase()) {
    throw new Error(`Safety check failed: current email is ${current.email}, expected ${OLD}`);
  }

  const clash = await prisma.cadreProfessional.findFirst({
    where: { email: { equals: NEW, mode: "insensitive" }, NOT: { id: ID } },
    select: { id: true, email: true },
  });
  if (clash) throw new Error(`New email already in use by ${clash.id} (${clash.email}). Aborting.`);

  const updated = await prisma.cadreProfessional.update({
    where: { id: ID },
    data: { email: NEW },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  console.log("BEFORE:", JSON.stringify(current));
  console.log("AFTER :", JSON.stringify(updated));
  console.log("OK: email updated.");
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
