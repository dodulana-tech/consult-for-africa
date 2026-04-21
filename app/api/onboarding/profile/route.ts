import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
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

  const body = await req.json();
  const {
    title, bio, location, expertiseAreas, specialties, primarySpecialty,
    yearsExperience, isDiaspora, availabilityStatus, hoursPerWeek, interests,
  } = body;

  if (!title?.trim() || !location?.trim() || !yearsExperience) {
    return new Response("title, location, and yearsExperience are required", { status: 400 });
  }

  // Derive specialty category from primary specialty
  let specialtyCategory: string | null = null;
  if (primarySpecialty) {
    const { getSpecialtyCategory } = await import("@/lib/specialties");
    specialtyCategory = getSpecialtyCategory(primarySpecialty)?.key ?? null;
  }

  // Upsert consultant profile
  await prisma.consultantProfile.upsert({
    where: { userId },
    create: {
      userId,
      title: title.trim(),
      bio: (bio ?? "").trim(),
      location: location.trim(),
      isDiaspora: isDiaspora ?? false,
      expertiseAreas: Array.isArray(expertiseAreas) ? expertiseAreas : [],
      specialties: Array.isArray(specialties) ? specialties : [],
      primarySpecialty: primarySpecialty ?? null,
      specialtyCategory,
      yearsExperience: Number(yearsExperience),
      availabilityStatus: availabilityStatus ?? "AVAILABLE",
      hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : null,
      interests: Array.isArray(interests) ? interests : [],
    },
    update: {
      title: title.trim(),
      bio: (bio ?? "").trim(),
      location: location.trim(),
      isDiaspora: isDiaspora ?? false,
      expertiseAreas: Array.isArray(expertiseAreas) ? expertiseAreas : [],
      specialties: Array.isArray(specialties) ? specialties : [],
      primarySpecialty: primarySpecialty ?? null,
      specialtyCategory,
      yearsExperience: Number(yearsExperience),
      availabilityStatus: availabilityStatus ?? "AVAILABLE",
      hoursPerWeek: hoursPerWeek ? Number(hoursPerWeek) : null,
      interests: Array.isArray(interests) ? interests : [],
    },
  });

  // Update onboarding status
  await prisma.consultantOnboarding.update({
    where: { userId },
    data: {
      profileCompleted: true,
      status: onboarding.status === "INVITED" ? "PROFILE_SETUP" : onboarding.status,
    },
  });

  return Response.json({ ok: true });
});
