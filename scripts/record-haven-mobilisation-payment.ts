/**
 * Record the Haven mobilisation payment (received 7 July 2026).
 *   - Mobilisation payment milestone -> PAID
 *   - Create a CONFIRMED Payment record on invoice CFA-HAV-2026-001
 *   - Invoice -> PARTIALLY_PAID, paidAmount 1.8M, balanceDue 7.5M
 * Idempotent-ish: skips creating a duplicate payment if one already exists.
 *
 *   npx ts-node --transpile-only scripts/record-haven-mobilisation-payment.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const INVOICE_NUMBER = "CFA-HAV-2026-001";
const AMOUNT = 1_800_000;
const PAID_ON = new Date("2026-07-07");

async function main() {
  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: INVOICE_NUMBER },
    include: { payments: true },
  });
  if (!invoice) throw new Error(`Invoice ${INVOICE_NUMBER} not found.`);

  // 1. Mobilisation milestone -> PAID
  const milestone = await prisma.paymentMilestone.findFirst({
    where: { invoiceId: invoice.id, name: { contains: "Mobilisation", mode: "insensitive" } },
  });
  if (milestone) {
    await prisma.paymentMilestone.update({
      where: { id: milestone.id },
      data: { status: "PAID", paidDate: PAID_ON },
    });
    console.log(`✓ Milestone "${milestone.name}" -> PAID`);
  } else {
    console.warn("! Mobilisation milestone not found.");
  }

  // 2. Payment record (skip if an equal payment already exists)
  const dup = invoice.payments.find((p) => Number(p.amount) === AMOUNT);
  if (!dup) {
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: AMOUNT,
        currency: "NGN",
        paymentDate: PAID_ON,
        paymentMethod: "bank_transfer",
        bankName: "Zenith Bank",
        reference: "Haven mobilisation fee",
        status: "CONFIRMED",
        confirmedAt: PAID_ON,
        notes: "Diagnostic-audit mobilisation fee received 7 July 2026; engagement mobilises this week.",
      },
    });
    console.log(`✓ Payment recorded: N${AMOUNT.toLocaleString()} (Zenith Bank, CONFIRMED)`);
  } else {
    console.log("• Payment of this amount already recorded — skipped.");
  }

  // 3. Invoice roll-up
  const paidAmount = Math.min(Number(invoice.total), AMOUNT + Number(invoice.paidAmount === undefined ? 0 : 0));
  const total = Number(invoice.total);
  const paid = AMOUNT; // first payment on this invoice
  const balance = total - paid;
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paidAmount: paid,
      balanceDue: balance,
      status: balance <= 0 ? "PAID" : "PARTIALLY_PAID",
      paidDate: balance <= 0 ? PAID_ON : null,
    },
  });
  console.log(`✓ Invoice ${INVOICE_NUMBER}: PARTIALLY_PAID, paid N${paid.toLocaleString()}, balance N${balance.toLocaleString()}`);

  // read-back
  const v = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: { paymentMilestones: { orderBy: { dueDate: "asc" } }, payments: true },
  });
  console.log("\n" + "=".repeat(56));
  console.log(`  ${INVOICE_NUMBER}  ${v?.status}  paid=N${Number(v?.paidAmount).toLocaleString()}  balance=N${Number(v?.balanceDue).toLocaleString()}`);
  for (const m of v?.paymentMilestones ?? []) {
    console.log(`   ${m.status.padEnd(8)} N${Number(m.amount).toLocaleString().padStart(10)}  ${m.name}`);
  }
  console.log("=".repeat(56));
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
