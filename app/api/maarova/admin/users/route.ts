import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { emailMaarovaInvite } from "@/lib/email";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    organisationId,
    name,
    email,
    title,
    department,
    clinicalBackground,
    yearsInHealthcare,
    role,
  } = body;

  if (!organisationId?.trim() || !name?.trim() || !email?.trim()) {
    return Response.json({ error: "organisationId, name, and email are required" }, { status: 400 });
  }

  // Verify organisation exists
  const org = await prisma.maarovaOrganisation.findUnique({
    where: { id: organisationId },
    select: { id: true, name: true, isActive: true },
  });

  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });
  if (!org.isActive) return Response.json({ error: "Organisation is inactive" }, { status: 400 });

  // Check for existing user with same email
  const existing = await prisma.maarovaUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (existing) return Response.json({ error: "A user with this email already exists" }, { status: 409 });

  // Generate secure temporary password
  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.maarovaUser.create({
    data: {
      organisationId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      title: title?.trim() || null,
      department: department?.trim() || null,
      clinicalBackground: clinicalBackground?.trim() || null,
      yearsInHealthcare: yearsInHealthcare ? parseInt(String(yearsInHealthcare), 10) : null,
      role: role && ["USER", "MANAGER", "HR_ADMIN"].includes(role) ? role : "USER",
      isPortalEnabled: true,
      invitedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      department: true,
      isPortalEnabled: true,
      createdAt: true,
    },
  });

  // Send invite email (non-blocking)
  emailMaarovaInvite({
    email: user.email,
    name: user.name,
    organisationName: org.name,
    password: tempPassword,
  }).catch((err) => console.error("[maarova] invite email error:", err));

  return Response.json({
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
  });
});
