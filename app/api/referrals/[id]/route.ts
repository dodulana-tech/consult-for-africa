import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { ReferralStatus, ReferralType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvite, emailMaarovaInvite } from "@/lib/email";
import { handler } from "@/lib/api-handler";

const VALID_STATUSES: ReferralStatus[] = ["PENDING", "CONTACTED", "CONVERTED", "REJECTED"];
const VALID_TYPES: ReferralType[] = ["CLIENT", "CONSULTANT", "STAFF"];

export const DELETE = handler(async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const referral = await prisma.referral.findUnique({ where: { id } });
  if (!referral) return Response.json({ error: "Referral not found" }, { status: 404 });

  if (referral.status === "CONVERTED") {
    return Response.json({ error: "Cannot delete a converted referral" }, { status: 400 });
  }

  await prisma.referral.delete({ where: { id } });
  return Response.json({ ok: true });
});

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, assessmentLevel, name, email, phone, organisation, suggestedRole, notes, type } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }
  if (type && !VALID_TYPES.includes(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  const referral = await prisma.referral.findUnique({ where: { id } });
  if (!referral) return Response.json({ error: "Referral not found" }, { status: 404 });

  // When converting a CONSULTANT referral, create platform user and send invite
  if (status === "CONVERTED" && referral.type === "CONSULTANT" && referral.status !== "CONVERTED") {
    const existing = await prisma.user.findUnique({ where: { email: referral.email } });
    if (existing) {
      return Response.json({ error: "A user with this email already exists" }, { status: 409 });
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

    const level = ["LIGHT", "STANDARD", "MAAROVA", "FULL"].includes(assessmentLevel ?? "") ? assessmentLevel : "STANDARD";
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

    // Auto-create Maarova portal credentials for MAAROVA/FULL tiers
    if (level === "MAAROVA" || level === "FULL") {
      try {
        let cfaOrg = await prisma.maarovaOrganisation.findFirst({
          where: { name: "Consult For Africa" },
          select: { id: true, name: true },
        });
        if (!cfaOrg) {
          cfaOrg = await prisma.maarovaOrganisation.create({
            data: {
              name: "Consult For Africa",
              type: "Consulting Firm",
              country: "Nigeria",
              stream: "DEVELOPMENT",
              contactName: "Consult For Africa",
              contactEmail: "hello@consultforafrica.com",
              isActive: true,
            },
            select: { id: true, name: true },
          });
        }

        const existingMaarovaUser = await prisma.maarovaUser.findUnique({
          where: { email: referral.email.trim().toLowerCase() },
        });

        if (!existingMaarovaUser) {
          const maarovaPassword = randomBytes(12).toString("base64url") + "!1A";
          const maarovaPasswordHash = await bcrypt.hash(maarovaPassword, 12);

          await prisma.maarovaUser.create({
            data: {
              organisationId: cfaOrg.id,
              name: referral.name,
              email: referral.email.trim().toLowerCase(),
              passwordHash: maarovaPasswordHash,
              role: "USER",
              isPortalEnabled: true,
              invitedAt: new Date(),
            },
          });

          emailMaarovaInvite({
            email: referral.email,
            name: referral.name,
            organisationName: cfaOrg.name,
            password: maarovaPassword,
          }).catch((err) => console.error("[maarova] invite email error:", err));
        }
      } catch (err) {
        console.error("Failed to create Maarova credentials:", err);
      }
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
      return Response.json({ error: "A user with this email already exists" }, { status: 409 });
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
    data: {
      status,
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.trim().toLowerCase() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(organisation !== undefined && { organisation: organisation?.trim() || null }),
      ...(suggestedRole !== undefined && { suggestedRole: suggestedRole?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(type !== undefined && { type }),
    },
  });

  return Response.json({ ok: true, referral: { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() } });
});
