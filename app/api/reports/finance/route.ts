import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

/* ── GET: financial reports ─────────────────────────────────────────────────── */

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  switch (type) {
    case "ar-aging":
      return arAging();
    case "revenue":
      return revenue(searchParams);
    case "margins":
      return margins();
    case "client-history":
      return clientHistory(searchParams);
    case "track-profitability":
      return trackProfitability(searchParams);
    default:
      return Response.json({ error: "type parameter required: ar-aging, revenue, margins, client-history, track-profitability" }, { status: 400 });
  }
});

/* ── AR Aging: buckets grouped by client ───────────────────────────────────── */

async function arAging() {
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
      balanceDue: { gt: 0 },
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  const now = new Date();
  const buckets: Record<string, {
    clientId: string;
    clientName: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
    invoiceCount: number;
  }> = {};

  for (const inv of outstandingInvoices) {
    const clientId = inv.clientId;
    if (!buckets[clientId]) {
      buckets[clientId] = {
        clientId,
        clientName: inv.client.name,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90plus: 0,
        total: 0,
        invoiceCount: 0,
      };
    }

    const balance = Number(inv.balanceDue);
    const dueDate = inv.dueDate ?? inv.issuedDate ?? inv.createdAt;
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      buckets[clientId].current += balance;
    } else if (daysOverdue <= 30) {
      buckets[clientId].days1to30 += balance;
    } else if (daysOverdue <= 60) {
      buckets[clientId].days31to60 += balance;
    } else if (daysOverdue <= 90) {
      buckets[clientId].days61to90 += balance;
    } else {
      buckets[clientId].days90plus += balance;
    }
    buckets[clientId].total += balance;
    buckets[clientId].invoiceCount++;
  }

  const rows = Object.values(buckets).sort((a, b) => b.total - a.total);

  // Totals row
  const totals = rows.reduce(
    (acc, r) => ({
      current: acc.current + r.current,
      days1to30: acc.days1to30 + r.days1to30,
      days31to60: acc.days31to60 + r.days31to60,
      days61to90: acc.days61to90 + r.days61to90,
      days90plus: acc.days90plus + r.days90plus,
      total: acc.total + r.total,
      invoiceCount: acc.invoiceCount + r.invoiceCount,
    }),
    { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, total: 0, invoiceCount: 0 }
  );

  return Response.json({ rows, totals });
}

/* ── Revenue by period/client/type ─────────────────────────────────────────── */

