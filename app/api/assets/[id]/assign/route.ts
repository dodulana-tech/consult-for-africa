import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk } from "@/lib/office";
import { ASSET_SELECT, CONDITIONS, serialiseAsset } from "../../route";
import type { AssetCondition } from "@prisma/client";

/**
 * POST /api/assets/[id]/assign
 *
 * Issue the asset to somebody, or take it back.
 *
 * Body: { action: "ISSUE", userId? , holderName?, conditionOut?, note? }
 *       { action: "RETURN", conditionIn?, note? }
 *
 * Both write the custody row and the denormalised holder together, so the
 * register and the chain can never disagree. Condition is recorded at both ends
 * because that is the only way to settle who broke it.
 */
export const POST = handler(async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { id: true, tag: true, name: true, status: true, condition: true },
  });
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const action = body.action;

  if (action === "ISSUE") {
    if (asset.status === "ASSIGNED") {
      return Response.json({ error: "It is already out. Take it back before issuing it again." }, { status: 400 });
    }
    if (["LOST", "RETIRED", "SOLD"].includes(asset.status)) {
      return Response.json({ error: `This asset is marked ${asset.status.toLowerCase()}.` }, { status: 400 });
    }
    const holderName = String(body.holderName ?? "").trim();
    if (!body.userId && !holderName) {
      return Response.json({ error: "Say who is taking it." }, { status: 400 });
    }

    let name = holderName;
    if (body.userId) {
      const user = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true, name: true } });
      if (!user) return Response.json({ error: "That person was not found." }, { status: 404 });
      name = user.name;
    }

    const conditionOut: AssetCondition = CONDITIONS.includes(body.conditionOut) ? body.conditionOut : asset.condition;

    const [, updated] = await prisma.$transaction([
      prisma.assetAssignment.create({
        data: {
          assetId: asset.id,
          userId: body.userId || null,
          holderName: body.userId ? null : holderName,
          conditionOut,
          issuedById: session.user.id,
          note: body.note?.trim() || null,
        },
      }),
      prisma.asset.update({
        where: { id: asset.id },
        data: {
          status: "ASSIGNED",
          condition: conditionOut,
          assignedToUserId: body.userId || null,
          assignedToName: name,
          assignedAt: new Date(),
        },
        select: ASSET_SELECT,
      }),
    ]);

    await logAudit({
      userId: session.user.id, action: "ASSIGN", entityType: "Asset",
      entityId: asset.id, entityName: `${asset.tag} ${asset.name}`, details: { to: name },
    });
    return Response.json({ asset: serialiseAsset(updated) });
  }

  if (action === "RETURN") {
    const open = await prisma.assetAssignment.findFirst({
      where: { assetId: asset.id, returnedAt: null },
      orderBy: { issuedAt: "desc" },
      select: { id: true },
    });
    if (!open) return Response.json({ error: "Nobody has it out." }, { status: 400 });

    const conditionIn: AssetCondition = CONDITIONS.includes(body.conditionIn) ? body.conditionIn : asset.condition;
    // Something back in pieces goes to repair rather than straight back on the
    // shelf, so it cannot be issued to the next person unnoticed.
    const nextStatus = ["POOR", "BEYOND_REPAIR"].includes(conditionIn) ? "IN_REPAIR" : "IN_STOCK";

    const [, updated] = await prisma.$transaction([
      prisma.assetAssignment.update({
        where: { id: open.id },
        data: { returnedAt: new Date(), conditionIn, note: body.note?.trim() || undefined },
      }),
      prisma.asset.update({
        where: { id: asset.id },
        data: {
          status: nextStatus,
          condition: conditionIn,
          assignedToUserId: null,
          assignedToName: null,
          assignedAt: null,
        },
        select: ASSET_SELECT,
      }),
    ]);

    await logAudit({
      userId: session.user.id, action: "UPDATE", entityType: "Asset",
      entityId: asset.id, entityName: `${asset.tag} ${asset.name}`, details: { returned: true, conditionIn },
    });
    return Response.json({ asset: serialiseAsset(updated) });
  }

  return Response.json({ error: "action must be ISSUE or RETURN" }, { status: 400 });
});
