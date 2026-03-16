import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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

export async function POST(req: NextRequest) {
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

  if (onboarding.assessmentLevel === "LIGHT") {
    return new Response("No assessment required for LIGHT level", { status: 400 });
  }

  const body = await req.json();
  const { scores } = body;

  if (!scores || typeof scores !== "object") {
    return new Response("scores object is required", { status: 400 });
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
    return new Response("At least one valid skill score is required", { status: 400 });
  }

  // Store assessment data in user notification preferences (or a dedicated field)
  // For now, store in the consultant profile's interests as JSON metadata
  // Better approach: store as JSON in the onboarding record via a raw query
  // We will use the User's notificationPreferences to store this temporarily
  await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreferences: {
        selfAssessment: validatedScores,
      },
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
}
