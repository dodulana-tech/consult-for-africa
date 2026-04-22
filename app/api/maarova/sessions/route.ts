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

  // Check available assessment slots
  const org = user.organisation;
  if (org.usedAssessments >= org.maxAssessments) {
    return NextResponse.json(
      { error: "No remaining assessment slots for your organisation. Contact your administrator." },
      { status: 403 }
    );
  }

  // Check for existing active (non-expired, non-completed) session
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

  // Create session and increment slot atomically to prevent race conditions
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [session] = await prisma.$transaction([
    prisma.maarovaAssessmentSession.create({
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
    }),
    prisma.maarovaOrganisation.update({
      where: { id: org.id },
      data: { usedAssessments: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ session });
});
