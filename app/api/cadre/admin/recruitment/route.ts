import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleRecruitmentStageChange } from "@/lib/cadreHealth/recruitmentPipeline";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

export const PATCH = handler(async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string }).role;
  if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { professionalId, recruitmentStage, interviewDate, recruitmentNotes } =
    await req.json();

  if (!professionalId) {
    return NextResponse.json(
      { error: "professionalId is required" },
      { status: 400 }
    );
  }

  // Validate: INTERVIEW_SCHEDULED requires an interview date
  if (recruitmentStage === "INTERVIEW_SCHEDULED" && !interviewDate) {
    return NextResponse.json(
      { error: "Interview date is required when scheduling an interview" },
      { status: 400 }
    );
  }

  // Fetch current state before update
  const current = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    select: { recruitmentStage: true, email: true, firstName: true },
  });

  if (!current) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const updated = await prisma.cadreProfessional.update({
    where: { id: professionalId },
    data: {
      recruitmentStage: recruitmentStage || null,
      interviewDate: interviewDate ? new Date(interviewDate) : null,
      recruitmentNotes: recruitmentNotes || null,
    },
    select: {
      id: true,
      recruitmentStage: true,
      interviewDate: true,
    },
  });

  // Fire automated events on stage change
  const automation = await handleRecruitmentStageChange({
    professionalId,
    previousStage: current.recruitmentStage,
    newStage: recruitmentStage || null,
    interviewDate: interviewDate ? new Date(interviewDate) : null,
    professional: { firstName: current.firstName, email: current.email },
  });

  return NextResponse.json({ success: true, data: updated, automation });
});
