import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk } from "@/lib/office";
import { STOCK_SELECT, serialiseStock } from "../../route";
import type { StockMovementReason } from "@prisma/client";

const REASONS: StockMovementReason[] = ["RECEIVED", "ISSUED", "COUNT_ADJUSTMENT", "WRITTEN_OFF", "RETURNED"];

/**
 * POST /api/stock/[id]/movement
 *
 * The only way a count changes. Body is either a signed `delta` with a reason,
 * or `countedTo` for a stock take, which records the difference the count found
 * rather than silently overwriting the number.
 *
 * The read and the write are in one transaction because two people issuing from
 * the same shelf at once would otherwise both write the same balance.
 */
export const POST = handler(async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json();
  const note = body.note?.trim() || null;

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.stockItem.findUnique({ where: { id }, select: { id: true, name: true, quantityOnHand: true } });
    if (!item) return { error: "Not found", status: 404 as const };

    let delta: number;
    let reason: StockMovementReason;

    if (body.countedTo != null) {
      const counted = Math.max(0, Math.round(Number(body.countedTo)));
      if (!Number.isFinite(counted)) return { error: "Count must be a number.", status: 400 as const };
      delta = counted - item.quantityOnHand;
      reason = "COUNT_ADJUSTMENT";
    } else {
      delta = Math.round(Number(body.delta));
      if (!Number.isFinite(delta) || delta === 0) return { error: "Say how many, and in which direction.", status: 400 as const };
      reason = REASONS.includes(body.reason) ? body.reason : delta > 0 ? "RECEIVED" : "ISSUED";
    }

    const balanceAfter = item.quantityOnHand + delta;
    if (balanceAfter < 0) {
      return { error: `There are only ${item.quantityOnHand} on the shelf.`, status: 400 as const };
    }

    await tx.stockMovement.create({
      data: { itemId: item.id, delta, reason, balanceAfter, note, byUserId: session.user.id },
    });

    const updated = await tx.stockItem.update({
      where: { id: item.id },
      data: {
        quantityOnHand: balanceAfter,
        lastCountedAt: reason === "COUNT_ADJUSTMENT" ? new Date() : undefined,
      },
      select: STOCK_SELECT,
    });

    return { item: updated, delta, reason };
  });

  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });

  await logAudit({
    userId: session.user.id, action: "UPDATE", entityType: "StockItem",
    entityId: id, entityName: result.item.name, details: { delta: result.delta, reason: result.reason },
  });

  return Response.json({ item: JSON.parse(JSON.stringify(serialiseStock(result.item))) });
});
