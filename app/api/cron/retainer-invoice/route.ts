import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Currency, InvoiceType } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * POST /api/cron/retainer-invoice
 * Auto-generates monthly DRAFT invoices for all recurring billing engagements:
 * RETAINER, SECONDMENT, FRACTIONAL, and TIME_AND_MATERIALS (monthly).
 * Triggered by cron scheduler; protected by CRON_SECRET Bearer token.
 */

const INVOICE_PREFIXES: Record<string, string> = {
  RETAINER: "C4A-RET",
  SECONDMENT: "C4A-SEC",
  FRACTIONAL: "C4A-FRC",
  TIME_AND_MATERIALS: "C4A-TM",
};

const INVOICE_TYPES: Record<string, string> = {
  RETAINER: "RETAINER",
  SECONDMENT: "STANDARD",
  FRACTIONAL: "STANDARD",
  TIME_AND_MATERIALS: "STANDARD",
};

export async function POST(req: NextRequest) {
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
  const monthYearLabel = now.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0); // last day of current month
  const firstOfNextMonth = new Date(year, month + 1, 1);

  let generated = 0;
  let skipped = 0;
  const errors: string[] = [];

  // ── 1. RETAINER engagements ───────────────────────────────────────────────
  const retainers = await prisma.engagement.findMany({
    where: {
      engagementType: "RETAINER",
      status: "ACTIVE",
      retainerMonthlyFee: { gt: 0 },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          paymentTerms: true,
          currency: true,
        },
      },
      billingSchedules: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  for (const eng of retainers) {
    try {
      const result = await generateRecurringInvoice({
        engagement: eng,
        prefix: INVOICE_PREFIXES.RETAINER,
        invoiceType: INVOICE_TYPES.RETAINER,
        monthYearPrefix,
        monthYearLabel,
        firstOfMonth,
        lastOfMonth,
        firstOfNextMonth,
        lineItems: [
          {
            description: `Monthly retainer fee - ${eng.name} - ${monthYearLabel}`,
            quantity: new Decimal(1),
            unitPrice: eng.retainerMonthlyFee!,
            amount: eng.retainerMonthlyFee!,
            category: "consulting_fee",
          },
        ],
        subtotal: eng.retainerMonthlyFee!,
      });
      if (result === "generated") generated++;
      else skipped++;
    } catch (err) {
      const message = `RETAINER ${eng.id} (${eng.name}): ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[retainer-invoice] ${message}`);
      errors.push(message);
    }
  }

  // ── 2. SECONDMENT engagements ─────────────────────────────────────────────
  const secondments = await prisma.engagement.findMany({
    where: {
      engagementType: "SECONDMENT",
      status: "ACTIVE",
      secondeeMonthlyFee: { gt: 0 },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          paymentTerms: true,
          currency: true,
        },
      },
      billingSchedules: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  for (const eng of secondments) {
    try {
      const result = await generateRecurringInvoice({
        engagement: eng,
        prefix: INVOICE_PREFIXES.SECONDMENT,
        invoiceType: INVOICE_TYPES.SECONDMENT,
        monthYearPrefix,
        monthYearLabel,
        firstOfMonth,
        lastOfMonth,
        firstOfNextMonth,
        lineItems: [
          {
            description: `Secondment fee - ${eng.name} - ${monthYearLabel}`,
            quantity: new Decimal(1),
            unitPrice: eng.secondeeMonthlyFee!,
            amount: eng.secondeeMonthlyFee!,
            category: "consulting_fee",
          },
        ],
        subtotal: eng.secondeeMonthlyFee!,
      });
      if (result === "generated") generated++;
      else skipped++;
    } catch (err) {
      const message = `SECONDMENT ${eng.id} (${eng.name}): ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[retainer-invoice] ${message}`);
      errors.push(message);
    }
  }

  // ── 3. FRACTIONAL engagements ─────────────────────────────────────────────
  const fractionals = await prisma.engagement.findMany({
    where: {
      engagementType: "FRACTIONAL",
      status: "ACTIVE",
      fractionalArrangementFee: { gt: 0 },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          paymentTerms: true,
          currency: true,
        },
      },
      billingSchedules: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  for (const eng of fractionals) {
    try {
      const result = await generateRecurringInvoice({
        engagement: eng,
        prefix: INVOICE_PREFIXES.FRACTIONAL,
        invoiceType: INVOICE_TYPES.FRACTIONAL,
        monthYearPrefix,
        monthYearLabel,
        firstOfMonth,
        lastOfMonth,
        firstOfNextMonth,
        lineItems: [
          {
            description: `Fractional arrangement fee - ${eng.name} - ${monthYearLabel}`,
            quantity: new Decimal(1),
            unitPrice: eng.fractionalArrangementFee!,
            amount: eng.fractionalArrangementFee!,
            category: "consulting_fee",
          },
        ],
        subtotal: eng.fractionalArrangementFee!,
      });
      if (result === "generated") generated++;
      else skipped++;
    } catch (err) {
      const message = `FRACTIONAL ${eng.id} (${eng.name}): ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[retainer-invoice] ${message}`);
      errors.push(message);
    }
  }

  // ── 4. TIME_AND_MATERIALS (monthly billing cycle) ─────────────────────────
  const tmSchedules = await prisma.billingSchedule.findMany({
    where: {
      feeStructure: "TIME_AND_MATERIALS",
      billingCycle: "MONTHLY",
      isActive: true,
      engagement: { status: "ACTIVE" },
    },
    include: {
      engagement: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              paymentTerms: true,
              currency: true,
            },
          },
          assignments: {
            include: {
              consultant: {
                select: { id: true, name: true },
              },
              timeEntries: {
                where: {
                  status: "APPROVED",
                  date: {
                    gte: firstOfMonth,
                    lt: firstOfNextMonth,
                  },
                },
              },
            },
          },
          billingSchedules: {
            where: { isActive: true },
            take: 1,
          },
        },
      },
    },
  });

  for (const schedule of tmSchedules) {
    const eng = schedule.engagement;
    try {
      // Check if invoice already exists for this billing period
      const existing = await prisma.invoice.findFirst({
        where: {
          engagementId: eng.id,
          billingPeriodStart: { lte: lastOfMonth },
          billingPeriodEnd: { gte: firstOfMonth },
          invoiceNumber: { startsWith: `${INVOICE_PREFIXES.TIME_AND_MATERIALS}-${monthYearPrefix}` },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Aggregate approved time entries per consultant
      const lineItems: {
        description: string;
        quantity: Decimal;
        unitPrice: Decimal;
        amount: Decimal;
        category: string;
        timeEntryIds: string[];
      }[] = [];
      let subtotal = new Decimal(0);

      for (const assignment of eng.assignments) {
        if (assignment.timeEntries.length === 0) continue;

        const totalHours = assignment.timeEntries.reduce(
          (sum, te) => sum.add(te.hours),
          new Decimal(0)
        );

        const totalBillable = assignment.timeEntries.reduce(
          (sum, te) => sum.add(te.billableAmount ?? new Decimal(0)),
          new Decimal(0)
        );

        if (totalBillable.isZero()) continue;

        lineItems.push({
          description: `${assignment.consultant.name} - ${assignment.role} - ${totalHours.toString()} hours - ${monthYearLabel}`,
          quantity: totalHours,
          unitPrice: assignment.rateAmount,
          amount: totalBillable,
          category: "consulting_fee",
          timeEntryIds: assignment.timeEntries.map((te) => te.id),
        });
        subtotal = subtotal.add(totalBillable);
      }

      if (lineItems.length === 0) {
        skipped++;
        continue;
      }

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(
        INVOICE_PREFIXES.TIME_AND_MATERIALS,
        monthYearPrefix
      );

      // Get tax rates from billing schedule
      const taxRatePct = schedule.taxRatePct ?? new Decimal(0);
      const whtRatePct = schedule.whtRatePct ?? new Decimal(0);
      const tax = subtotal.mul(taxRatePct).div(100);
      const wht = subtotal.mul(whtRatePct).div(100);
      const total = subtotal.add(tax).sub(wht);

      const paymentTermsDays =
        schedule.paymentTermsDays ?? eng.client?.paymentTerms ?? 30;
      const dueDate = new Date(firstOfMonth);
      dueDate.setDate(dueDate.getDate() + paymentTermsDays);
      const currency = (schedule.currency ?? eng.budgetCurrency ?? eng.client?.currency ?? "NGN") as Currency;

      await prisma.invoice.create({
        data: {
          clientId: eng.clientId,
          engagementId: eng.id,
          invoiceNumber,
          invoiceType: "STANDARD",
          lineItems: [], // legacy JSON field
          subtotal,
          tax,
          whtAmount: wht,
          total,
          paidAmount: 0,
          balanceDue: total,
          currency,
          status: "DRAFT",
          issuedDate: firstOfMonth,
          dueDate,
          billingScheduleId: schedule.id,
          billingPeriodStart: firstOfMonth,
          billingPeriodEnd: lastOfMonth,
          lineItemRecords: {
            create: lineItems.map((li, idx) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              amount: li.amount,
              sortOrder: idx,
              category: li.category,
              timeEntryIds: "timeEntryIds" in li ? li.timeEntryIds : [],
            })),
          },
        },
      });

      generated++;
      console.log(
        `[retainer-invoice] Generated ${invoiceNumber} for T&M ${eng.name}`
      );
    } catch (err) {
      const message = `T&M ${eng.id} (${eng.name}): ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[retainer-invoice] ${message}`);
      errors.push(message);
    }
  }

  console.log(
    `[retainer-invoice] Done. Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors.length}`
  );

  return Response.json({
    ok: true,
    generated,
    skipped,
    total: retainers.length + secondments.length + fractionals.length + tmSchedules.length,
    errors,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateInvoiceNumber(
  prefix: string,
  monthYearPrefix: string
): Promise<string> {
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: { startsWith: `${prefix}-${monthYearPrefix}-` },
    },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let sequence = 1;
  if (latestInvoice?.invoiceNumber) {
    const parts = latestInvoice.invoiceNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}-${monthYearPrefix}-${String(sequence).padStart(4, "0")}`;
}

type EngagementWithClient = {
  id: string;
  name: string;
  clientId: string;
  budgetCurrency: string;
  client: {
    id: string;
    name: string;
    email: string;
    paymentTerms: number;
    currency: string;
  } | null;
  billingSchedules: {
    id: string;
    taxRatePct: Decimal;
    whtRatePct: Decimal;
    paymentTermsDays: number;
    currency: string;
  }[];
};

type LineItemInput = {
  description: string;
  quantity: Decimal;
  unitPrice: Decimal;
  amount: Decimal;
  category: string;
};

async function generateRecurringInvoice({
  engagement,
  prefix,
  invoiceType,
  monthYearPrefix,
  monthYearLabel,
  firstOfMonth,
  lastOfMonth,
  firstOfNextMonth,
  lineItems,
  subtotal,
}: {
  engagement: EngagementWithClient;
  prefix: string;
  invoiceType: string;
  monthYearPrefix: string;
  monthYearLabel: string;
  firstOfMonth: Date;
  lastOfMonth: Date;
  firstOfNextMonth: Date;
  lineItems: LineItemInput[];
  subtotal: Decimal;
}): Promise<"generated" | "skipped"> {
  // Check for existing invoice for this billing period
  const existing = await prisma.invoice.findFirst({
    where: {
      engagementId: engagement.id,
      OR: [
        {
          invoiceNumber: { startsWith: `${prefix}-${monthYearPrefix}` },
        },
        {
          billingPeriodStart: { lte: lastOfMonth },
          billingPeriodEnd: { gte: firstOfMonth },
          invoiceNumber: { startsWith: `${prefix}-` },
        },
      ],
    },
  });

  if (existing) {
    return "skipped";
  }

  // Fallback: also check by createdAt range
  const existingByDate = await prisma.invoice.findFirst({
    where: {
      engagementId: engagement.id,
      createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
      invoiceNumber: { startsWith: `${prefix}-` },
    },
  });

  if (existingByDate) {
    return "skipped";
  }

  const invoiceNumber = await generateInvoiceNumber(prefix, monthYearPrefix);

  // Tax/WHT from billing schedule, else defaults
  const schedule = engagement.billingSchedules[0];
  const taxRatePct = schedule?.taxRatePct ?? new Decimal(0);
  const whtRatePct = schedule?.whtRatePct ?? new Decimal(0);
  const tax = subtotal.mul(taxRatePct).div(100);
  const wht = subtotal.mul(whtRatePct).div(100);
  const total = subtotal.add(tax).sub(wht);

  const paymentTermsDays =
    schedule?.paymentTermsDays ?? engagement.client?.paymentTerms ?? 30;
  const dueDate = new Date(firstOfMonth);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

  const currency = (
    schedule?.currency ??
    engagement.budgetCurrency ??
    engagement.client?.currency ??
    "NGN"
  ) as Currency;

  await prisma.invoice.create({
    data: {
      clientId: engagement.clientId,
      engagementId: engagement.id,
      invoiceNumber,
      invoiceType: invoiceType as InvoiceType,
      lineItems: [], // legacy JSON field
      subtotal,
      tax,
      whtAmount: wht,
      total,
      paidAmount: 0,
      balanceDue: total,
      currency,
      status: "DRAFT",
      issuedDate: firstOfMonth,
      dueDate,
      billingScheduleId: schedule?.id,
      billingPeriodStart: firstOfMonth,
      billingPeriodEnd: lastOfMonth,
      lineItemRecords: {
        create: lineItems.map((li, idx) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          amount: li.amount,
          sortOrder: idx,
          category: li.category,
        })),
      },
    },
  });

  console.log(
    `[retainer-invoice] Generated ${invoiceNumber} for ${engagement.name} (${monthYearLabel})`
  );

  return "generated";
}
