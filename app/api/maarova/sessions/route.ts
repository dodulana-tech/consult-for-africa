import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMaarovaSession } from "@/lib/maarovaAuth";
import { handler } from "@/lib/api-handler";

/**
 * POST /api/maarova/sessions
 * Create a new assessment session for the authenticated Maarova user.
 */
export const POST = handler(async function POST() {
  const auth = await getMaarovaSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user with organisation
  const user = await prisma.maarovaUser.findUnique({
    where: { id: auth.sub },
    include: { organisation: true },
  });

  if (!user || !user.organisation) {
    return NextResponse.json(
      { error: "User or organisation not found" },
      { status: 404 }
    );
  }

  const org = user.organisation;

  // Existing active session takes precedence over any cap check.
  const existingSession = await prisma.maarovaAssessmentSession.findFirst({
    where: {
      userId: user.id,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      expiresAt: { gt: new Date() },
    },
    include: {
      moduleResponses: {
        include: {
          module: true,
        },
        orderBy: { module: { order: "asc" } },
      },
    },
  });

  if (existingSession) {
    return NextResponse.json({ session: existingSession });
  }

  // Cap check is now per-leader-coverage, not per-attempt:
  //   - The org admin (email matches contactEmail) gets unlimited free
  //     assessments since they are the paying contact.
  //   - A user already covered (has at least one COMPLETED session) is
  //     starting a retake; retakes are free.
  //   - A new user only consumes a slot when they finish (incremented in
  //     the session-complete handler), but we still pre-check here so they
  //     do not start a session whose completion would push the org over
  //     the cap.
  const isOrgAdmin = user.email === org.contactEmail;
  const previouslyCompleted = await prisma.maarovaAssessmentSession.count({
    where: { userId: user.id, status: "COMPLETED" },
  });
  const wouldConsumeSlot = !isOrgAdmin && previouslyCompleted === 0;

  if (wouldConsumeSlot && org.usedAssessments >= org.maxAssessments) {
    return NextResponse.json(
      {
        error:
          "Your organisation has covered all paid leader slots. Contact your administrator to add more.",
      },
      { status: 403 }
    );
  }

  // Get active modules -- gate CILTI to users with clinical backgrounds
  const allModules = await prisma.maarovaModule.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const hasClinicalBackground = !!user.clinicalBackground?.trim();
  const modules = allModules.filter(
    (m) => m.type !== "CILTI" || hasClinicalBackground
  );

  if (modules.length === 0) {
    return NextResponse.json(
      { error: "No assessment modules are currently available." },
      { status: 503 }
    );
  }

  // Create the session. The slot counter is NOT incremented here -- a slot
  // is only consumed when the user actually completes their first
  // assessment (handled in module/[slug]/complete). Abandoned and expired
  // sessions cost the org nothing under the new model.
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session = await prisma.maarovaAssessmentSession.create({
    data: {
      userId: user.id,
      status: "NOT_STARTED",
      sessionType: "full",
      stream: org.stream,
      expiresAt,
      moduleResponses: {
        create: modules.map((mod) => ({
          moduleId: mod.id,
          status: "NOT_STARTED",
        })),
      },
    },
    include: {
      moduleResponses: {
        include: {
          module: true,
        },
        orderBy: { module: { order: "asc" } },
      },
    },
  });

  return NextResponse.json({ session });
});
