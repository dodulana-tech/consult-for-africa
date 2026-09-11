import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk } from "@/lib/office";
import { Prisma } from "@prisma/client";
import type { AssetCategory, AssetCondition, AssetStatus } from "@prisma/client";

const PERSON = { select: { id: true, name: true, email: true } };

export const ASSET_SELECT = {
  id: true, tag: true, name: true, category: true, make: true, model: true, serialNumber: true,
  purchaseDate: true, purchasePrice: true, currency: true, supplier: true, warrantyExpiresAt: true,
  condition: true, status: true, location: true, assignedToName: true, assignedAt: true, notes: true,
  createdAt: true,
  assignedToUser: PERSON,
} satisfies Prisma.AssetSelect;

export const CATEGORIES: AssetCategory[] = [
  "LAPTOP", "PHONE", "MONITOR", "PERIPHERAL", "FURNITURE", "VEHICLE", "EQUIPMENT", "SOFTWARE_LICENCE", "OTHER",
];
export const CONDITIONS: AssetCondition[] = ["NEW", "GOOD", "FAIR", "POOR", "BEYOND_REPAIR"];
export const STATUSES: AssetStatus[] = ["IN_STOCK", "ASSIGNED", "IN_REPAIR", "LOST", "RETIRED", "SOLD"];

/** Decimal does not survive JSON, so money becomes a number at the boundary. */
export function serialiseAsset<T extends { purchasePrice: Prisma.Decimal | null }>(a: T) {
  return { ...a, purchasePrice: a.purchasePrice == null ? null : Number(a.purchasePrice) };
}

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("q");

  const where: Prisma.AssetWhereInput = {};
  if (status && STATUSES.includes(status as AssetStatus)) where.status = status as AssetStatus;
  if (category && CATEGORIES.includes(category as AssetCategory)) where.category = category as AssetCategory;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { tag: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { assignedToName: { contains: search, mode: "insensitive" } },
    ];
  }

  const assets = await prisma.asset.findMany({
    where, select: ASSET_SELECT, orderBy: [{ status: "asc" }, { name: "asc" }], take: 500,
  });

  return Response.json({ assets: assets.map(serialiseAsset) });
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { tag, name, category, make, model, serialNumber, purchaseDate, purchasePrice, currency, supplier, warrantyExpiresAt, condition, location, notes } = body;

  if (!tag?.trim()) return Response.json({ error: "Give it an asset tag. It is what a stock take matches against." }, { status: 400 });
  if (!name?.trim()) return Response.json({ error: "Give it a name." }, { status: 400 });
  if (!CATEGORIES.includes(category)) return Response.json({ error: "Pick a category." }, { status: 400 });

  const existing = await prisma.asset.findUnique({ where: { tag: tag.trim() }, select: { id: true } });
  if (existing) return Response.json({ error: `Tag ${tag.trim()} is already on the register.` }, { status: 409 });

  const asset = await prisma.asset.create({
    data: {
      tag: tag.trim(),
      name: name.trim(),
      category,
      make: make?.trim() || null,
      model: model?.trim() || null,
      serialNumber: serialNumber?.trim() || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: purchasePrice != null && purchasePrice !== "" ? new Prisma.Decimal(purchasePrice) : null,
      currency: currency?.trim() || "NGN",
      supplier: supplier?.trim() || null,
      warrantyExpiresAt: warrantyExpiresAt ? new Date(warrantyExpiresAt) : null,
      condition: CONDITIONS.includes(condition) ? condition : "GOOD",
      location: location?.trim() || null,
      notes: notes?.trim() || null,
    },
    select: ASSET_SELECT,
  });

  await logAudit({
    userId: session.user.id, action: "CREATE", entityType: "Asset",
    entityId: asset.id, entityName: `${asset.tag} ${asset.name}`,
  });

  return Response.json({ asset: serialiseAsset(asset) }, { status: 201 });
});
