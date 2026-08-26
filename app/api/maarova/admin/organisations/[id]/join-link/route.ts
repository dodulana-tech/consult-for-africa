import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { handler } from "@/lib/api-handler";

/**
 * Manage an organisation's shared staff join link.
 *
 * POST   - open the link (creating a token if there is none, or rotating it
 *          when { rotate: true } is passed, which kills the old URL)
 * DELETE - close the link; the token is kept so it can be reopened
 */

const BASE_URL = process.env.NEXTAUTH_URL ?? "";

function joinUrl(token: string) {
  return `${BASE_URL}/maarova/join/${token}`;
}

async function requireAdmin() {
  const session = await auth();
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!["PARTNER", "ADMIN"].includes(session.user.role)) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { error: null };
}

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rotate = body?.rotate === true;
  const expiresInDays = body?.expiresInDays ? parseInt(String(body.expiresInDays), 10) : null;

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { id },
    select: { id: true, joinToken: true, isActive: true },
  });
  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });
  if (!org.isActive) return Response.json({ error: "Organisation is inactive" }, { status: 400 });

  const token = rotate || !org.joinToken ? randomBytes(24).toString("base64url") : org.joinToken;

  let joinExpiresAt: Date | null = null;
  if (expiresInDays && expiresInDays > 0) {
    joinExpiresAt = new Date();
    joinExpiresAt.setDate(joinExpiresAt.getDate() + expiresInDays);
  }

  const updated = await prisma.maarovaOrganisation.update({
    where: { id },
    data: {
      joinToken: token,
      joinEnabled: true,
      ...(expiresInDays !== null ? { joinExpiresAt } : {}),
    },
    select: { joinToken: true, joinEnabled: true, joinExpiresAt: true },
  });

  return Response.json({
    joinUrl: joinUrl(updated.joinToken!),
    joinEnabled: updated.joinEnabled,
    joinExpiresAt: updated.joinExpiresAt?.toISOString() ?? null,
    rotated: rotate,
  });
});

export const DELETE = handler(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });

  await prisma.maarovaOrganisation.update({
    where: { id },
    data: { joinEnabled: false },
  });

  return Response.json({ joinEnabled: false });
});
