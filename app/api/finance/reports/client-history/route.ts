import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { clientId },
      select: {
        id: true,
        total: true,
        currency: true,
        status: true,
        createdAt: true,
        invoiceNumber: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { invoice: { clientId } },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paymentDate: true,
        paymentMethod: true,
      },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  const history: Array<{
    id: string;
    type: "invoice" | "payment";
    date: string;
    amount: number;
    currency: string;
    label: string;
    status: string;
  }> = [];

  for (const inv of invoices) {
    history.push({
      id: inv.id,
      type: "invoice",
      date: inv.createdAt.toISOString(),
      amount: Number(inv.total),
      currency: inv.currency,
      label: inv.invoiceNumber ?? `Invoice`,
      status: inv.status,
    });
  }

  for (const pay of payments) {
    history.push({
      id: pay.id,
      type: "payment",
      date: (pay.paymentDate ?? new Date()).toISOString(),
      amount: Number(pay.amount),
      currency: pay.currency,
      label: `Payment (${pay.paymentMethod ?? "transfer"})`,
      status: pay.status,
    });
  }

  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stats
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = payments.filter(p => p.status === "CONFIRMED").reduce((s, p) => s + Number(p.amount), 0);

  return Response.json({
    entries: history,
    stats: {
      lifetimeValue: totalInvoiced,
      totalPaid,
      avgDaysToPay: 0, // Would need paid dates to calculate properly
    },
  });
});
