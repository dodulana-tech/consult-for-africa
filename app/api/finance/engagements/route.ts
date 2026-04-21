import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return Response.json({ error: "clientId is required" }, { status: 400 });
  }

  const engagements = await prisma.engagement.findMany({
    where: { clientId },
    select: {
      id: true,
      name: true,
      billingSchedules: {
        where: { isActive: true },
        select: {
          taxRatePct: true,
          whtRatePct: true,
          paymentTermsDays: true,
          currency: true,
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(
    engagements.map((e) => ({
      id: e.id,
      name: e.name,
      billingSchedule: e.billingSchedules[0]
        ? {
            taxRatePct: Number(e.billingSchedules[0].taxRatePct),
            whtRatePct: Number(e.billingSchedules[0].whtRatePct),
            paymentTermsDays: e.billingSchedules[0].paymentTermsDays,
            currency: e.billingSchedules[0].currency,
          }
        : null,
    }))
  );
});
