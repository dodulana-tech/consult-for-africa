/**
 * Put the Osteon Clinics organisational audit on the platform.
 *
 * Until now the audit existed only as routes, a reader page and a registry
 * entry with engagementId null, so it appeared nowhere the platform organises
 * work by client: not on the dashboard, not in projects, not in the portfolio.
 * This creates the client and the engagement so it does.
 *
 * Two things are deliberately not invented. The audit is NOT billed, so
 * budgetAmount is zero rather than a notional number that would flow into
 * revenue reporting. And Dr Bola's email and phone are not on file anywhere in
 * this database, so they are left empty rather than guessed; an empty string
 * fails fast and visibly if a send script ever reaches for one.
 *
 * Idempotent: re-running updates the existing records rather than duplicating.
 *
 *   npx tsx --env-file=.env.local scripts/create-osteon-engagement.ts
 */

import { prisma } from "../lib/prisma";

const CLIENT_NAME = "Osteon Clinics";
const ENGAGEMENT_NAME = "Osteon Clinics Organisational Audit";
const ENGAGEMENT_CODE = "C4A-2026-007";

async function main() {
  const em = await prisma.user.findFirst({
    where: { role: { in: ["PARTNER", "ADMIN"] } },
    select: { id: true, name: true, email: true },
  });
  if (!em) {
    console.error("No partner or admin user found to own the engagement.");
    process.exit(1);
  }

  const existingClient = await prisma.client.findFirst({
    where: { name: CLIENT_NAME },
    select: { id: true },
  });

  const client = existingClient
    ? await prisma.client.update({
        where: { id: existingClient.id },
        data: { status: "ACTIVE" },
        select: { id: true, name: true },
      })
    : await prisma.client.create({
        data: {
          name: CLIENT_NAME,
          type: "PRIVATE_MIDTIER",
          primaryContact: "Dr Bolarinwa Akinola, FRCS (Tr. and Orth.)",
          // Not on file anywhere in this database. Left blank on purpose:
          // a guessed address is worse than a visible gap.
          email: "",
          phone: "",
          address: "Amuwo Odofin, Lagos",
          paymentTerms: 30,
          currency: "NGN",
          status: "ACTIVE",
          notes:
            "Surgeon-owned specialist orthopaedic clinic. Dr Bola owns Osteon and also operates " +
            "as a visiting consultant at Cedarcrest and Diamed, which is the boundary the audit " +
            "exists to measure. Email and phone are NOT on file: fill them in before any send " +
            "script is pointed at this record. Positioning and blue-ocean work delivered July 2026.",
        },
        select: { id: true, name: true },
      });

  const existingEngagement = await prisma.engagement.findFirst({
    where: { clientId: client.id, name: ENGAGEMENT_NAME },
    select: { id: true },
  });

  const description =
    "Full organisational diagnostic of a surgeon-owned arthroplasty clinic, end to end: the " +
    "boundary between the practice and the company, case economics, the elective funnel, " +
    "theatre and the perioperative pathway, sterile services and implant traceability, clinical " +
    "governance and outcomes, people, facility, systems and regulatory standing. Method spine is " +
    "the ten-case trace, following ten real cases through 22 links from first enquiry to current " +
    "outcome. Supported by four fielded survey instruments (staff, patient, referring doctors, " +
    "leadership direction) and a client document-upload channel at /OsteonProject.";

  const notes =
    "NOT BILLED. Carried by CFA as groundwork for the work that follows, so budgetAmount is zero " +
    "rather than a notional figure that would distort revenue reporting. No fee section appears " +
    "in any client document and no invoice exists, deliberately: naming the concession in writing " +
    "would price every later workstream against zero. Site visit was scheduled for 17 September " +
    "2026. As at 23 September 2026 there are zero survey responses and zero uploaded documents, " +
    "and no record that the cover email was ever sent.";

  const data = {
    clientId: client.id,
    engagementManagerId: em.id,
    name: ENGAGEMENT_NAME,
    description,
    serviceType: "HOSPITAL_OPERATIONS" as const,
    engagementType: "PROJECT" as const,
    startDate: new Date("2026-09-15T00:00:00.000Z"),
    status: "ACTIVE" as const,
    budgetAmount: 0,
    budgetCurrency: "NGN" as const,
    healthScore: 5,
    riskLevel: "MEDIUM" as const,
    notes,
    engagementCode: ENGAGEMENT_CODE,
  };

  const engagement = existingEngagement
    ? await prisma.engagement.update({
        where: { id: existingEngagement.id },
        data,
        select: { id: true, name: true, engagementCode: true },
      })
    : await prisma.engagement.create({
        data,
        select: { id: true, name: true, engagementCode: true },
      });

  console.log(`Client      ${client.name}  (${client.id})`);
  console.log(`Engagement  ${engagement.name}`);
  console.log(`            ${engagement.engagementCode}  ${engagement.id}`);
  console.log(`Manager     ${em.name} <${em.email}>`);
  console.log(
    `\nSet this on the four Osteon entries in lib/surveys/registry.ts:\n  engagementId: "${engagement.id}",`
  );
  await prisma.$disconnect();
}

main();
