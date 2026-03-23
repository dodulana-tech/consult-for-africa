import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * POST /api/cron/retainer-invoice
 * Auto-generates monthly DRAFT invoices for active retainer engagements.
 * Triggered by cron scheduler; protected by CRON_SECRET Bearer token.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggering
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const monthStr = String(month + 1).padStart(2, "0");
  const monthYearPrefix = `${year}${monthStr}`;
  const monthYearLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  // First day of current month
  const firstOfMonth = new Date(year, month, 1);
  const firstOfNextMonth = new Date(year, month + 1, 1);

  // Find all active retainer engagements with a monthly fee
  const retainers = await prisma.engagement.findMany({
    where: {
      engagementType: "RETAINER",
      status: "ACTIVE",
      retainerMonthlyFee: { gt: 0 },
    },
    include: {
      client: {
        select: { id: true, name: true, email: true, paymentTerms: true, currency: true },
      },
    },
  });

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const retainer of retainers) {
    try {
      // Check if an invoice already exists for this engagement this month
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          engagementId: retainer.id,
          invoiceNumber: { startsWith: `INV-RET-${monthYearPrefix}` },
        },
      });

      if (existingInvoice) {
        skipped++;
        continue;
      }

      // Also check by createdAt as a fallback
      const existingByDate = await prisma.invoice.findFirst({
        where: {
          engagementId: retainer.id,
          createdAt: {
            gte: firstOfMonth,
            lt: firstOfNextMonth,
          },
          invoiceNumber: { startsWith: "INV-RET-" },
        },
      });

      if (existingByDate) {
        skipped++;
        continue;
      }

      // Generate invoice number: INV-RET-YYYYMM-NNNN
      const latestInvoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: { startsWith: `INV-RET-${monthYearPrefix}-` },
        },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });

      let sequence = 1;
      if (latestInvoice?.invoiceNumber) {
        const parts = latestInvoice.invoiceNumber.split("-");
        const lastSeq = parseInt(parts[3], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }

      const invoiceNumber = `INV-RET-${monthYearPrefix}-${String(sequence).padStart(4, "0")}`;

      const monthlyFee = retainer.retainerMonthlyFee!;

      // Calculate due date based on client payment terms
      const paymentTermsDays = retainer.client?.paymentTerms ?? 30;
      const dueDate = new Date(firstOfMonth);
      dueDate.setDate(dueDate.getDate() + paymentTermsDays);

      const currency = retainer.budgetCurrency ?? retainer.client?.currency ?? "NGN";

      await prisma.invoice.create({
        data: {
          clientId: retainer.clientId,
          engagementId: retainer.id,
          invoiceNumber,
          lineItems: [
            {
              description: `Monthly retainer fee - ${retainer.name} - ${monthYearLabel}`,
              quantity: 1,
              unitPrice: Number(monthlyFee),
            },
          ],
          subtotal: monthlyFee,
          tax: 0,
          total: monthlyFee,
          currency,
          status: "DRAFT",
          issuedDate: firstOfMonth,
          dueDate,
        },
      });

      generated++;
      console.log(`[retainer-invoice] Generated ${invoiceNumber} for ${retainer.name}`);
    } catch (err) {
      const message = `Failed for engagement ${retainer.id} (${retainer.name}): ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[retainer-invoice] ${message}`);
      errors.push(message);
    }
  }

  console.log(`[retainer-invoice] Done. Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors.length}`);

  return Response.json({
    ok: true,
    generated,
    skipped,
    total: retainers.length,
    errors,
  });
}
