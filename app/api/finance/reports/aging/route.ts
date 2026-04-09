import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] } },
    select: {
      id: true,
      total: true,
      balanceDue: true,
      status: true,
      dueDate: true,
      createdAt: true,
      client: { select: { id: true, name: true } },
    },
  });

  const now = new Date();
  const clientMap = new Map<string, {
    clientName: string;
    clientId: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  }>();

  for (const inv of invoices) {
    const balance = Number(inv.balanceDue ?? inv.total);
    if (balance <= 0) continue;

    const dueDate = inv.dueDate ?? inv.createdAt;
    const daysOverdue = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));

    const key = inv.client.id;
    const entry = clientMap.get(key) ?? {
      clientName: inv.client.name,
      clientId: inv.client.id,
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
      total: 0,
    };

    if (daysOverdue <= 0) entry.current += balance;
    else if (daysOverdue <= 30) entry.days1to30 += balance;
    else if (daysOverdue <= 60) entry.days31to60 += balance;
    else if (daysOverdue <= 90) entry.days61to90 += balance;
    else entry.days90plus += balance;

    entry.total += balance;
    clientMap.set(key, entry);
  }

  const buckets = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);

  // Summary totals
  const summary = {
    current: buckets.reduce((s, b) => s + b.current, 0),
    days1to30: buckets.reduce((s, b) => s + b.days1to30, 0),
    days31to60: buckets.reduce((s, b) => s + b.days31to60, 0),
    days61to90: buckets.reduce((s, b) => s + b.days61to90, 0),
    days90plus: buckets.reduce((s, b) => s + b.days90plus, 0),
    total: buckets.reduce((s, b) => s + b.total, 0),
  };

  return Response.json({ buckets, summary });
}
