/**
 * Create (or update) the platform finance Invoice record for Haven, matching
 * the emailed PDF invoice CFA-HAV-2026-001. Links the four payment milestones
 * to the invoice so the schedule + payment tracking show in finance and the
 * client portal.
 *
 * Idempotent: upserts by invoiceNumber. Usage:
 *   npx ts-node --transpile-only scripts/create-haven-invoice-record.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CLIENT_NAME = "Haven Paediatric Centre";
const INVOICE_NUMBER = "CFA-HAV-2026-001";

const LINE_ITEMS = [
  {
    description: "Workstream 1: Diagnostic Audit (4 weeks) — clinical governance, operations, finance and working capital, procurement, HMO economics, reporting integrity.",
    quantity: 1,
    unitPrice: 1_800_000,
    amount: 1_800_000,
    category: "mobilization",
    sortOrder: 0,
  },
  {
    description: "Workstreams 2-4: Core engagement — culture, incentives & clinical standards of work; process reengineering & operations; revenue & growth optimisation.",
    quantity: 1,
    unitPrice: 7_500_000,
    amount: 7_500_000,
    category: "consulting_fee",
    sortOrder: 1,
  },
];

const BANK_DETAILS = {
  bank: "Zenith Bank",
  accountName: "Consult for Africa Management Services Limited",
  accountNumber: "1312352157",
  reference: INVOICE_NUMBER,
};

const CLIENT_NOTES =
  "Agreed at the meeting of 27 June 2026. Standard Consult for Africa value N17,000,000; " +
  "agreed fee N9,300,000 (concession N7,700,000). Payment: mobilisation N1,800,000 (Diagnostic Audit) " +
  "on acceptance, then three monthly instalments of N2,500,000 (Jul/Aug/Sep 2026). On acceptance and " +
  "receipt of the mobilisation fee, Consult for Africa mobilises within the week. The optional " +
  "board-oversight retainer (N600,000/month) is billed separately.";

const INTERNAL_NOTES =
  "Engagement invoice for the negotiated N9.3M core fee. PDF (docs/haven-invoice-cfa.pdf) emailed to " +
  "Kabir (kabir@aurorahills.co) cc Usman (usman.g@aurorahills.co) on 30 June 2026. Four payment " +
  "milestones linked: mobilisation N1.8M on acceptance + 3 x N2.5M monthly.";

async function main() {
  const client = await prisma.client.findFirst({ where: { name: CLIENT_NAME } });
  if (!client) throw new Error(`No client "${CLIENT_NAME}".`);
  const engagement = await prisma.engagement.findFirst({ where: { clientId: client.id }, select: { id: true } });

  const baseData = {
    clientId: client.id,
    engagementId: engagement?.id ?? null,
    invoiceType: "STANDARD" as const,
    subtotal: 9_300_000,
    tax: 0,
    whtAmount: 0,
    discountAmount: 0,
    total: 9_300_000,
    paidAmount: 0,
    balanceDue: 9_300_000,
    currency: "NGN" as const,
    status: "SENT" as const,
    issuedDate: new Date("2026-06-30"),
    dueDate: new Date("2026-09-30"),
    lineItems: LINE_ITEMS, // legacy JSON mirror
    bankDetails: BANK_DETAILS,
    clientNotes: CLIENT_NOTES,
    notes: INTERNAL_NOTES,
  };

  const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: INVOICE_NUMBER } });
  let invoiceId: string;
  if (existing) {
    await prisma.invoice.update({ where: { id: existing.id }, data: baseData });
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
