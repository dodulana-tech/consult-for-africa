import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk } from "@/lib/office";
import { ASSET_SELECT, CATEGORIES, CONDITIONS, STATUSES, serialiseAsset } from "../route";
import { Prisma } from "@prisma/client";
import type { AssetCategory, AssetCondition, AssetStatus } from "@prisma/client";

export const GET = handler(async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    select: {
      ...ASSET_SELECT,
      assignments: {
        orderBy: { issuedAt: "desc" },
        select: {
          id: true, issuedAt: true, returnedAt: true, conditionOut: true, conditionIn: true, holderName: true, note: true,
          user: { select: { id: true, name: true } },
          issuedBy: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ asset: JSON.parse(JSON.stringify(serialiseAsset(asset))) });
});

export const PATCH = handler(async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const existing = await prisma.asset.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Prisma.AssetUpdateInput = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (CATEGORIES.includes(body.category as AssetCategory)) data.category = body.category;
  if (CONDITIONS.includes(body.condition as AssetCondition)) data.condition = body.condition;
  if (STATUSES.includes(body.status as AssetStatus)) {
    // Handing something out is the assign endpoint, not a status write, or the
    // custody chain quietly stops matching the register.
    if (body.status === "ASSIGNED" && existing.status !== "ASSIGNED") {
      return Response.json({ error: "Issue it to somebody rather than setting the status." }, { status: 400 });
    }
    data.status = body.status;
  }
  if ("make" in body) data.make = body.make?.trim() || null;
  if ("model" in body) data.model = body.model?.trim() || null;
  if ("serialNumber" in body) data.serialNumber = body.serialNumber?.trim() || null;
  if ("location" in body) data.location = body.location?.trim() || null;
  if ("supplier" in body) data.supplier = body.supplier?.trim() || null;
  if ("notes" in body) data.notes = body.notes?.trim() || null;
  if ("purchaseDate" in body) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
  if ("warrantyExpiresAt" in body) data.warrantyExpiresAt = body.warrantyExpiresAt ? new Date(body.warrantyExpiresAt) : null;
  if ("purchasePrice" in body) {
    data.purchasePrice = body.purchasePrice != null && body.purchasePrice !== "" ? new Prisma.Decimal(body.purchasePrice) : null;
  }

  if (!Object.keys(data).length) return Response.json({ error: "Nothing to update." }, { status: 400 });

  const asset = await prisma.asset.update({ where: { id }, data, select: ASSET_SELECT });
  await logAudit({
    userId: session.user.id, action: "UPDATE", entityType: "Asset",
    entityId: asset.id, entityName: `${asset.tag} ${asset.name}`, details: { fields: Object.keys(data) },
  });
  return Response.json({ asset: serialiseAsset(asset) });
});
