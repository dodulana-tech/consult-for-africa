import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const VALID_STREAMS = ["RECRUITMENT", "DEVELOPMENT", "INTELLIGENCE"];

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });

  return Response.json({
    ...org,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  });
});

export const PUT = handler(async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.maarovaOrganisation.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Organisation not found" }, { status: 404 });

  const body = await req.json();
  const {
    name,
    type,
    country,
    city,
    contactName,
    contactEmail,
    contactPhone,
    stream,
    maxAssessments,
    isActive,
    notes,
  } = body;

  if (stream !== undefined && !VALID_STREAMS.includes(stream)) {
    return Response.json({ error: `Invalid stream. Must be one of: ${VALID_STREAMS.join(", ")}` }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (type !== undefined) data.type = type;
  if (country !== undefined) data.country = country.trim() || "Nigeria";
  if (city !== undefined) data.city = city.trim() || null;
  if (contactName !== undefined) data.contactName = contactName.trim();
  if (contactEmail !== undefined) data.contactEmail = contactEmail.trim().toLowerCase();
  if (contactPhone !== undefined) data.contactPhone = contactPhone.trim() || null;
  if (stream !== undefined) data.stream = stream;
  if (maxAssessments !== undefined) data.maxAssessments = parseInt(String(maxAssessments), 10);
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (notes !== undefined) data.notes = notes?.trim() || null;

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.maarovaOrganisation.update({
      where: { id },
      data,
    });

    return Response.json({
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("[maarova-org-update] Error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});
