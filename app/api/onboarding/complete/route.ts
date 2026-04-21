import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;

  const onboarding = await prisma.consultantOnboarding.findUnique({
    where: { userId },
  });

  if (!onboarding) {
    return new Response("No onboarding record found", { status: 404 });
  }

  if (onboarding.status === "ACTIVE" || onboarding.status === "REJECTED") {
    return new Response("Onboarding already completed", { status: 400 });
  }

  if (!onboarding.profileCompleted) {
    return new Response("Profile must be completed first", { status: 400 });
  }

  // For LIGHT assessment, skip straight to ACTIVE
  // For STANDARD/FULL, go to REVIEW for admin approval
  const needsReview = onboarding.assessmentLevel !== "LIGHT";

  const newStatus = needsReview ? "REVIEW" : "ACTIVE";

  await prisma.consultantOnboarding.update({
    where: { userId },
    data: {
      status: newStatus as "REVIEW" | "ACTIVE",
      approvedAt: newStatus === "ACTIVE" ? new Date() : null,
    },
  });

  return Response.json({ ok: true, status: newStatus });
});
