import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk } from "@/lib/office";
import { Prisma } from "@prisma/client";

export const STOCK_SELECT = {
  id: true, name: true, category: true, unit: true, quantityOnHand: true, reorderLevel: true,
  location: true, supplier: true, unitCost: true, currency: true, lastCountedAt: true, notes: true, createdAt: true,
} satisfies Prisma.StockItemSelect;

export function serialiseStock<T extends { unitCost: Prisma.Decimal | null }>(i: T) {
  return { ...i, unitCost: i.unitCost == null ? null : Number(i.unitCost) };
}

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("q");
  const items = await prisma.stockItem.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    select: STOCK_SELECT,
    orderBy: { name: "asc" },
    take: 500,
  });

  const serialised = items.map(serialiseStock);
  // Surfaced as a flag rather than left to the page, because running out is the
  // failure this table exists to prevent.
  const lowStock = serialised.filter((i) => i.quantityOnHand <= i.reorderLevel);

  return Response.json({ items: JSON.parse(JSON.stringify(serialised)), lowStockCount: lowStock.length });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, category, unit, quantityOnHand, reorderLevel, location, supplier, unitCost, currency, notes } = body;
  if (!name?.trim()) return Response.json({ error: "Give it a name." }, { status: 400 });

  const opening = Math.max(0, Math.round(Number(quantityOnHand) || 0));

  const item = await prisma.stockItem.create({
    data: {
      name: name.trim(),
      category: category?.trim() || null,
      unit: unit?.trim() || "unit",
      quantityOnHand: opening,
      reorderLevel: Math.max(0, Math.round(Number(reorderLevel) || 0)),
      location: location?.trim() || null,
      supplier: supplier?.trim() || null,
      unitCost: unitCost != null && unitCost !== "" ? new Prisma.Decimal(unitCost) : null,
      currency: currency?.trim() || "NGN",
      lastCountedAt: opening > 0 ? new Date() : null,
      notes: notes?.trim() || null,
      // The opening count is itself a movement, so the history reconciles from
      // the very first row rather than starting from an unexplained number.
      movements: opening > 0 ? {
        create: { delta: opening, reason: "COUNT_ADJUSTMENT", balanceAfter: opening, note: "Opening count", byUserId: session.user.id },
      } : undefined,
    },
    select: STOCK_SELECT,
  });

  await logAudit({ userId: session.user.id, action: "CREATE", entityType: "StockItem", entityId: item.id, entityName: item.name });
  return Response.json({ item: JSON.parse(JSON.stringify(serialiseStock(item))) }, { status: 201 });
});
