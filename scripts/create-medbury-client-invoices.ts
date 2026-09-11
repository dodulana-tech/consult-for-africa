/**
 * Create (or update) Medbury Healthcare Group as a platform client, the Abuja
 * campus engagement, and the Medbury invoices.
 *
 * Idempotent. Client upserts by name, engagement by engagementCode, each
 * invoice by invoiceNumber. Safe to rerun after adding a new entry to INVOICES.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/create-medbury-client-invoices.ts
 *   npx tsx --env-file=.env.local scripts/create-medbury-client-invoices.ts --sent
 *
 * --sent marks every invoice below SENT instead of DRAFT. Leave invoices DRAFT
 * until the PDF has actually gone to the client.
 *
 * To add the next Medbury invoice: append an entry to INVOICES and rerun.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MARK_SENT = process.argv.includes("--sent");

const CLIENT_NAME = "Medbury Healthcare Group";
const ENGAGEMENT_NAME = "Lyfe Place Abuja Medical Campus";
const ENGAGEMENT_CODE = "C4A-2026-004";

// ---------------------------------------------------------------- client
const CLIENT = {
  name: CLIENT_NAME,
  type: "PRIVATE_ELITE" as const,
  primaryContact: "Dr Itunu Akinware (Group Chief Executive Officer)",
  email: "", // TODO: Itunu's email. Left blank rather than guessed.
  phone: "",
  address: "Lagos, Nigeria",
  paymentTerms: 14,
  currency: "NGN" as const,
  status: "ACTIVE" as const,
  notes:
    "Multi-business-unit healthcare group. Business units: Medical Services (occupational health, " +
    "corporate wellness), Diagnostics (Lifecheck), Pharmaceuticals (VMI, Yewande Adekoya), Medlyfe " +
    "Wellness Clinic, Wellness Hub (Lyfe Centre, Lekki), and Hospitals (Dr John). Group CEO will not " +
    "override BU-lead autonomy, so work is proposed group-level to her and BU-level to each lead. " +
    "Live and proposed CFA workstreams: Abuja campus (Lyfe Place Abuja, Hospitals Division), the " +
    "setup and management mandate over the campus, Group Strategy Office retainer, Lyfe Place " +
    "Aesthetics JV with KP Plastics, The Cloister (Harley Street in Ikoyi), and BU proposals for " +
    "corporate wellness, diagnostics growth and functional medicine. Second contact: Dr John, " +
    "Hospitals Division lead, owns the Abuja clinic.",
};

// ------------------------------------------------------------ engagement
const ENGAGEMENT = {
  name: ENGAGEMENT_NAME,
  description:
    "Conversion of a four-structure residential compound in Abuja into a private ambulatory medical " +
    "campus for the Hospitals Division. Phase delivered to date: facility search and site evaluation " +
    "across Asokoro, Maitama and Wuse II, ending in a secured site, followed by measured survey, floor " +
    "plans, allocation, rate assumptions and the campus business case. The setup and management " +
    "mandate covering development, entity establishment, management and equity is proposed and not " +
    "yet signed, so the budget below carries only what is contracted.",
  serviceType: "HOSPITAL_OPERATIONS" as const,
  engagementType: "PROJECT" as const,
  startDate: new Date("2026-06-01"),
  status: "ACTIVE" as const,
  budgetAmount: 1_250_000,
  budgetCurrency: "NGN" as const,
  engagementCode: ENGAGEMENT_CODE,
  notes:
    "Search commenced ahead of contractual alignment. The 5% of rental originally proposed alongside " +
    "the NGN 750,000 was declined by Medbury and withdrawn by CFA, so the facility upside now rests " +
    "on the later mandate, not on the search. Ask for the mandate: a disbursements clause, fees as " +
    "agreed plus third-party costs at cost against receipts, approved in advance above a threshold.",
};

// -------------------------------------------------------------- invoices
// Append new Medbury invoices here and rerun.
const INVOICES = [
  {
    invoiceNumber: "CFA-MBY-2026-001",
    invoiceType: "STANDARD" as const,
    issuedDate: new Date("2026-08-16"),
    dueDate: new Date("2026-08-30"),
    pdf: "docs/medbury-search-invoice-cfa.pdf",
    lineItems: [
      {
        description:
          "Professional fee, location search and site evaluation, Abuja. Search brief, agent " +
          "engagement, site visits and filtering across Asokoro, Maitama and Wuse II, comparative " +
          "evaluation and shortlist, and management of the search to a secured site.",
        quantity: 1,
        unitPrice: 750_000,
        amount: 750_000,
        category: "consulting_fee",
        sortOrder: 0,
      },
      {
        description:
          "Disbursements advanced on Medbury's behalf, at cost, no mark-up. Agent viewing and " +
          "inspection fees NGN 310,000; Abuja site visit transport and logistics NGN 190,000. " +
          "Lagos to Abuja travel and accommodation shown on the invoice schedule and waived.",
        quantity: 1,
        unitPrice: 500_000,
        amount: 500_000,
        category: "expense_reimbursement",
        sortOrder: 1,
      },
    ],
    clientNotes:
      "Abuja facility search and site evaluation, Hospitals Division. Fee NGN 750,000 as agreed, plus " +
      "NGN 500,000 of third-party disbursements at cost with receipts attached. The 5% of rental " +
      "proposed at the outset was not accepted by Medbury and is charged as nil, and is not carried " +
      "forward to any later phase. Consultant time beyond the mobilisation scope, and Lagos to Abuja " +
      "travel and accommodation, are waived. Agency, legal and caution on the lease are contracted " +
      "and settled directly by Medbury. Payable within 14 days.",
    notes:
      "Search close-out invoice. PDF built by scripts/build-medbury-search-invoice.py, cover note at " +
      "docs/medbury-search-invoice-cover-note.md. Disbursement split of 310,000 / 190,000 is CFA's " +
      "recommended position sized to stay under two thirds of the fee, to be replaced by receipted " +
      "actuals. CFA absorbed its own travel and the consultant time overrun rather than reopen a fee " +
      "Medbury considers settled, and offered to net the disbursements off the first mandate tranche " +
      "if cash timing is awkward.",
  },
];

const BANK_DETAILS = {
  bank: "Zenith Bank",
  accountName: "Consult for Africa Management Services Limited",
  accountNumber: "1312352157",
};

async function main() {
  // ---- client ----
  const existingClient = await prisma.client.findFirst({ where: { name: CLIENT_NAME } });
  const client = existingClient
    ? await prisma.client.update({ where: { id: existingClient.id }, data: CLIENT })
    : await prisma.client.create({ data: CLIENT });
  console.log(`${existingClient ? "Updated" : "Created"} client ${client.name} (${client.id}).`);

  // ---- engagement ----
  // Match on this client's own engagement of this name. Never match on
  // engagementCode alone: codes are global, and an upsert by code will silently
  // overwrite another client's engagement if the code is already taken.
  const existingEng = await prisma.engagement.findFirst({
    where: { clientId: client.id, name: ENGAGEMENT_NAME },
  });
  const codeOwner = await prisma.engagement.findUnique({ where: { engagementCode: ENGAGEMENT_CODE } });
  if (codeOwner && codeOwner.id !== existingEng?.id) {
    throw new Error(
      `Engagement code ${ENGAGEMENT_CODE} already belongs to "${codeOwner.name}" (${codeOwner.id}). ` +
        `Pick a free code before rerunning.`,
    );
  }
  const engagement = existingEng
    ? await prisma.engagement.update({ where: { id: existingEng.id }, data: { ...ENGAGEMENT, clientId: client.id } })
    : await prisma.engagement.create({ data: { ...ENGAGEMENT, clientId: client.id } });
  console.log(`${existingEng ? "Updated" : "Created"} engagement ${engagement.engagementCode} ${engagement.name} (${engagement.id}).`);

  // ---- invoices ----
  for (const inv of INVOICES) {
    const subtotal = inv.lineItems.reduce((s, li) => s + li.amount, 0);
    const baseData = {
      clientId: client.id,
      engagementId: engagement.id,
      invoiceType: inv.invoiceType,
      subtotal,
      tax: 0,
      whtAmount: 0,
      discountAmount: 0,
      total: subtotal,
      paidAmount: 0,
      balanceDue: subtotal,
      currency: "NGN" as const,
      status: (MARK_SENT ? "SENT" : "DRAFT") as "SENT" | "DRAFT",
      issuedDate: inv.issuedDate,
      dueDate: inv.dueDate,
      lineItems: inv.lineItems, // legacy JSON mirror
      bankDetails: { ...BANK_DETAILS, reference: inv.invoiceNumber },
      clientNotes: inv.clientNotes,
      notes: `${inv.notes} PDF: ${inv.pdf}`,
    };

    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
    let invoiceId: string;
    if (existing) {
      // preserve payment state on rerun
      await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          ...baseData,
          status: existing.status === "DRAFT" ? baseData.status : existing.status,
          paidAmount: existing.paidAmount,
          balanceDue: Number(subtotal) - Number(existing.paidAmount),
        },
      });
      await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: existing.id } });
      invoiceId = existing.id;
      console.log(`  Updated invoice ${inv.invoiceNumber} (${invoiceId}).`);
    } else {
      const created = await prisma.invoice.create({ data: { invoiceNumber: inv.invoiceNumber, ...baseData } });
      invoiceId = created.id;
      console.log(`  Created invoice ${inv.invoiceNumber} (${invoiceId}).`);
    }

    for (const li of inv.lineItems) {
      await prisma.invoiceLineItem.create({ data: { invoiceId, ...li } });
    }
    console.log(`  ${inv.lineItems.length} line items.`);
  }

  // ---- read-back ----
  const view = await prisma.client.findUnique({
    where: { id: client.id },
    include: {
      engagements: { select: { engagementCode: true, name: true, status: true, budgetAmount: true } },
      invoices: { include: { lineItemRecords: { orderBy: { sortOrder: "asc" } } }, orderBy: { invoiceNumber: "asc" } },
    },
  });
  console.log("\n" + "=".repeat(64));
  console.log(`  ${view?.name}  |  ${view?.type}  |  terms ${view?.paymentTerms} days`);
  for (const e of view?.engagements ?? []) {
    console.log(`  Engagement  ${e.engagementCode}  ${e.name}  ${e.status}  N${Number(e.budgetAmount).toLocaleString()}`);
  }
  for (const i of view?.invoices ?? []) {
    console.log(`  Invoice     ${i.invoiceNumber}  ${i.status}  N${Number(i.total).toLocaleString()}  due ${i.dueDate?.toISOString().slice(0, 10)}`);
    for (const li of i.lineItemRecords) {
      console.log(`      N${Number(li.amount).toLocaleString().padStart(11)}  ${li.category}`);
    }
  }
  const total = (view?.invoices ?? []).reduce((s, i) => s + Number(i.total), 0);
  const due = (view?.invoices ?? []).reduce((s, i) => s + Number(i.balanceDue), 0);
  console.log(`  Invoiced to date N${total.toLocaleString()}  |  Outstanding N${due.toLocaleString()}`);
  console.log("=".repeat(64));
  if (!MARK_SENT) console.log("Invoices left DRAFT. Rerun with --sent once the PDF has gone out.");
  if (!CLIENT.email) console.log("Client email is blank. Set CLIENT.email to Itunu's address and rerun.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
