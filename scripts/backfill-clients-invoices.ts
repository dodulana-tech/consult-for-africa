/**
 * Backfill platform records for invoices that existed only as PDFs in docs/.
 *
 * Creates the missing clients (Belfiore Medical, Aman HMO), an engagement for
 * each where none existed, the invoice records, and the payments received.
 *
 * Idempotent. Clients upsert by name, engagements by client + name, invoices by
 * invoiceNumber, payments by invoice + reference. Safe to rerun.
 *
 * Belfiore's invoice record is created by the existing
 * scripts/create-belfiore-invoice-record.ts, which needs the client this script
 * creates. Run this first, then that.
 *
 * Payment dates marked ASSUMED below are taken from the invoice schedule, not
 * from a bank statement. Correct them if the value date matters.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-clients-invoices.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BANK = {
  bank: "Zenith Bank",
  accountName: "Consult for Africa Management Services Limited",
  accountNumber: "1312352157",
};

const CLIENTS = [
  {
    name: "Belfiore Medical",
    type: "PRIVATE_MIDTIER" as const,
    primaryContact: "Dr Uju Rapu (Chief Executive Officer)",
    email: "", // deliberately blank. uju@belfiore.ng is a demo seed login, not a real address.
    phone: "",
    address: "Lagos, Nigeria",
    paymentTerms: 30,
    currency: "NGN" as const,
    status: "ACTIVE" as const,
    notes:
      "Aesthetics and wellness practice. Phase 1 is the Belfiore Client Vault, a secure client data " +
      "system with NDPA 2023 compliance groundwork. Care and hosting billed separately from go-live.",
    engagement: {
      name: "Belfiore Client Vault, Phase 1",
      code: "C4A-2026-006",
      description:
        "Secure client data system for Belfiore Medical. Discovery and channel mapping across all six " +
        "client categories, DPIA and NDPC registration, the Vault itself with unified client records, " +
        "role-based access and a full audit trail, migration from paper, team training, go-live and two " +
        "weeks of support. Fixed scope.",
      serviceType: "DIGITAL_HEALTH" as const,
      startDate: new Date("2026-07-31"),
      budgetAmount: 6_880_000,
      notes: "Invoice record created by scripts/create-belfiore-invoice-record.ts. Run that after this script.",
    },
    invoices: [],
  },
  {
    name: "Aman HMO",
    type: "PRIVATE_MIDTIER" as const,
    primaryContact: "Zayyad Abdulrahman (Chief Financial Officer)",
    email: "",
    phone: "",
    address: "Abuja, Nigeria",
    paymentTerms: 30,
    currency: "NGN" as const,
    status: "ACTIVE" as const,
    notes:
      "Takaful and Islamic HMO expanding south into Lagos. CFA builds a data-led provider network " +
      "anchored to existing-client Lagos branches and the Islamic-affinity network, and equips Aman's " +
      "own business-development team to execute it.",
    engagement: {
      name: "Aman HMO Lagos Provider Network Growth",
      code: "C4A-2026-005",
      description:
        "Lagos provider-network growth. Mobilisation covers enrollee and account geography analysis, " +
        "priority-cluster and adequacy mapping, and the full structuring of the growth plan. Execution " +
        "equips and drives Aman's existing business-development team against that plan over three " +
        "months, including the clinician-led build, ancillary terms and the partnership pipeline.",
      serviceType: "HEALTH_SYSTEMS" as const,
      startDate: new Date("2026-07-27"),
      budgetAmount: 5_100_000,
      notes: "Mobilisation and month 1 received. Months 2 and 3 fall due 27 August and 27 September 2026.",
    },
    invoices: [
      {
        invoiceNumber: "CFA-AMAN-2026-001",
        invoiceType: "STANDARD" as const,
        issuedDate: new Date("2026-07-27"),
        dueDate: new Date("2026-09-27"),
        pdf: "docs/aman-invoice-cfa.pdf",
        lineItems: [
          {
            description:
              "Mobilisation, build the engine. Enrollee and account geography analysis, priority-cluster " +
              "and adequacy mapping, and full structuring of the Lagos provider-network growth plan.",
            quantity: 1,
            unitPrice: 1_912_500,
            amount: 1_912_500,
            category: "mobilization",
            sortOrder: 0,
          },
          {
            description:
              "Execution, enable the BD team over three months. Equip and drive Aman's existing " +
              "business-development team against the plan, including the clinician-led build, ancillary " +
              "terms and the partnership pipeline.",
            quantity: 1,
            unitPrice: 3_187_500,
            amount: 3_187_500,
            category: "consulting_fee",
            sortOrder: 1,
          },
        ],
        clientNotes:
          "Agreed engagement fee NGN 5,100,000. Disbursement plan: mobilisation plus month 1 execution " +
          "NGN 2,975,000 on 27 July 2026, then month 2 NGN 1,062,500 on 27 August 2026 and month 3 " +
          "NGN 1,062,500 on 27 September 2026.",
        notes: "PDF built by scripts/build-aman-invoice.py.",
        payments: [
          {
            amount: 2_975_000,
            paymentDate: new Date("2026-07-27"), // ASSUMED: the schedule date, not a bank value date
            paymentMethod: "bank_transfer",
            reference: "CFA-AMAN-2026-001-T1",
            notes: "Mobilisation NGN 1,912,500 plus month 1 execution NGN 1,062,500. Payment date assumed from the invoice schedule.",
          },
        ],
      },
    ],
  },
  {
    name: "Havana Specialist Hospital Limited", // already exists, left as is
    existingOnly: true,
    engagement: { matchExisting: true },
    invoices: [
      {
        invoiceNumber: "CFA-HSH-2026-001",
        invoiceType: "MOBILIZATION" as const,
        issuedDate: new Date("2026-07-15"),
        dueDate: new Date("2026-07-29"),
        pdf: "docs/hsh-invoice-cfa.pdf",
        lineItems: [
          {
            description:
              "Board Governance Framework, mobilisation claim. First of three payments against the " +
              "fixed net fee of NGN 2,000,000, covering board and committee instruments, capability and " +
              "training and the handbook, and the supported first governance cycle.",
            quantity: 1,
            unitPrice: 1_000_000,
            amount: 1_000_000,
            category: "mobilization",
            sortOrder: 0,
          },
        ],
        clientNotes:
          "Per the proposal of 2 July 2026 and the board's approval to proceed. Full professional value " +
          "NGN 5,000,000, less a board-partner concession of NGN 3,000,000, net fee NGN 2,000,000, " +
          "claimed as NGN 1,000,000 on mobilisation, NGN 500,000 at the agreed milestone and NGN 500,000 " +
          "on completion. Fixed fee, no success fee. The optional legal-counsel secondment is billed separately.",
        notes: "PDF built by scripts/build-hsh-invoice.py 001.",
        payments: [
          {
            amount: 1_000_000,
            paymentDate: new Date("2026-07-15"), // ASSUMED: invoice date
            paymentMethod: "bank_transfer",
            reference: "CFA-HSH-2026-001-T1",
            notes: "Mobilisation. Receipt confirmed on the face of invoice 002 (\"Received, with thanks\"). Payment date assumed from the invoice date.",
          },
        ],
      },
      {
        invoiceNumber: "CFA-HSH-2026-002",
        invoiceType: "MILESTONE" as const,
        issuedDate: new Date("2026-08-18"),
        dueDate: new Date("2026-09-01"),
        pdf: "docs/hsh-invoice-002-cfa.pdf",
        lineItems: [
          {
            description:
              "Board Governance Framework, milestone claim. Second of three payments. Workstream 2 " +
              "(capability and training) complete, and the Workstream 1 instrument suite delivered to " +
              "the board and the Company Secretary.",
            quantity: 1,
            unitPrice: 500_000,
            amount: 500_000,
            category: "consulting_fee",
            sortOrder: 0,
          },
        ],
        clientNotes:
          "Milestone reached: the instruments pack is issued to the board and the Company Secretary, and " +
          "the training programme is complete. The final NGN 500,000 falls due on adoption of the suite " +
          "at the September 2026 board meeting.",
        notes: "PDF built by scripts/build-hsh-invoice.py 002.",
        payments: [
          {
            amount: 500_000,
            paymentDate: new Date("2026-08-18"), // ASSUMED: invoice date
            paymentMethod: "bank_transfer",
            reference: "CFA-HSH-2026-002-T1",
            notes: "Milestone payment. Payment date assumed from the invoice date.",
          },
        ],
      },
      {
        invoiceNumber: "CFA-HSH-2026-003",
        invoiceType: "FINAL_SETTLEMENT" as const,
        issuedDate: new Date("2026-08-18"),
        dueDate: new Date("2026-08-18"),
        pdf: "docs/hsh-invoice-003-cfa.pdf",
        lineItems: [
          {
            description:
              "Board Governance Framework, completion claim. Third of three payments, closing the " +
              "fixed net fee of NGN 2,000,000.",
            quantity: 1,
            unitPrice: 500_000,
            amount: 500_000,
            category: "consulting_fee",
            sortOrder: 0,
          },
        ],
        clientNotes:
          "This closes the fixed fee of NGN 2,000,000 in full. Settled ahead of the September 2026 " +
          "board meeting at which the suite is adopted. The supported first governance cycle continues " +
          "at no further charge.",
        notes:
          "PDF built by scripts/build-hsh-invoice.py 003. Raised after Havana settled the completion " +
          "tranche in advance of the adoption milestone, so the invoice records money already received.",
        payments: [
          {
            amount: 500_000,
            paymentDate: new Date("2026-08-18"), // ASSUMED: date reported
            paymentMethod: "bank_transfer",
            reference: "CFA-HSH-2026-003-T1",
            notes: "Completion tranche, paid in advance of the adoption milestone. Payment date assumed.",
          },
        ],
      },
    ],
  },
];

// Payments to record against invoices that already exist in the platform.
const EXTRA_PAYMENTS = [
  {
    invoiceNumber: "CFA-MBY-2026-001",
    amount: 1_250_000,
    paymentDate: new Date("2026-08-18"), // ASSUMED: date reported, not a bank value date
    paymentMethod: "bank_transfer",
    reference: "CFA-MBY-2026-001-T1",
    notes: "Abuja facility search, fee plus disbursements, settled in full. Payment date assumed.",
    markSentFirst: true,
  },
  {
    // Requires scripts/create-belfiore-invoice-record.ts to have run. On a first
    // pass this is skipped with a message; rerun this script after it.
    invoiceNumber: "CFA-BELF-2026-001",
    amount: 3_850_000,
    paymentDate: new Date("2026-08-18"), // ASSUMED: date reported, not a bank value date
    paymentMethod: "bank_transfer",
    reference: "CFA-BELF-2026-001-T1",
    notes:
      "Mobilisation. Reported as NGN 3,850,000. The scheduled mobilisation tranche is NGN 3,840,000, " +
      "a difference of NGN 10,000 to reconcile against the bank credit.",
    markSentFirst: true,
  },
];

async function upsertClient(spec: any) {
  const existing = await prisma.client.findFirst({ where: { name: spec.name } });
  if (spec.existingOnly) {
    if (!existing) throw new Error(`Expected existing client "${spec.name}".`);
    return existing;
  }
  const data = {
    name: spec.name,
    type: spec.type,
    primaryContact: spec.primaryContact,
    email: spec.email,
    phone: spec.phone,
    address: spec.address,
    paymentTerms: spec.paymentTerms,
    currency: spec.currency,
    status: spec.status,
    notes: spec.notes,
  };
  const client = existing
    ? await prisma.client.update({ where: { id: existing.id }, data })
    : await prisma.client.create({ data });
  console.log(`${existing ? "Updated" : "Created"} client ${client.name}`);
  return client;
}

async function upsertEngagement(clientId: string, spec: any) {
  if (spec.matchExisting) {
    return prisma.engagement.findFirst({ where: { clientId } });
  }
  const existing = await prisma.engagement.findFirst({ where: { clientId, name: spec.name } });
  const codeOwner = await prisma.engagement.findUnique({ where: { engagementCode: spec.code } });
  if (codeOwner && codeOwner.id !== existing?.id) {
    throw new Error(`Engagement code ${spec.code} already belongs to "${codeOwner.name}". Pick a free code.`);
  }
  const data = {
    clientId,
    name: spec.name,
    description: spec.description,
    serviceType: spec.serviceType,
    engagementType: "PROJECT" as const,
    startDate: spec.startDate,
    status: "ACTIVE" as const,
    budgetAmount: spec.budgetAmount,
    budgetCurrency: "NGN" as const,
    engagementCode: spec.code,
    notes: spec.notes,
  };
  const eng = existing
    ? await prisma.engagement.update({ where: { id: existing.id }, data })
    : await prisma.engagement.create({ data });
  console.log(`  ${existing ? "Updated" : "Created"} engagement ${eng.engagementCode} ${eng.name}`);
  return eng;
}

async function recordPayment(invoiceId: string, p: any) {
  const existing = await prisma.payment.findFirst({ where: { invoiceId, reference: p.reference } });
  if (existing) {
    await prisma.payment.update({
      where: { id: existing.id },
      data: { amount: p.amount, paymentDate: p.paymentDate, paymentMethod: p.paymentMethod, notes: p.notes, status: "CONFIRMED", confirmedAt: new Date() },
    });
    console.log(`    Updated payment ${p.reference} N${p.amount.toLocaleString()}`);
  } else {
    await prisma.payment.create({
      data: {
        invoiceId,
        amount: p.amount,
        currency: "NGN",
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        bankName: BANK.bank,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        notes: p.notes,
      },
    });
    console.log(`    Recorded payment ${p.reference} N${p.amount.toLocaleString()}`);
  }
}

async function settleInvoice(invoiceId: string) {
  const agg = await prisma.payment.aggregate({
    where: { invoiceId, status: "CONFIRMED" },
    _sum: { amount: true },
    _max: { paymentDate: true },
  });
  const paid = Number(agg._sum.amount ?? 0);
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const total = Number(inv.total);
  const status = paid <= 0 ? inv.status : paid >= total ? "PAID" : "PARTIALLY_PAID";
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: paid,
      balanceDue: total - paid,
      status,
      paidDate: paid >= total ? agg._max.paymentDate : null,
    },
  });
  return { paid, total, status };
}

async function upsertInvoice(clientId: string, engagementId: string | null, inv: any) {
  const subtotal = inv.lineItems.reduce((s: number, li: any) => s + li.amount, 0);
  const baseData = {
    clientId,
    engagementId,
    invoiceType: inv.invoiceType,
    subtotal,
    tax: 0,
    whtAmount: 0,
    discountAmount: 0,
    total: subtotal,
    currency: "NGN" as const,
    issuedDate: inv.issuedDate,
    dueDate: inv.dueDate,
    lineItems: inv.lineItems,
    bankDetails: { ...BANK, reference: inv.invoiceNumber },
    clientNotes: inv.clientNotes,
    notes: `${inv.notes} PDF: ${inv.pdf}`,
  };
  const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: inv.invoiceNumber } });
  let invoiceId: string;
  if (existing) {
    await prisma.invoice.update({ where: { id: existing.id }, data: baseData });
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: existing.id } });
    invoiceId = existing.id;
    console.log(`  Updated invoice ${inv.invoiceNumber}`);
  } else {
    const created = await prisma.invoice.create({ data: { invoiceNumber: inv.invoiceNumber, status: "SENT", ...baseData } });
    invoiceId = created.id;
    console.log(`  Created invoice ${inv.invoiceNumber}`);
  }
  for (const li of inv.lineItems) await prisma.invoiceLineItem.create({ data: { invoiceId, ...li } });
  for (const p of inv.payments ?? []) await recordPayment(invoiceId, p);
  const r = await settleInvoice(invoiceId);
  console.log(`    ${r.status}  paid N${r.paid.toLocaleString()} of N${r.total.toLocaleString()}`);
}

async function main() {
  for (const spec of CLIENTS) {
    const client = await upsertClient(spec);
    const eng = await upsertEngagement(client.id, spec.engagement);
    for (const inv of spec.invoices ?? []) {
      await upsertInvoice(client.id, eng?.id ?? null, inv);
    }
  }

  for (const p of EXTRA_PAYMENTS) {
    const inv = await prisma.invoice.findUnique({ where: { invoiceNumber: p.invoiceNumber } });
    if (!inv) {
      console.log(`! No invoice ${p.invoiceNumber}, skipped.`);
      continue;
    }
    if (p.markSentFirst && inv.status === "DRAFT") {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: "SENT" } });
    }
    console.log(`Payment against ${p.invoiceNumber}`);
    await recordPayment(inv.id, p);
    const r = await settleInvoice(inv.id);
    console.log(`    ${r.status}  paid N${r.paid.toLocaleString()} of N${r.total.toLocaleString()}`);
  }

  // ---- ledger read-back ----
  const invoices = await prisma.invoice.findMany({
    include: { client: { select: { name: true } } },
    orderBy: [{ client: { name: "asc" } }, { invoiceNumber: "asc" }],
  });
  console.log("\n" + "=".repeat(78));
  let t = 0, pd = 0;
  for (const i of invoices) {
    t += Number(i.total);
    pd += Number(i.paidAmount);
    console.log(
      `  ${i.invoiceNumber.padEnd(19)} ${i.client.name.slice(0, 28).padEnd(29)} ` +
        `N${Number(i.total).toLocaleString().padStart(10)}  paid N${Number(i.paidAmount).toLocaleString().padStart(10)}  ${i.status}`,
    );
  }
  console.log("-".repeat(78));
  console.log(`  ${"TOTAL".padEnd(49)} N${t.toLocaleString().padStart(10)}  paid N${pd.toLocaleString().padStart(10)}  outstanding N${(t - pd).toLocaleString()}`);
  console.log("=".repeat(78));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
