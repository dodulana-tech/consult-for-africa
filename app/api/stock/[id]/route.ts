import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { canUseOfficeDesk } from "@/lib/office";
import { STOCK_SELECT, serialiseStock } from "../route";
import { Prisma } from "@prisma/client";

export const GET = handler(async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const item = await prisma.stockItem.findUnique({
    where: { id },
    select: {
      ...STOCK_SELECT,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, delta: true, reason: true, balanceAfter: true, note: true, createdAt: true, by: { select: { id: true, name: true } } },
      },
    },
  });
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ item: JSON.parse(JSON.stringify(serialiseStock(item))) });
});

/** Everything except the count, which only moves through /movement. */
export const PATCH = handler(async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json();
  const data: Prisma.StockItemUpdateInput = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if ("category" in body) data.category = body.category?.trim() || null;
  if (typeof body.unit === "string" && body.unit.trim()) data.unit = body.unit.trim();
  if ("reorderLevel" in body) data.reorderLevel = Math.max(0, Math.round(Number(body.reorderLevel) || 0));
  if ("location" in body) data.location = body.location?.trim() || null;
  if ("supplier" in body) data.supplier = body.supplier?.trim() || null;
  if ("notes" in body) data.notes = body.notes?.trim() || null;
  if ("unitCost" in body) {
    data.unitCost = body.unitCost != null && body.unitCost !== "" ? new Prisma.Decimal(body.unitCost) : null;
  }
  if ("quantityOnHand" in body) {
    return Response.json({ error: "Counts move through a stock movement, so the history stays defensible." }, { status: 400 });
  }

  if (!Object.keys(data).length) return Response.json({ error: "Nothing to update." }, { status: 400 });

  const item = await prisma.stockItem.update({ where: { id }, data, select: STOCK_SELECT });
  return Response.json({ item: JSON.parse(JSON.stringify(serialiseStock(item))) });
});
