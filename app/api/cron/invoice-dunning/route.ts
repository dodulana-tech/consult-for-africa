import { prisma } from "@/lib/prisma";
import { emailInvoiceReminder } from "@/lib/email";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/cron/invoice-dunning
 * Transitions overdue invoices and sends reminder emails on a dunning schedule.
 * Triggered by cron scheduler; protected by CRON_SECRET Bearer token.
 */

const DUNNING_SCHEDULE: {
  daysOverdue: number;
  reminderType: string;
}[] = [
  { daysOverdue: 3, reminderType: "FIRST_REMINDER" },
  { daysOverdue: 7, reminderType: "SECOND_REMINDER" },
  { daysOverdue: 14, reminderType: "FINAL_NOTICE" },
  { daysOverdue: 30, reminderType: "ESCALATION" },
];

export const POST = handler(async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let transitioned = 0;
  let remindersSent = 0;
  const errors: string[] = [];

  // ── Step 1: Transition SENT/VIEWED invoices past dueDate to OVERDUE ─────
  try {
    const overdueResult = await prisma.invoice.updateMany({
      where: {
        status: { in: ["SENT", "VIEWED"] },
        dueDate: { lt: now },
      },
      data: {
        status: "OVERDUE",
      },
    });
    transitioned = overdueResult.count;
    console.log(`[invoice-dunning] Transitioned ${transitioned} invoices to OVERDUE`);
  } catch (err) {
    const message = `Transition step failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[invoice-dunning] ${message}`);
    errors.push(message);
  }

  // ── Step 2: Send dunning reminders for OVERDUE invoices ─────────────────
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "OVERDUE",
      dueDate: { not: null },
    },
    include: {
      client: {
        select: { id: true, name: true, email: true },
      },
      reminders: {
        select: { reminderType: true },
      },
      engagement: {
        select: {
          engagementManagerId: true,
          engagementManager: {
            select: { email: true, name: true },
          },
        },
      },
    },
  });

  for (const invoice of overdueInvoices) {
    if (!invoice.dueDate || !invoice.client) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Find which reminder types have already been sent
    const sentTypes = new Set(invoice.reminders.map((r) => r.reminderType));

    // Determine the appropriate reminder based on dunning schedule
    // Walk through the schedule from highest to lowest, find the first applicable one
    // that has not been sent yet
    let targetReminder: (typeof DUNNING_SCHEDULE)[0] | null = null;
    for (let i = DUNNING_SCHEDULE.length - 1; i >= 0; i--) {
      const step = DUNNING_SCHEDULE[i];
      if (daysOverdue >= step.daysOverdue && !sentTypes.has(step.reminderType)) {
        targetReminder = step;
        break;
      }
    }

    if (!targetReminder) continue;

    try {
      await emailInvoiceReminder({
        clientEmail: invoice.client.email,
        clientName: invoice.client.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.balanceDue),
        currency: invoice.currency,
        daysOverdue,
        reminderType: targetReminder.reminderType,
      });

      await prisma.invoiceReminder.create({
        data: {
          invoiceId: invoice.id,
          reminderType: targetReminder.reminderType,
          recipientEmail: invoice.client.email,
          channel: "EMAIL",
          notes: `Auto-sent at ${daysOverdue} days overdue`,
        },
      });

      remindersSent++;

      console.log(
        `[invoice-dunning] Sent ${targetReminder.reminderType} for ${invoice.invoiceNumber} (${daysOverdue} days overdue)`
      );
    } catch (err) {
      const message = `Reminder for ${invoice.invoiceNumber}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[invoice-dunning] ${message}`);
      errors.push(message);
    }
  }

  console.log(
    `[invoice-dunning] Done. Transitioned: ${transitioned}, Reminders sent: ${remindersSent}`
  );

  return Response.json({
    ok: true,
    transitioned,
    remindersSent,
    errors,
  });
});
