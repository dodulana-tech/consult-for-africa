import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
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
      consultantProfile: { select: { tier: true, availabilityStatus: true, totalProjects: true, averageRating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      consultantProfile: u.consultantProfile
        ? {
            ...u.consultantProfile,
            averageRating: u.consultantProfile.averageRating
              ? Number(u.consultantProfile.averageRating)
              : null,
          }
        : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { name, email, role, sendWelcomeEmail, assessmentLevel } = await req.json();

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

    const level = ["LIGHT", "STANDARD", "FULL"].includes(assessmentLevel) ? assessmentLevel : "STANDARD";
    await prisma.consultantOnboarding.create({
      data: {
        userId: user.id,
        status: "INVITED",
        assessmentLevel: level,
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

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    entityName: user.name,
    details: { role: user.role, email: user.email },
  });

  // Never return the temp password in the response body
  return Response.json({ ok: true, user: { ...user, createdAt: user.createdAt.toISOString() } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const body = await req.json();

  // Resend invite flow
  if (body.action === "resend-invite") {
    const { userId } = body;
    if (!userId) return new Response("userId required", { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return new Response("User not found", { status: 404 });

    const tempPassword = randomBytes(12).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    try {
      await sendInvite(user.email, user.name, user.role, tempPassword);
    } catch (err) {
      console.error("Failed to resend invite email:", err);
      return new Response("Failed to send email", { status: 500 });
    }

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      entityName: user.name,
      details: { action: "resend-invite" },
    });

    return Response.json({ ok: true });
  }

  // Role change flow
  const { userId, role } = body;
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

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { userId } = await req.json();
  if (!userId) return new Response("userId required", { status: 400 });

  if (userId === session.user.id) return new Response("Cannot delete yourself", { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!target) return new Response("User not found", { status: 404 });

  // Prevent deleting other partners/admins unless you are ADMIN
  if (["PARTNER", "ADMIN"].includes(target.role) && session.user.role !== "ADMIN") {
    return new Response("Only admins can remove partners or admins", { status: 403 });
  }

  await prisma.user.delete({ where: { id: userId } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "User",
    entityId: target.id,
    entityName: target.name,
    details: { role: target.role, email: target.email },
  });

  return Response.json({ ok: true });
}