async function revenue(searchParams: URLSearchParams) {
  const groupBy = searchParams.get("groupBy") ?? "month"; // month, client, serviceType
  const year = parseInt(searchParams.get("year") ?? new Date().getFullYear().toString(), 10);

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["PAID", "PARTIALLY_PAID"] },
      paidDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    include: {
      client: { select: { id: true, name: true } },
      engagement: { select: { id: true, name: true, serviceType: true } },
    },
  });

  // Also include confirmed payments for more accurate revenue
  const confirmedPayments = await prisma.payment.findMany({
    where: {
      status: "CONFIRMED",
      paymentDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    include: {
      invoice: {
        include: {
          client: { select: { id: true, name: true } },
          engagement: { select: { id: true, name: true, serviceType: true } },
        },
      },
    },
  });

  if (groupBy === "month") {
    const monthly: Record<string, number> = {};
    for (let m = 0; m < 12; m++) {
      const key = `${year}-${String(m + 1).padStart(2, "0")}`;
      monthly[key] = 0;
    }
    for (const p of confirmedPayments) {
      const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthly[key] !== undefined) {
        monthly[key] += Number(p.amount);
      }
    }
    return Response.json({
      year,
      groupBy: "month",
      data: Object.entries(monthly).map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 })),
      total: Math.round(Object.values(monthly).reduce((a, b) => a + b, 0) * 100) / 100,
    });
  }

  if (groupBy === "client") {
    const byClient: Record<string, { clientId: string; clientName: string; amount: number }> = {};
    for (const p of confirmedPayments) {
      const cid = p.invoice.clientId;
      if (!byClient[cid]) {
        byClient[cid] = { clientId: cid, clientName: p.invoice.client.name, amount: 0 };
      }
      byClient[cid].amount += Number(p.amount);
    }
    const data = Object.values(byClient)
      .map((r) => ({ ...r, amount: Math.round(r.amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);
    return Response.json({ year, groupBy: "client", data, total: data.reduce((a, b) => a + b.amount, 0) });
  }

  if (groupBy === "serviceType") {
    const byType: Record<string, number> = {};
    for (const p of confirmedPayments) {
      const st = p.invoice.engagement?.serviceType ?? "UNCLASSIFIED";
      byType[st] = (byType[st] ?? 0) + Number(p.amount);
    }
    const data = Object.entries(byType)
      .map(([serviceType, amount]) => ({ serviceType, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);
    return Response.json({ year, groupBy: "serviceType", data, total: data.reduce((a, b) => a + b.amount, 0) });
  }

  return Response.json({ error: "groupBy must be month, client, or serviceType" }, { status: 400 });
}

/* ── Per-engagement margins ────────────────────────────────────────────────── */

async function margins() {
  const engagements = await prisma.engagement.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    select: {
      id: true,
      name: true,
      serviceType: true,
      status: true,
      budgetAmount: true,
      budgetCurrency: true,
      actualSpent: true,
      client: { select: { id: true, name: true } },
    },
  });

  const results = await Promise.all(
    engagements.map(async (eng) => {
      // Revenue collected
      const revenueAgg = await prisma.payment.aggregate({
        where: {
          status: "CONFIRMED",
          invoice: { engagementId: eng.id },
        },
        _sum: { amount: true },
      });

      // Consultant cost (billable amounts from approved/paid time entries)
      const costAgg = await prisma.timeEntry.aggregate({
        where: {
          assignment: { engagementId: eng.id },
          status: { in: ["APPROVED", "PAID"] },
        },
        _sum: { billableAmount: true },
      });

      const revenue = Number(revenueAgg._sum.amount ?? 0);
      const cost = Number(costAgg._sum.billableAmount ?? 0);
      const margin = revenue - cost;
      const marginPct = revenue > 0 ? Math.round((margin / revenue) * 10000) / 100 : 0;

      return {
        engagementId: eng.id,
        engagementName: eng.name,
        clientName: eng.client.name,
        serviceType: eng.serviceType,
        status: eng.status,
        budgetAmount: Number(eng.budgetAmount),
        currency: eng.budgetCurrency,
        revenueCollected: Math.round(revenue * 100) / 100,
        consultantCost: Math.round(cost * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        marginPct,
      };
    })
  );

  return Response.json({
    engagements: results.sort((a, b) => b.revenueCollected - a.revenueCollected),
    summary: {
      totalRevenue: Math.round(results.reduce((a, b) => a + b.revenueCollected, 0) * 100) / 100,
      totalCost: Math.round(results.reduce((a, b) => a + b.consultantCost, 0) * 100) / 100,
      totalMargin: Math.round(results.reduce((a, b) => a + b.margin, 0) * 100) / 100,
      avgMarginPct: results.length > 0
        ? Math.round(results.reduce((a, b) => a + b.marginPct, 0) / results.length * 100) / 100
        : 0,
    },
  });
}

/* ── Client payment history ────────────────────────────────────────────────── */

async function clientHistory(searchParams: URLSearchParams) {
  const clientId = searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId parameter required" }, { status: 400 });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, type: true, status: true },
  });
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  // All invoices for this client
  const invoices = await prisma.invoice.findMany({
    where: { clientId },
    include: {
      payments: { where: { status: "CONFIRMED" }, orderBy: { paymentDate: "asc" } },
      engagement: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute average days to pay
  const daysToPayList: number[] = [];
  for (const inv of invoices) {
    if (inv.status === "PAID" && inv.issuedDate && inv.paidDate) {
      const days = Math.floor(
        (inv.paidDate.getTime() - inv.issuedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      daysToPayList.push(days);
    }
  }
  const avgDaysToPay = daysToPayList.length > 0
    ? Math.round(daysToPayList.reduce((a, b) => a + b, 0) / daysToPayList.length)
    : null;

  // Lifetime value (total paid)
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const currentOutstanding = invoices
    .filter((inv) => ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.balanceDue), 0);

  return Response.json({
    client,
    stats: {
      totalInvoices: invoices.length,
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      currentOutstanding: Math.round(currentOutstanding * 100) / 100,
      avgDaysToPay,
      lifetimeValue: Math.round(totalPaid * 100) / 100,
    },
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      status: inv.status,
      total: Number(inv.total),
      paidAmount: Number(inv.paidAmount),
      balanceDue: Number(inv.balanceDue),
      currency: inv.currency,
      issuedDate: inv.issuedDate?.toISOString() ?? null,
      dueDate: inv.dueDate?.toISOString() ?? null,
      paidDate: inv.paidDate?.toISOString() ?? null,
      engagementName: inv.engagement?.name ?? null,
      paymentCount: inv.payments.length,
    })),
  });
}

/* ── Track profitability per engagement ─────────────────────────────────────── */

async function trackProfitability(searchParams: URLSearchParams) {
  const engagementId = searchParams.get("engagementId");
  if (!engagementId) return Response.json({ error: "engagementId parameter required" }, { status: 400 });

  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    select: { id: true, name: true, budgetCurrency: true },
  });
  if (!engagement) return Response.json({ error: "Engagement not found" }, { status: 404 });

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo);
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  // Get all tracks for this engagement
  const tracks = await prisma.engagementTrack.findMany({
    where: { engagementId },
    select: { id: true, name: true, status: true, budgetAmount: true, budgetCurrency: true },
    orderBy: { order: "asc" },
  });

  // For each track: compute billed (from invoice line items linked to track time entries) and cost
  const trackResults = await Promise.all(
    tracks.map(async (track) => {
      // Cost: approved/paid time entries on this track
      const costAgg = await prisma.timeEntry.aggregate({
        where: {
          trackId: track.id,
          status: { in: ["APPROVED", "PAID"] },
          ...(hasDateFilter ? { date: dateFilter } : {}),
        },
        _sum: { billableAmount: true, hours: true },
      });

      // Billed: invoice line items whose descriptions reference this track
      // We look at invoices for this engagement and match line items containing [TrackName]
      const invoiceLineItems = await prisma.invoiceLineItem.findMany({
        where: {
          invoice: {
            engagementId,
            status: { notIn: ["CANCELLED", "WRITTEN_OFF", "DRAFT"] },
            ...(hasDateFilter && dateFilter.gte ? { issuedDate: { gte: dateFilter.gte } } : {}),
            ...(hasDateFilter && dateTo ? { issuedDate: { lte: new Date(dateTo) } } : {}),
          },
          description: { contains: `[${track.name}]` },
        },
        select: { amount: true },
      });

      const billed = invoiceLineItems.reduce((sum, li) => sum + Number(li.amount), 0);
      const cost = Number(costAgg._sum.billableAmount ?? 0);
      const hours = Number(costAgg._sum.hours ?? 0);
      const margin = billed - cost;
      const marginPct = billed > 0 ? Math.round((margin / billed) * 10000) / 100 : 0;

      return {
        trackId: track.id,
        trackName: track.name,
        trackStatus: track.status,
        budgetAmount: track.budgetAmount ? Number(track.budgetAmount) : null,
        budgetCurrency: track.budgetCurrency,
        totalBilled: Math.round(billed * 100) / 100,
        totalCost: Math.round(cost * 100) / 100,
        totalHours: Math.round(hours * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        marginPct,
      };
    })
  );

  // Also compute untracked (project-level, no track)
  const untrackedCostAgg = await prisma.timeEntry.aggregate({
    where: {
      assignment: { engagementId },
      trackId: null,
      status: { in: ["APPROVED", "PAID"] },
      ...(hasDateFilter ? { date: dateFilter } : {}),
    },
    _sum: { billableAmount: true, hours: true },
  });

  const untrackedLineItems = await prisma.invoiceLineItem.findMany({
    where: {
      invoice: {
        engagementId,
        status: { notIn: ["CANCELLED", "WRITTEN_OFF", "DRAFT"] },
        ...(hasDateFilter && dateFilter.gte ? { issuedDate: { gte: dateFilter.gte } } : {}),
        ...(hasDateFilter && dateTo ? { issuedDate: { lte: new Date(dateTo) } } : {}),
      },
      NOT: tracks.length > 0
        ? { OR: tracks.map((t) => ({ description: { contains: `[${t.name}]` } })) }
        : undefined,
    },
    select: { amount: true },
  });

  const untrackedBilled = untrackedLineItems.reduce((sum, li) => sum + Number(li.amount), 0);
  const untrackedCost = Number(untrackedCostAgg._sum.billableAmount ?? 0);
  const untrackedHours = Number(untrackedCostAgg._sum.hours ?? 0);
  const untrackedMargin = untrackedBilled - untrackedCost;

  const totalBilled = trackResults.reduce((a, b) => a + b.totalBilled, 0) + untrackedBilled;
  const totalCost = trackResults.reduce((a, b) => a + b.totalCost, 0) + untrackedCost;

  return Response.json({
    engagementId: engagement.id,
    engagementName: engagement.name,
    currency: engagement.budgetCurrency,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    tracks: trackResults,
    untracked: {
      totalBilled: Math.round(untrackedBilled * 100) / 100,
      totalCost: Math.round(untrackedCost * 100) / 100,
      totalHours: Math.round(untrackedHours * 100) / 100,
      margin: Math.round(untrackedMargin * 100) / 100,
      marginPct: untrackedBilled > 0 ? Math.round((untrackedMargin / untrackedBilled) * 10000) / 100 : 0,
    },
    summary: {
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalMargin: Math.round((totalBilled - totalCost) * 100) / 100,
      avgMarginPct: totalBilled > 0 ? Math.round(((totalBilled - totalCost) / totalBilled) * 10000) / 100 : 0,
    },
  });
}
