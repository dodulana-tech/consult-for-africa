/**
 * Create (or update) the platform finance Invoice record for Belfiore Medical,
 * matching the PDF invoice CFA-BELF-2026-001, and link any existing payment
 * milestones so the schedule + payment tracking show in finance and the client
 * portal.
 *
 * Idempotent: upserts by invoiceNumber. Usage:
 *   npx ts-node --transpile-only scripts/create-belfiore-invoice-record.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CLIENT_NAME = "Belfiore Medical";
const INVOICE_NUMBER = "CFA-BELF-2026-001";

const LINE_ITEMS = [
  {
    description:
      "Phase 1: The Belfiore Client Vault — discovery and channel mapping across all six client categories; " +
      "DPIA and NDPC registration; secure Vault with unified client records, role-based access and full audit " +
      "trail; migration from paper; team training, go-live and two weeks of support. Fixed scope.",
    quantity: 1,
    unitPrice: 9_500_000,
    amount: 9_500_000,
    category: "consulting_fee",
    sortOrder: 0,
  },
];

const BANK_DETAILS = {
  bank: "Zenith Bank",
  accountName: "Consult for Africa Management Services Limited",
  accountNumber: "1312352157",
  reference: INVOICE_NUMBER,
};

const CLIENT_NOTES =
  "Fixed-scope Phase 1. Standard Consult for Africa fee N9,500,000; founding-client rate N6,400,000 " +
  "(concession N3,100,000). All fees exclusive of VAT; VAT of N480,000 at 7.5% carried on the final " +
  "milestone, for a total payable of N6,880,000. Payment: mobilisation N3,840,000 (60%) on signing, then " +
  "N1,280,000 (20%) on build milestone 1 (Vault built, records migrated) and N1,760,000 on build milestone 2 " +
  "(team trained, live, handed over — N1,280,000 plus VAT). On receipt of the mobilisation fee, Consult for Africa mobilises within " +
  "the week; go-live targeted at week seven. Care & hosting is billed separately from go-live: list rate " +
  "N250,000/month, or N230,000/month where the quarter is paid in advance (N690,000/quarter), held for the " +
  "first twelve months from go-live. The NDPC registration fee is payable directly to the Commission.";

const INTERNAL_NOTES =
  "Phase 1 engagement invoice for the N6.4M founding-client fee. PDF at docs/belfiore-invoice-cfa.pdf " +
  "(built by scripts/build-belfiore-invoice.py). Client contact: Dr Uju Rapu, CEO. Care & hosting discount " +
  "to N230k/month is conditional on quarterly prepayment — reverts to N250k if paid monthly or in arrears; " +
  "reviewable after twelve months (FX exposure on in-country infra). VAT charged at 7.5% (N480,000), loaded " +
  "onto the final milestone at the client's request rather than spread across the three. Note this means the " +
  "VAT may fall due for remittance ahead of collection — confirm timing with the accountant. WHT not " +
  "modelled here; if Belfiore withholds on the fee, cash received will be below the invoiced amount.";

async function main() {
  const client = await prisma.client.findFirst({ where: { name: CLIENT_NAME } });
  if (!client) throw new Error(`No client "${CLIENT_NAME}". Create the client record first.`);
  const engagement = await prisma.engagement.findFirst({ where: { clientId: client.id }, select: { id: true } });

  const baseData = {
    clientId: client.id,
    engagementId: engagement?.id ?? null,
    invoiceType: "STANDARD" as const,
    subtotal: 9_500_000,
    tax: 480_000, // VAT @ 7.5% on the N6,400,000 agreed fee
    whtAmount: 0,
    discountAmount: 3_100_000,
    total: 6_880_000,
    paidAmount: 0,
    balanceDue: 6_880_000,
    currency: "NGN" as const,
    status: "DRAFT" as const,
    issuedDate: new Date("2026-07-31"),
    dueDate: new Date("2026-09-30"),
    lineItems: LINE_ITEMS, // legacy JSON mirror
    bankDetails: BANK_DETAILS,
    clientNotes: CLIENT_NOTES,
    notes: INTERNAL_NOTES,
  };

  const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: INVOICE_NUMBER } });
  let invoiceId: string;
  if (existing) {
    // never reset payment state on a rerun
    const paid = Number(existing.paidAmount);
    await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        ...baseData,
        status: existing.status === "DRAFT" ? baseData.status : existing.status,
        paidAmount: paid,
        balanceDue: Number(baseData.total) - paid,
      },
    });
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: existing.id } });
    invoiceId = existing.id;
    console.log(`Updated existing invoice ${INVOICE_NUMBER} (${invoiceId}).`);
  } else {
    const created = await prisma.invoice.create({ data: { invoiceNumber: INVOICE_NUMBER, ...baseData } });
    invoiceId = created.id;
    console.log(`Created invoice ${INVOICE_NUMBER} (${invoiceId}).`);
  }

  // line item records
  for (const li of LINE_ITEMS) {
    await prisma.invoiceLineItem.create({ data: { invoiceId, ...li } });
  }
  console.log(`✓ ${LINE_ITEMS.length} line items.`);

  // link payment milestones to this invoice
  if (engagement) {
    const linked = await prisma.paymentMilestone.updateMany({
      where: { engagementId: engagement.id },
      data: { invoiceId },
    });
    console.log(`✓ Linked ${linked.count} payment milestones to the invoice.`);
  } else {
    console.log("! No engagement found — no payment milestones linked. Create the engagement, then re-run.");
  }

  // read-back
  const v = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItemRecords: true, paymentMilestones: { orderBy: { dueDate: "asc" } } },
  });
  console.log("\n" + "=".repeat(56));
  console.log(`  ${INVOICE_NUMBER}  status=${v?.status}  total=N${Number(v?.total).toLocaleString()}  balanceDue=N${Number(v?.balanceDue).toLocaleString()}`);
  console.log(`  Line items: ${v?.lineItemRecords.length}  |  Linked milestones: ${v?.paymentMilestones.length}`);
  for (const p of v?.paymentMilestones ?? []) {
    console.log(`    ${p.dueDate?.toISOString().slice(0, 10)}  N${Number(p.amount).toLocaleString().padStart(10)}  ${p.status}  ${p.name}`);
  }
  console.log("=".repeat(56));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
