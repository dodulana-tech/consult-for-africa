/**
 * Read-only: locate maryam.dantata@eha.ng across user-bearing tables.
 * Usage: npx ts-node --transpile-only scripts/find-maryam-email.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET = "maryam.dantata@eha.ng";

async function main() {
  const checks: Array<[string, () => Promise<any[]>]> = [
    ["User", () => prisma.user.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["Client", () => prisma.client.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["ClientContact", () => prisma.clientContact.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["MaarovaUser", () => prisma.maarovaUser.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["MaarovaCoach", () => prisma.maarovaCoach.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["MaarovaCircleApplication", () => prisma.maarovaCircleApplication.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["TalentApplication", () => prisma.talentApplication.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["PartnerContact", () => prisma.partnerContact.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["CadreProfessional", () => prisma.cadreProfessional.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
    ["CadreEmployerAccount", () => prisma.cadreEmployerAccount.findMany({ where: { contactEmail: { equals: TARGET, mode: "insensitive" } } })],
    ["CadreNewsletterSubscriber", () => prisma.cadreNewsletterSubscriber.findMany({ where: { email: { equals: TARGET, mode: "insensitive" } } })],
  ];

  for (const [name, run] of checks) {
    try {
      const rows = await run();
      if (rows.length) {
        for (const r of rows) {
          console.log(`HIT [${name}] id=${r.id} name=${r.name ?? r.fullName ?? r.firstName ?? "?"} email=${r.email} portalEnabled=${r.isPortalEnabled ?? "-"} org=${r.organisationId ?? "-"}`);
        }
      } else {
        console.log(`---  [${name}] none`);
      }
    } catch (e: any) {
      console.log(`ERR  [${name}] ${e.message}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
