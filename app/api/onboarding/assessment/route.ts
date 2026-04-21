import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const VALID_SERVICE_TYPES = [
  "HOSPITAL_OPERATIONS",
  "TURNAROUND",
  "EMBEDDED_LEADERSHIP",
  "CLINICAL_GOVERNANCE",
  "DIGITAL_HEALTH",
  "HEALTH_SYSTEMS",
  "DIASPORA_EXPERTISE",
  "EM_AS_SERVICE",
];

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const onboarding = await prisma.consultantOnboarding.findUnique({
    where: { userId },
  });

  if (!onboarding) {
    return Response.json({ error: "No onboarding record found" }, { status: 404 });
  }

  if (onboarding.status === "ACTIVE" || onboarding.status === "REJECTED") {
    return Response.json({ error: "Onboarding already completed" }, { status: 400 });
  }

  if (onboarding.assessmentLevel === "LIGHT" || onboarding.assessmentLevel === "MAAROVA") {
    return Response.json({ error: "No self-assessment required for this level" }, { status: 400 });
  }

  const body = await req.json();
  const { scores } = body;

  if (!scores || typeof scores !== "object") {
    return Response.json({ error: "scores object is required" }, { status: 400 });
  }

  // Validate scores: each key must be a valid ServiceType and value 1-5
  const validatedScores: Record<string, number> = {};
  for (const [key, value] of Object.entries(scores)) {
    if (!VALID_SERVICE_TYPES.includes(key)) continue;
    const num = Number(value);
    if (num >= 1 && num <= 5) {
      validatedScores[key] = num;
    }
  }

  if (Object.keys(validatedScores).length === 0) {
    return Response.json({ error: "At least one valid skill score is required" }, { status: 400 });
  }

  // Store assessment scores merged into existing notificationPreferences
  // so we don't overwrite any notification settings the user already has
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  });

  const existingPrefs =
    typeof currentUser?.notificationPreferences === "object" &&
    currentUser.notificationPreferences !== null &&
    !Array.isArray(currentUser.notificationPreferences)
      ? currentUser.notificationPreferences
      : {};

  await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreferences: { ...existingPrefs, selfAssessment: validatedScores },
    },
  });

  await prisma.consultantOnboarding.update({
    where: { userId },
    data: {
      assessmentCompleted: true,
      status: "ASSESSMENT_COMPLETE",
    },
  });

  return Response.json({ ok: true });
});
