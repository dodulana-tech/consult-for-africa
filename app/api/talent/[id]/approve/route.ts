import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvite, emailMaarovaInvite } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAuthorized = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!isAuthorized) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const assessmentLevel = body.assessmentLevel ?? "STANDARD";

  if (!["LIGHT", "STANDARD", "MAAROVA", "FULL"].includes(assessmentLevel)) {
    return new Response("assessmentLevel must be LIGHT, STANDARD, MAAROVA, or FULL", { status: 400 });
  }

  // Fetch the application
  const application = await prisma.talentApplication.findUnique({
    where: { id },
  });

  if (!application) {
    return new Response("Application not found", { status: 404 });
  }

  if (application.convertedToUserId) {
    return new Response("Application already converted to a user", { status: 409 });
  }

  // Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: application.email },
  });
  if (existingUser) {
    return new Response("A user with this email already exists", { status: 409 });
  }

  // Generate temp password
  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const fullName = `${application.firstName} ${application.lastName}`;

  // Create User, ConsultantProfile, and ConsultantOnboarding in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: fullName,
        email: application.email,
        role: "CONSULTANT",
        passwordHash,
      },
    });

    await tx.consultantProfile.create({
      data: {
        userId: user.id,
        title: application.currentRole ?? "Consultant",
        bio: "",
        location: application.location,
        yearsExperience: application.yearsExperience,
        expertiseAreas: application.specialty ? [application.specialty] : [],
      },
    });

    await tx.consultantOnboarding.create({
      data: {
        userId: user.id,
        status: "INVITED",
        assessmentLevel,
        applicationId: application.id,
      },
    });

    await tx.talentApplication.update({
      where: { id },
      data: {
        status: "APPROVED",
        convertedToUserId: user.id,
        assessmentLevel,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    return user;
  });

  // Send invite email (outside transaction)
  try {
    await sendInvite(application.email, fullName, "CONSULTANT", tempPassword);
  } catch (err) {
    console.error("Failed to send invite email:", err);
  }

  // Auto-create Maarova portal credentials for MAAROVA/FULL tiers
  if (assessmentLevel === "MAAROVA" || assessmentLevel === "FULL") {
    try {
      // Find or create the CFA internal organisation
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

      // Check if Maarova user already exists
      const existingMaarovaUser = await prisma.maarovaUser.findUnique({
        where: { email: application.email.trim().toLowerCase() },
      });

      if (!existingMaarovaUser) {
        const maarovaPassword = randomBytes(12).toString("base64url") + "!1A";
        const maarovaPasswordHash = await bcrypt.hash(maarovaPassword, 12);

        await prisma.maarovaUser.create({
          data: {
            organisationId: cfaOrg.id,
            name: fullName,
            email: application.email.trim().toLowerCase(),
            passwordHash: maarovaPasswordHash,
            role: "USER",
            isPortalEnabled: true,
            invitedAt: new Date(),
          },
        });

        // Send Maarova invite email with credentials
        emailMaarovaInvite({
          email: application.email,
          name: fullName,
          organisationName: cfaOrg.name,
          password: maarovaPassword,
        }).catch((err) => console.error("[maarova] invite email error:", err));
      }
    } catch (err) {
      console.error("Failed to create Maarova credentials:", err);
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "APPROVE",
    entityType: "TalentApplication",
    entityId: application.id,
    entityName: fullName,
    details: {
      assessmentLevel,
      newUserId: result.id,
      email: application.email,
    },
  });

  return Response.json({
    ok: true,
    user: {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
    },
  }, { status: 201 });
}
