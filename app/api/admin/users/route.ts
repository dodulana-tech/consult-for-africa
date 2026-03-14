import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvite } from "@/lib/email";
import type { UserRole } from "@prisma/client";

const VALID_ROLES: UserRole[] = ["CONSULTANT", "ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      consultantProfile: { select: { tier: true, availabilityStatus: true, totalProjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { name, email, role, sendWelcomeEmail } = await req.json();

  if (!name?.trim() || !email?.trim() || !role) {
    return new Response("name, email, and role are required", { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return new Response("Invalid role", { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return new Response("Email already registered", { status: 409 });

  // Cryptographically secure temporary password
  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (role === "CONSULTANT") {
    await prisma.consultantProfile.create({
      data: {
        userId: user.id,
        title: "Consultant",
        bio: "",
        location: "Nigeria",
        yearsExperience: 0,
      },
    });
  }

  if (sendWelcomeEmail !== false) {
    try {
      await sendInvite(email, name, role, tempPassword);
    } catch (err) {
      console.error("Failed to send invite email:", err);
    }
  }

  // Never return the temp password in the response body
  return Response.json({ ok: true, user: { ...user, createdAt: user.createdAt.toISOString() } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { userId, role } = await req.json();
  if (!userId || !role) return new Response("userId and role required", { status: 400 });
  if (!VALID_ROLES.includes(role)) return new Response("Invalid role", { status: 400 });

  if (userId === session.user.id) return new Response("Cannot change your own role", { status: 400 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return Response.json({ ok: true, user: updated });
}
