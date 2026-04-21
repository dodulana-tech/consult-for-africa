import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const VALID_TRANSITIONS: Record<string, { from: string[]; to: string }> = {
  review: { from: ["APPLIED"], to: "UNDER_REVIEW" },
  schedule_interview: { from: ["UNDER_REVIEW"], to: "INTERVIEW_SCHEDULED" },
  approve: { from: ["INTERVIEW_SCHEDULED"], to: "APPROVED" },
  reject: { from: ["APPLIED", "UNDER_REVIEW", "INTERVIEW_SCHEDULED", "APPROVED"], to: "REJECTED" },
};

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const coach = await prisma.maarovaCoach.findUnique({
    where: { id },
    select: { id: true, name: true, vettingStatus: true },
  });

  if (!coach) return Response.json({ error: "Coach not found" }, { status: 404 });

  const body = await req.json();
  const { action, notes, interviewDate, interviewScore } = body;

  const transition = VALID_TRANSITIONS[action];
  if (!transition) {
    return Response.json(
      { error: `Invalid action. Must be one of: ${Object.keys(VALID_TRANSITIONS).join(", ")}` },
      { status: 400 },
    );
  }

  if (!transition.from.includes(coach.vettingStatus)) {
    return Response.json(
      { error: `Cannot ${action} from status ${coach.vettingStatus}` },
      { status: 400 },
    );
  }

  // Validate action-specific requirements
  if (action === "schedule_interview" && !interviewDate) {
    return Response.json({ error: "interviewDate is required to schedule an interview" }, { status: 400 });
  }

  if (action === "approve" && (interviewScore === undefined || interviewScore === null)) {
    return Response.json({ error: "interviewScore is required to approve a coach" }, { status: 400 });
  }

  if (action === "reject" && !notes?.trim()) {
    return Response.json({ error: "notes are required when rejecting a coach" }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    vettingStatus: transition.to,
    reviewedBy: session.user.id,
  };

  if (notes?.trim()) {
    data.vetNotes = notes.trim();
  }

  if (action === "schedule_interview") {
    data.interviewDate = new Date(interviewDate);
  }

  if (action === "approve") {
    data.interviewScore = parseInt(String(interviewScore), 10);
    data.isActive = true;
  }

  const updated = await prisma.maarovaCoach.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      vettingStatus: true,
      interviewDate: true,
      interviewScore: true,
      vetNotes: true,
      reviewedBy: true,
    },
  });

  return Response.json({
    coach: {
      ...updated,
      interviewDate: updated.interviewDate?.toISOString() ?? null,
    },
    message: `Coach ${updated.name} status updated to ${updated.vettingStatus}`,
  });
});
