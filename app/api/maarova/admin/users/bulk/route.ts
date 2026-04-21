import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { emailMaarovaInvite } from "@/lib/email";
import { handler } from "@/lib/api-handler";

interface UserRow {
  name: string;
  email: string;
  title?: string;
  department?: string;
  clinicalBackground?: string;
  yearsInHealthcare?: number;
}

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const body = await req.json();
  const { organisationId, users } = body as {
    organisationId: string;
    users: UserRow[];
  };

  if (!organisationId?.trim()) {
    return Response.json({ error: "organisationId is required" }, { status: 400 });
  }
  if (!Array.isArray(users) || users.length === 0) {
    return Response.json({ error: "users array is required" }, { status: 400 });
  }
  if (users.length > 200) {
    return Response.json({ error: "Maximum 200 users per batch" }, { status: 400 });
  }

  const org = await prisma.maarovaOrganisation.findUnique({
    where: { id: organisationId },
    select: { id: true, name: true, isActive: true },
  });

  if (!org) return Response.json({ error: "Organisation not found" }, { status: 404 });
  if (!org.isActive) return Response.json({ error: "Organisation is inactive" }, { status: 400 });

  // Validate all rows first
  const errors: { row: number; error: string }[] = [];
  const normalised: (UserRow & { normEmail: string })[] = [];

  const seenEmails = new Set<string>();

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (!u.name?.trim()) {
      errors.push({ row: i + 1, error: "Name is required" });
      continue;
    }
    if (!u.email?.trim()) {
      errors.push({ row: i + 1, error: "Email is required" });
      continue;
    }
    const normEmail = u.email.trim().toLowerCase();
    if (seenEmails.has(normEmail)) {
      errors.push({ row: i + 1, error: `Duplicate email in upload: ${normEmail}` });
      continue;
    }
    seenEmails.add(normEmail);
    normalised.push({ ...u, normEmail });
  }

  // Check for existing emails in DB
  const existingUsers = await prisma.maarovaUser.findMany({
    where: { email: { in: [...seenEmails] } },
    select: { email: true },
  });
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  for (const u of normalised) {
    if (existingEmails.has(u.normEmail)) {
      errors.push({
        row: users.findIndex((r) => r.email?.trim().toLowerCase() === u.normEmail) + 1,
        error: `Email already exists: ${u.normEmail}`,
      });
    }
  }

  if (errors.length > 0) {
    return Response.json({ errors, created: 0 }, { status: 400 });
  }

  // Create all users
  const created: { name: string; email: string }[] = [];

  for (const u of normalised) {
    const tempPassword = randomBytes(12).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.maarovaUser.create({
      data: {
        organisationId,
        name: u.name.trim(),
        email: u.normEmail,
        passwordHash,
        title: u.title?.trim() || null,
        department: u.department?.trim() || null,
        clinicalBackground: u.clinicalBackground?.trim() || null,
        yearsInHealthcare: u.yearsInHealthcare
          ? parseInt(String(u.yearsInHealthcare), 10)
          : null,
        isPortalEnabled: true,
        invitedAt: new Date(),
      },
    });

    created.push({ name: u.name.trim(), email: u.normEmail });

    // Send invite (non-blocking)
    emailMaarovaInvite({
      email: u.normEmail,
      name: u.name.trim(),
      organisationName: org.name,
      password: tempPassword,
    }).catch((err) =>
      console.error(`[maarova] bulk invite email error for ${u.normEmail}:`, err)
    );
  }

  return Response.json({ created: created.length, users: created });
});
