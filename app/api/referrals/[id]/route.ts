import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { ReferralStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvite } from "@/lib/email";

const VALID_STATUSES: ReferralStatus[] = ["PENDING", "CONTACTED", "CONVERTED", "REJECTED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const { status, assessmentLevel } = await req.json();

  if (!status || !VALID_STATUSES.includes(status)) {
    return new Response("Invalid status", { status: 400 });
  }

  const referral = await prisma.referral.findUnique({ where: { id } });
  if (!referral) return new Response("Referral not found", { status: 404 });

  // When converting a CONSULTANT referral, create platform user and send invite
  if (status === "CONVERTED" && referral.type === "CONSULTANT" && referral.status !== "CONVERTED") {
    const existing = await prisma.user.findUnique({ where: { email: referral.email } });
    if (existing) {
      return new Response("A user with this email already exists", { status: 409 });
    }

    const tempPassword = randomBytes(12).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        name: referral.name,
        email: referral.email,
        role: "CONSULTANT",
        passwordHash,
      },
    });

    await prisma.consultantProfile.create({
      data: {
        userId: user.id,
        title: referral.suggestedRole || "Consultant",
        bio: "",
        location: "Nigeria",
        yearsExperience: 0,
      },
    });

    const level = ["LIGHT", "STANDARD", "FULL"].includes(assessmentLevel ?? "") ? assessmentLevel : "STANDARD";
    await prisma.consultantOnboarding.create({
      data: {
        userId: user.id,
        status: "INVITED",
        assessmentLevel: level,
      },
    });

    try {
      await sendInvite(referral.email, referral.name, "CONSULTANT", tempPassword);
    } catch (err) {
      console.error("Failed to send referral invite:", err);
    }
  }

  // When converting a CLIENT referral, create client record
  if (status === "CONVERTED" && referral.type === "CLIENT" && referral.status !== "CONVERTED") {
    const existingClient = await prisma.client.findFirst({ where: { email: referral.email } });
    if (!existingClient) {
      await prisma.client.create({
        data: {
          name: referral.organisation || referral.name,
          type: "PRIVATE_ELITE",
          primaryContact: referral.name,
          email: referral.email,
          phone: referral.phone || "",
          address: "",
          notes: referral.notes ? `Referred by staff. Notes: ${referral.notes}` : "Created from referral conversion.",
        },
      });
    }
  }

  // When converting a STAFF referral, create platform user with appropriate role
  if (status === "CONVERTED" && referral.type === "STAFF" && referral.status !== "CONVERTED") {
    const existingUser = await prisma.user.findUnique({ where: { email: referral.email } });
    if (existingUser) {
      return new Response("A user with this email already exists", { status: 409 });
    }

    const tempPassword = randomBytes(12).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const staffRole = referral.suggestedRole?.toUpperCase().includes("DIRECTOR") ? "DIRECTOR"
      : referral.suggestedRole?.toUpperCase().includes("PARTNER") ? "PARTNER"
      : "ENGAGEMENT_MANAGER";

    await prisma.user.create({
      data: {
        name: referral.name,
        email: referral.email,
        role: staffRole as "ENGAGEMENT_MANAGER" | "DIRECTOR" | "PARTNER",
        passwordHash,
      },
    });

    try {
      await sendInvite(referral.email, referral.name, staffRole, tempPassword);
    } catch (err) {
      console.error("Failed to send staff referral invite:", err);
    }
  }

  const updated = await prisma.referral.update({
    where: { id },
    data: { status },
  });

  return Response.json({ ok: true, referral: { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() } });
}
