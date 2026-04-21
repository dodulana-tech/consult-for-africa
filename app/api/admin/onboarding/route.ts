import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const body = await req.json();
  const { id, action, reason } = body;

  if (!id || !action) {
    return new Response("id and action are required", { status: 400 });
  }

  const onboarding = await prisma.consultantOnboarding.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!onboarding) {
    return new Response("Onboarding record not found", { status: 404 });
  }

  if (action === "approve") {
    if (!["REVIEW", "ASSESSMENT_COMPLETE", "PROFILE_SETUP"].includes(onboarding.status)) {
      return new Response("Cannot approve consultant in current status", { status: 400 });
    }

    await prisma.consultantOnboarding.update({
      where: { id },
      data: {
        status: "ACTIVE",
        reviewedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "APPROVE",
      entityType: "ConsultantOnboarding",
      entityId: id,
      entityName: onboarding.user.name,
      details: { consultantUserId: onboarding.userId },
    });

    return Response.json({ ok: true });
  }

  if (action === "reject") {
    if (!["REVIEW", "ASSESSMENT_COMPLETE", "PROFILE_SETUP", "ASSESSMENT_PENDING", "INVITED"].includes(onboarding.status)) {
      return new Response("Cannot reject consultant in current status", { status: 400 });
    }

    await prisma.consultantOnboarding.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewNotes: reason ?? null,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "REJECT",
      entityType: "ConsultantOnboarding",
      entityId: id,
      entityName: onboarding.user.name,
      details: { consultantUserId: onboarding.userId, reason },
    });

    return Response.json({ ok: true });
  }

  if (action === "change-level") {
    const { assessmentLevel } = body;
    if (!["LIGHT", "STANDARD", "MAAROVA", "FULL"].includes(assessmentLevel)) {
      return new Response("assessmentLevel must be LIGHT, STANDARD, MAAROVA, or FULL", { status: 400 });
    }

    if (["ACTIVE", "REJECTED"].includes(onboarding.status)) {
      return new Response("Cannot change assessment level after onboarding is finalized", { status: 400 });
    }

    await prisma.consultantOnboarding.update({
      where: { id },
      data: { assessmentLevel },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "ConsultantOnboarding",
      entityId: id,
      entityName: onboarding.user.name,
      details: { assessmentLevel, previous: onboarding.assessmentLevel },
    });

    return Response.json({ ok: true });
  }

  return new Response("Invalid action. Use 'approve', 'reject', or 'change-level'", { status: 400 });
});
