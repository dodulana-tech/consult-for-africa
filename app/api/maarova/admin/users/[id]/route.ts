import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const user = await prisma.maarovaUser.findUnique({
    where: { id },
    include: {
      organisation: { select: { id: true, name: true } },
      sessions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          totalTimeMinutes: true,
        },
      },
    },
  });

  if (!user) return new Response("User not found", { status: 404 });

  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    title: user.title,
    department: user.department,
    clinicalBackground: user.clinicalBackground,
    yearsInHealthcare: user.yearsInHealthcare,
    isPortalEnabled: user.isPortalEnabled,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    invitedAt: user.invitedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    organisation: user.organisation,
    sessions: user.sessions.map((s) => ({
      ...s,
      startedAt: s.startedAt?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const existing = await prisma.maarovaUser.findUnique({ where: { id } });
  if (!existing) return new Response("User not found", { status: 404 });

  const body = await req.json();
  const { name, email, title, department, clinicalBackground, yearsInHealthcare } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (email !== undefined) {
    const normalised = email.trim().toLowerCase();
    if (normalised !== existing.email) {
      const dup = await prisma.maarovaUser.findUnique({ where: { email: normalised } });
      if (dup) return new Response("A user with this email already exists", { status: 409 });
      data.email = normalised;
    }
  }
  if (title !== undefined) data.title = title.trim() || null;
  if (department !== undefined) data.department = department.trim() || null;
  if (clinicalBackground !== undefined) data.clinicalBackground = clinicalBackground.trim() || null;
  if (yearsInHealthcare !== undefined) {
    data.yearsInHealthcare = yearsInHealthcare ? parseInt(String(yearsInHealthcare), 10) : null;
  }

  if (Object.keys(data).length === 0) {
    return new Response("No fields to update", { status: 400 });
  }

  const updated = await prisma.maarovaUser.update({
    where: { id },
    data,
  });

  return Response.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    updatedAt: updated.updatedAt.toISOString(),
  });
}
