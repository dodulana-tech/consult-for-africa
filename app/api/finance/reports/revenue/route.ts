import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // Get paid invoices grouped by month
  const invoices = await prisma.invoice.findMany({
    where: { status: "PAID" },
    select: { total: true, paidDate: true, createdAt: true },
  });

  // Also get confirmed payments for more granular data
  const payments = await prisma.payment.findMany({
    where: { status: "CONFIRMED" },
    select: { amount: true, paymentDate: true },
  });

  // Group by month
  const monthMap = new Map<string, number>();

  for (const p of payments) {
    const date = p.paymentDate ?? new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + Number(p.amount));
  }

  // If no payments, use invoice data
  if (payments.length === 0) {
    for (const inv of invoices) {
      const date = inv.paidDate ?? inv.createdAt;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + Number(inv.total));
    }
  }

  // Generate last 12 months
  const months: Array<{ month: string; label: string; amount: number }> = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-NG", { month: "short", year: "numeric" });
    months.push({ month: key, label, amount: monthMap.get(key) ?? 0 });
  }

  // Top clients by revenue
  const clientRevenue = await prisma.invoice.groupBy({
    by: ["clientId"],
    where: { status: "PAID" },
    _sum: { total: true },
    _count: true,
    orderBy: { _sum: { total: "desc" } },
    take: 10,
  });

  const clientIds = clientRevenue.map(c => c.clientId);
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
  });
  const clientNameMap = new Map(clients.map(c => [c.id, c.name]));

  const topClients = clientRevenue.map(c => ({
    clientName: clientNameMap.get(c.clientId) ?? "Unknown",
    revenue: Number(c._sum.total ?? 0),
    invoiceCount: c._count,
  }));

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0);

  return Response.json({ months, topClients, totalRevenue });
}
