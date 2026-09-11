import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { EM_AND_ABOVE } from "@/lib/constants";

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Margins, revenue and ageing carry commercial detail the office is not
  // granted. This matches the Finance section in the sidebar, which has always
  // been EM and above.
  if (!EM_AND_ABOVE.includes(session.user.role as typeof EM_AND_ABOVE[number])) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const engagements = await prisma.engagement.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    select: {
      id: true,
      name: true,
      budgetAmount: true,
      actualSpent: true,
      client: { select: { name: true } },
      invoices: {
        where: { status: "PAID" },
        select: { total: true },
      },
      assignments: {
        where: { status: "ACTIVE" },
        select: {
          timeEntries: {
            where: { status: "APPROVED" },
            select: { billableAmount: true },
          },
        },
      },
    },
  });

  const margins = engagements.map(e => {
    const revenue = e.invoices.reduce((s, i) => s + Number(i.total), 0);
    const cost = Number(e.actualSpent);
    const margin = revenue - cost;
    const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;

    return {
      engagementId: e.id,
      engagementName: e.name,
      clientName: e.client.name,
      revenue,
      cost,
      margin,
      marginPct,
    };
  }).filter(m => m.revenue > 0 || m.cost > 0).sort((a, b) => b.revenue - a.revenue);

  return Response.json(margins);
});
