import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

interface Props {
  params: Promise<{ id: string }>;
}

export const POST = handler(async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { adminScore, adminTier, adminNotes, action } = body;

  if (!action || !["approve", "reject"].includes(action)) {
    return Response.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  if (typeof adminScore !== "number" || adminScore < 1 || adminScore > 10) {
    return Response.json({ error: "adminScore must be 1-10" }, { status: 400 });
  }

  const validTiers = ["INTERN", "EMERGING", "STANDARD", "EXPERIENCED", "ELITE", "REJECT"];
  if (!validTiers.includes(adminTier)) {
    return Response.json({ error: "adminTier must be INTERN, EMERGING, STANDARD, EXPERIENCED, ELITE, or REJECT" }, { status: 400 });
  }

  // Verify assessment exists
  const assessment = await prisma.consultantAssessment.findUnique({
    where: { id },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });

  if (!assessment) return Response.json({ error: "Assessment not found" }, { status: 404 });

  // Update assessment with admin review
  await prisma.consultantAssessment.update({
    where: { id },
    data: {
      adminScore,
      adminTier,
      adminNotes: adminNotes ?? null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  // Update onboarding status
  // On approve: move to ACTIVE (assessment review IS the final gate)
  // On reject: move to REJECTED
  const newOnboardingStatus =
    action === "approve" ? "ACTIVE" : "REJECTED";

  await prisma.consultantOnboarding.updateMany({
    where: { userId: assessment.userId },
    data: {
      status: newOnboardingStatus as "ACTIVE" | "REJECTED",
      reviewedById: session.user.id,
      reviewNotes: adminNotes ?? null,
      ...(action === "approve" ? { approvedAt: new Date(), assessmentCompleted: true } : {}),
    },
  });

  // Update ConsultantProfile.tier to match the admin's tier assignment
  if (action === "approve" && adminTier !== "REJECT") {
    await prisma.consultantProfile.updateMany({
      where: { userId: assessment.userId },
      data: { tier: adminTier as "INTERN" | "EMERGING" | "STANDARD" | "EXPERIENCED" | "ELITE" },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: action === "approve" ? "APPROVE" : "REJECT",
    entityType: "ConsultantAssessment",
    entityId: id,
    entityName: assessment.user.name,
    details: {
      adminScore,
      adminTier,
      action,
      candidateUserId: assessment.userId,
    },
  });

  return Response.json({ ok: true, action, adminTier });
});
