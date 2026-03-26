import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const coach = await prisma.maarovaCoach.findUnique({
    where: { id },
    include: {
      organisation: { select: { id: true, name: true } },
      matches: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, title: true } },
          _count: { select: { sessions: true } },
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          amount: true,
          currency: true,
          issuedAt: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!coach) return Response.json({ error: "Coach not found" }, { status: 404 });

  // Count goals across all matched users
  const matchedUserIds = coach.matches.map((m) => m.userId);
  const goalsCount = matchedUserIds.length > 0
    ? await prisma.maarovaDevelopmentGoal.count({
        where: { userId: { in: matchedUserIds }, source: "coach" },
      })
    : 0;

  return Response.json({
    id: coach.id,
    name: coach.name,
    email: coach.email,
    title: coach.title,
    bio: coach.bio,
    specialisms: coach.specialisms,
    certifications: coach.certifications,
    country: coach.country,
    city: coach.city,
    yearsExperience: coach.yearsExperience,
    maxClients: coach.maxClients,
    activeClients: coach.activeClients,
    isActive: coach.isActive,
    isPortalEnabled: coach.isPortalEnabled,
    avatarUrl: coach.avatarUrl,
    languages: coach.languages,
    timezone: coach.timezone,
    healthcareExperience: coach.healthcareExperience,
    developmentFocus: coach.developmentFocus,
    vettingStatus: coach.vettingStatus,
    applicationDate: coach.applicationDate?.toISOString() ?? null,
    interviewDate: coach.interviewDate?.toISOString() ?? null,
    interviewScore: coach.interviewScore,
    interviewNotes: coach.interviewNotes,
    vetNotes: coach.vetNotes,
    reviewedBy: coach.reviewedBy,
    hourlyRate: coach.hourlyRate ? Number(coach.hourlyRate) : null,
    currency: coach.currency,
    avgSessionRating: coach.avgSessionRating ? Number(coach.avgSessionRating) : null,
    totalSessions: coach.totalSessions,
    completedEngagements: coach.completedEngagements,
    lastLoginAt: coach.lastLoginAt?.toISOString() ?? null,
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
    organisation: coach.organisation,
    matches: coach.matches.map((m) => ({
      id: m.id,
      status: m.status,
      programme: m.programme,
      matchScore: m.matchScore,
      startDate: m.startDate?.toISOString() ?? null,
      endDate: m.endDate?.toISOString() ?? null,
      sessionsCompleted: m.sessionsCompleted,
      sessionsScheduled: m.sessionsScheduled,
      sessionCount: m._count.sessions,
      createdAt: m.createdAt.toISOString(),
      user: m.user,
    })),
    invoices: coach.invoices.map((inv) => ({
      ...inv,
      amount: Number(inv.amount),
      issuedAt: inv.issuedAt?.toISOString() ?? null,
      paidAt: inv.paidAt?.toISOString() ?? null,
      createdAt: inv.createdAt.toISOString(),
    })),
    goalsCount,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.maarovaCoach.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Coach not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.email !== undefined) {
    const normEmail = body.email.trim().toLowerCase();
    if (normEmail !== existing.email) {
      const dup = await prisma.maarovaCoach.findUnique({ where: { email: normEmail } });
      if (dup) return Response.json({ error: "A coach with this email already exists" }, { status: 409 });
      data.email = normEmail;
    }
  }
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.bio !== undefined) data.bio = body.bio.trim();
  if (body.specialisms !== undefined) data.specialisms = body.specialisms;
  if (body.certifications !== undefined) data.certifications = body.certifications;
  if (body.country !== undefined) data.country = body.country.trim();
  if (body.city !== undefined) data.city = body.city?.trim() || null;
  if (body.yearsExperience !== undefined) {
    const parsedYears = parseInt(String(body.yearsExperience), 10);
    if (isNaN(parsedYears) || parsedYears < 0) {
      return Response.json({ error: "Years of experience must be a valid positive number" }, { status: 400 });
    }
    data.yearsExperience = parsedYears;
  }
  if (body.maxClients !== undefined) {
    const parsedMaxClients = parseInt(String(body.maxClients), 10);
    if (isNaN(parsedMaxClients) || parsedMaxClients < 0) {
      return Response.json({ error: "Max clients must be a valid positive number" }, { status: 400 });
    }
    data.maxClients = parsedMaxClients;
  }
  if (body.languages !== undefined) data.languages = body.languages;
  if (body.timezone !== undefined) data.timezone = body.timezone.trim();
  if (body.healthcareExperience !== undefined) data.healthcareExperience = body.healthcareExperience;
  if (body.developmentFocus !== undefined) data.developmentFocus = body.developmentFocus;
  if (body.hourlyRate !== undefined) {
    const parsedRate = body.hourlyRate != null ? parseFloat(String(body.hourlyRate)) : null;
    if (parsedRate !== null && (isNaN(parsedRate) || parsedRate < 0)) {
      return Response.json({ error: "Hourly rate must be a valid positive number" }, { status: 400 });
    }
    data.hourlyRate = parsedRate;
  }
  if (body.currency !== undefined) data.currency = body.currency.trim();
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl?.trim() || null;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.organisationId !== undefined) data.organisationId = body.organisationId || null;

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.maarovaCoach.update({
    where: { id },
    data,
  });

  return Response.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const coach = await prisma.maarovaCoach.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          matches: { where: { status: { in: ["ACTIVE", "PENDING_MATCH", "MATCHED"] } } },
        },
      },
    },
  });

  if (!coach) return Response.json({ error: "Coach not found" }, { status: 404 });

  if (coach._count.matches > 0) {
    return Response.json(
      { error: "Cannot deactivate coach with active matches. Reassign or complete them first." },
      { status: 400 },
    );
  }

  await prisma.maarovaCoach.update({
    where: { id },
    data: { isActive: false },
  });

  return Response.json({ message: "Coach deactivated successfully" });
}
