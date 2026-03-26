import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};

  if (status) {
    where.vettingStatus = status;
  }

  if (active !== null) {
    where.isActive = active === "true";
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const coaches = await prisma.maarovaCoach.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      title: true,
      country: true,
      city: true,
      specialisms: true,
      certifications: true,
      yearsExperience: true,
      vettingStatus: true,
      isActive: true,
      isPortalEnabled: true,
      activeClients: true,
      maxClients: true,
      avgSessionRating: true,
      totalSessions: true,
      completedEngagements: true,
      languages: true,
      timezone: true,
      healthcareExperience: true,
      developmentFocus: true,
      hourlyRate: true,
      currency: true,
      createdAt: true,
      _count: { select: { matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    coaches: coaches.map((c) => ({
      ...c,
      hourlyRate: c.hourlyRate ? Number(c.hourlyRate) : null,
      avgSessionRating: c.avgSessionRating ? Number(c.avgSessionRating) : null,
      createdAt: c.createdAt.toISOString(),
      matchCount: c._count.matches,
      _count: undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    name,
    email,
    title,
    bio,
    country,
    specialisms,
    certifications,
    yearsExperience,
    city,
    organisationId,
    languages,
    timezone,
    healthcareExperience,
    developmentFocus,
    maxClients,
    hourlyRate,
    currency,
    avatarUrl,
  } = body;

  if (!name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!email?.trim()) return Response.json({ error: "Email is required" }, { status: 400 });
  if (!title?.trim()) return Response.json({ error: "Title is required" }, { status: 400 });
  if (!bio?.trim()) return Response.json({ error: "Bio is required" }, { status: 400 });
  if (!country?.trim()) return Response.json({ error: "Country is required" }, { status: 400 });
  if (!Array.isArray(specialisms) || specialisms.length === 0) {
    return Response.json({ error: "At least one specialism is required" }, { status: 400 });
  }
  if (!Array.isArray(certifications) || certifications.length === 0) {
    return Response.json({ error: "At least one certification is required" }, { status: 400 });
  }
  if (yearsExperience === undefined || yearsExperience === null) {
    return Response.json({ error: "Years of experience is required" }, { status: 400 });
  }

  const parsedYears = parseInt(String(yearsExperience), 10);
  if (isNaN(parsedYears) || parsedYears < 0) {
    return Response.json({ error: "Years of experience must be a valid positive number" }, { status: 400 });
  }
  const parsedMaxClients = maxClients ? parseInt(String(maxClients), 10) : 8;
  if (isNaN(parsedMaxClients) || parsedMaxClients < 0) {
    return Response.json({ error: "Max clients must be a valid positive number" }, { status: 400 });
  }
  const parsedHourlyRate = hourlyRate != null ? parseFloat(String(hourlyRate)) : null;
  if (parsedHourlyRate !== null && (isNaN(parsedHourlyRate) || parsedHourlyRate < 0)) {
    return Response.json({ error: "Hourly rate must be a valid positive number" }, { status: 400 });
  }

  const normEmail = email.trim().toLowerCase();
  const existing = await prisma.maarovaCoach.findUnique({ where: { email: normEmail } });
  if (existing) {
    return Response.json({ error: "A coach with this email already exists" }, { status: 409 });
  }

  const coach = await prisma.maarovaCoach.create({
    data: {
      name: name.trim(),
      email: normEmail,
      title: title.trim(),
      bio: bio.trim(),
      country: country.trim(),
      city: city?.trim() || null,
      specialisms,
      certifications,
      yearsExperience: parsedYears,
      organisationId: organisationId || null,
      languages: Array.isArray(languages) && languages.length > 0 ? languages : ["English"],
      timezone: timezone?.trim() || "Africa/Lagos",
      healthcareExperience: healthcareExperience ?? false,
      developmentFocus: Array.isArray(developmentFocus) ? developmentFocus : [],
      maxClients: parsedMaxClients,
      hourlyRate: parsedHourlyRate,
      currency: currency?.trim() || "NGN",
      avatarUrl: avatarUrl?.trim() || null,
      vettingStatus: "APPLIED",
      applicationDate: new Date(),
    },
  });

  return Response.json({
    coach: {
      id: coach.id,
      name: coach.name,
      email: coach.email,
      title: coach.title,
      vettingStatus: coach.vettingStatus,
      createdAt: coach.createdAt.toISOString(),
    },
  });
}
