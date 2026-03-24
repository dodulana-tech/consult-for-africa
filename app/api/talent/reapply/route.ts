import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * GET /api/talent/reapply
 * Check reapplication eligibility for ACADEMY_LEARNER users.
 * Requires: at least 1 Foundation track CERTIFIED + 1 Specialist track CERTIFIED.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  if (session.user.role !== "ACADEMY_LEARNER") {
    return Response.json({ error: "Only Academy Learners can reapply" }, { status: 403 });
  }

  // Find the user's source application
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sourceApplicationId: true },
  });

  if (!user?.sourceApplicationId) {
    return Response.json({ eligible: false, reason: "No previous application found" });
  }

  // Check if original application was integrity-flagged (permanently ineligible)
  const originalApp = await prisma.talentApplication.findUnique({
    where: { id: user.sourceApplicationId },
    select: { rejectionSegment: true },
  });

  if (originalApp?.rejectionSegment === "INTEGRITY_FLAGS") {
    return Response.json({
      eligible: false,
      reason: "Your application is not eligible for reapplication.",
      foundationComplete: 0,
      specialistComplete: 0,
      requiredFoundation: 1,
      requiredSpecialist: 1,
      completedTracks: [],
    });
  }

  // Check completed enrollments by level
  const enrollments = await prisma.trainingEnrollment.findMany({
    where: {
      userId: session.user.id,
      status: "CERTIFIED",
    },
    include: {
      track: { select: { level: true, name: true } },
    },
  });

  const foundationComplete = enrollments.filter((e) => e.track.level === "FOUNDATION");
  const specialistComplete = enrollments.filter((e) => e.track.level === "SPECIALIST");

  const eligible = foundationComplete.length >= 1 && specialistComplete.length >= 1;

  return Response.json({
    eligible,
    foundationComplete: foundationComplete.length,
    specialistComplete: specialistComplete.length,
    requiredFoundation: 1,
    requiredSpecialist: 1,
    completedTracks: enrollments.map((e) => ({
      name: e.track.name,
      level: e.track.level,
      certifiedAt: e.certifiedAt,
    })),
  });
}

/**
 * POST /api/talent/reapply
 * Submit a reapplication. Only allowed if eligibility requirements are met.
 * Body: { coverLetter?, cvText? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  if (session.user.role !== "ACADEMY_LEARNER") {
    return Response.json({ error: "Only Academy Learners can reapply" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sourceApplicationId: true, name: true, email: true },
  });

  if (!user?.sourceApplicationId) {
    return Response.json({ error: "No previous application found" }, { status: 400 });
  }

  // Block integrity-flagged applicants permanently
  const sourceApp = await prisma.talentApplication.findUnique({
    where: { id: user.sourceApplicationId },
    select: { rejectionSegment: true },
  });

  if (sourceApp?.rejectionSegment === "INTEGRITY_FLAGS") {
    return Response.json({ error: "Your application is not eligible for reapplication." }, { status: 403 });
  }

  // Verify eligibility
  const certifiedCount = await prisma.trainingEnrollment.groupBy({
    by: ["trackId"],
    where: {
      userId: session.user.id,
      status: "CERTIFIED",
    },
  });

  const certifiedTracks = await prisma.trainingTrack.findMany({
    where: { id: { in: certifiedCount.map((c) => c.trackId) } },
    select: { level: true },
  });

  const foundationCount = certifiedTracks.filter((t) => t.level === "FOUNDATION").length;
  const specialistCount = certifiedTracks.filter((t) => t.level === "SPECIALIST").length;

  if (foundationCount < 1 || specialistCount < 1) {
    return Response.json(
      {
        error: "Not yet eligible. Complete at least 1 Foundation and 1 Specialist track.",
        foundationComplete: foundationCount,
        specialistComplete: specialistCount,
      },
      { status: 400 }
    );
  }

  // Get original application data
  const originalApp = await prisma.talentApplication.findUnique({
    where: { id: user.sourceApplicationId },
  });

  if (!originalApp) {
    return Response.json({ error: "Original application not found" }, { status: 400 });
  }

  // Check for existing pending reapplication
  const existingReapply = await prisma.talentApplication.findFirst({
    where: {
      email: user.email,
      previousApplicationId: originalApp.id,
      status: { notIn: ["REJECTED", "WITHDRAWN"] },
    },
  });

  if (existingReapply) {
    return Response.json(
      { error: "You already have a pending reapplication" },
      { status: 409 }
    );
  }

  const body = await req.json();

  // Create new application linked to original
  const newApp = await prisma.talentApplication.create({
    data: {
      firstName: originalApp.firstName,
      lastName: originalApp.lastName,
      email: originalApp.email,
      phone: originalApp.phone,
      linkedinUrl: originalApp.linkedinUrl,
      location: originalApp.location,
      specialty: originalApp.specialty,
      yearsExperience: originalApp.yearsExperience,
      currentRole: originalApp.currentRole,
      currentOrg: originalApp.currentOrg,
      workAuthorization: originalApp.workAuthorization,
      track: originalApp.track,
      cvText: body.cvText ?? originalApp.cvText,
      coverLetter: body.coverLetter ?? originalApp.coverLetter,
      engagementTypes: originalApp.engagementTypes,
      previousApplicationId: originalApp.id,
      status: "SUBMITTED",
    },
  });

  return Response.json(
    {
      ok: true,
      applicationId: newApp.id,
      message: "Reapplication submitted. Our team will review it shortly.",
    },
    { status: 201 }
  );
}
