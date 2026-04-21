import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { emailTalentRejection } from "@/lib/email";
import {
  classifyRejection,
  getSegmentInfo,
  type RejectionSegment,
} from "@/lib/rejectionSegments";
import { handler } from "@/lib/api-handler";

/**
 * GET /api/talent/[id]/reject
 * Preview the rejection segment classification for an application.
 * Returns segment info so the admin can review before confirming.
 */
export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAuthorized = ["PARTNER", "ADMIN", "DIRECTOR", "ENGAGEMENT_MANAGER"].includes(
    session.user.role
  );
  if (!isAuthorized) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const application = await prisma.talentApplication.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      yearsExperience: true,
      aiScoreBreakdown: true,
      aiConcerns: true,
      status: true,
    },
  });

  if (!application) return new Response("Not found", { status: 404 });

  const segment = classifyRejection({
    yearsExperience: application.yearsExperience,
    aiScoreBreakdown: application.aiScoreBreakdown as Record<string, number> | null,
    aiConcerns: application.aiConcerns,
  });

  const info = getSegmentInfo(segment);

  return Response.json({
    applicant: `${application.firstName} ${application.lastName}`,
    email: application.email,
    currentStatus: application.status,
    ...info,
  });
});

/**
 * POST /api/talent/[id]/reject
 * Admin-triggered rejection. Creates ACADEMY_LEARNER account,
 * auto-enrolls in Foundation tracks, sends segmented email.
 *
 * Body: { segment?: RejectionSegment, reviewNotes?: string }
 * segment is optional -- if omitted, auto-classified from AI scores.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAuthorized = ["PARTNER", "ADMIN", "DIRECTOR", "ENGAGEMENT_MANAGER"].includes(
    session.user.role
  );
  if (!isAuthorized) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const overrideSegment = body.segment as RejectionSegment | undefined;
  const reviewNotes = body.reviewNotes as string | undefined;

  const application = await prisma.talentApplication.findUnique({
    where: { id },
  });

  if (!application) return new Response("Not found", { status: 404 });

  if (application.status === "REJECTED") {
    return new Response("Application already rejected", { status: 409 });
  }

  if (application.convertedToUserId) {
    return new Response("Application already converted to a user", { status: 409 });
  }

  // Determine segment
  const segment: RejectionSegment =
    overrideSegment ??
    classifyRejection({
      yearsExperience: application.yearsExperience,
      aiScoreBreakdown: application.aiScoreBreakdown as Record<string, number> | null,
      aiConcerns: application.aiConcerns,
    });

  const info = getSegmentInfo(segment);
  const fullName = `${application.firstName} ${application.lastName}`;

  // Check if user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: application.email },
  });

  let userId: string | null = null;
  let tempPassword: string | null = null;

  // Only create account for non-integrity segments
  if (segment !== "INTEGRITY_FLAGS" && !existingUser) {
    tempPassword = randomBytes(12).toString("base64url") + "!1A";
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Create ACADEMY_LEARNER account
      const user = await tx.user.create({
        data: {
          name: fullName,
          email: application.email,
          role: "ACADEMY_LEARNER",
          passwordHash,
          sourceApplicationId: application.id,
        },
      });

      // Update application
      await tx.talentApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionSegment: segment,
          convertedToUserId: user.id,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          ...(reviewNotes ? { reviewNotes } : {}),
        },
      });

      // Auto-enroll in all Foundation tracks
      const foundationTracks = await tx.trainingTrack.findMany({
        where: { level: "FOUNDATION", isActive: true },
        include: {
          modules: { where: { isActive: true }, orderBy: { order: "asc" } },
        },
      });

      for (const track of foundationTracks) {
        await tx.trainingEnrollment.create({
          data: {
            userId: user.id,
            trackId: track.id,
            status: "IN_PROGRESS",
            startedAt: new Date(),
            moduleProgress: {
              create: track.modules.map((mod, i) => ({
                moduleId: mod.id,
                status: i === 0 ? "AVAILABLE" : "LOCKED",
              })),
            },
          },
        });
      }

      return user;
    });

    userId = result.id;
  } else {
    // Just update the application status (integrity flags or existing user)
    await prisma.talentApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionSegment: segment,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        ...(reviewNotes ? { reviewNotes } : {}),
      },
    });
  }

  // Send rejection email (non-blocking)
  // Skip credential-bearing email if user already existed (they already have an account)
  if (tempPassword || segment === "INTEGRITY_FLAGS") {
    try {
      await emailTalentRejection({
        email: application.email,
        firstName: application.firstName,
        segment,
        tempPassword: tempPassword ?? "",
      });
    } catch (err) {
      console.error("[talent/reject] Failed to send rejection email:", err);
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "REJECT",
    entityType: "TalentApplication",
    entityId: application.id,
    entityName: fullName,
    details: {
      segment,
      segmentLabel: info.label,
      academyAccountCreated: !!userId,
      reapplyEligible: info.reapplyEligible,
    },
  });

  return Response.json({
    ok: true,
    segment,
    segmentInfo: info,
    academyAccountCreated: !!userId,
    email: application.email,
  });
});
