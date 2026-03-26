import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

interface CoachRow {
  name: string;
  email: string;
  title: string;
  bio: string;
  country: string;
  specialisms: string[];
  certifications: string[];
  yearsExperience: number;
  city?: string;
  organisationId?: string;
  languages?: string[];
  timezone?: string;
  healthcareExperience?: boolean;
  developmentFocus?: string[];
  maxClients?: number;
  hourlyRate?: number;
  currency?: string;
  avatarUrl?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { coaches } = body as { coaches: CoachRow[] };

  if (!Array.isArray(coaches) || coaches.length === 0) {
    return Response.json({ error: "coaches array is required" }, { status: 400 });
  }

  if (coaches.length > 50) {
    return Response.json({ error: "Maximum 50 coaches per upload" }, { status: 400 });
  }

  const errors: string[] = [];
  const validCoaches: (CoachRow & { normEmail: string })[] = [];
  const seenEmails = new Set<string>();

  for (let i = 0; i < coaches.length; i++) {
    const c = coaches[i];
    const row = i + 1;

    if (!c.name?.trim()) { errors.push(`Row ${row}: name is required`); continue; }
    if (!c.email?.trim()) { errors.push(`Row ${row}: email is required`); continue; }
    if (!c.title?.trim()) { errors.push(`Row ${row}: title is required`); continue; }
    if (!c.bio?.trim()) { errors.push(`Row ${row}: bio is required`); continue; }
    if (!c.country?.trim()) { errors.push(`Row ${row}: country is required`); continue; }
    if (!Array.isArray(c.specialisms) || c.specialisms.length === 0) {
      errors.push(`Row ${row}: at least one specialism is required`); continue;
    }
    if (!Array.isArray(c.certifications) || c.certifications.length === 0) {
      errors.push(`Row ${row}: at least one certification is required`); continue;
    }
    if (c.yearsExperience === undefined || c.yearsExperience === null) {
      errors.push(`Row ${row}: yearsExperience is required`); continue;
    }

    const normEmail = c.email.trim().toLowerCase();
    if (seenEmails.has(normEmail)) {
      errors.push(`Row ${row}: duplicate email in upload (${normEmail})`);
      continue;
    }

    seenEmails.add(normEmail);
    validCoaches.push({ ...c, normEmail });
  }

  // Check existing emails in DB
  const existingCoaches = await prisma.maarovaCoach.findMany({
    where: { email: { in: [...seenEmails] } },
    select: { email: true },
  });
  const existingEmails = new Set(existingCoaches.map((c) => c.email));

  let created = 0;
  let skipped = 0;

  for (const c of validCoaches) {
    if (existingEmails.has(c.normEmail)) {
      skipped++;
      continue;
    }

    await prisma.maarovaCoach.create({
      data: {
        name: c.name.trim(),
        email: c.normEmail,
        title: c.title.trim(),
        bio: c.bio.trim(),
        country: c.country.trim(),
        city: c.city?.trim() || null,
        specialisms: c.specialisms,
        certifications: c.certifications,
        yearsExperience: parseInt(String(c.yearsExperience), 10),
        organisationId: c.organisationId || null,
        languages: Array.isArray(c.languages) && c.languages.length > 0 ? c.languages : ["English"],
        timezone: c.timezone?.trim() || "Africa/Lagos",
        healthcareExperience: c.healthcareExperience ?? false,
        developmentFocus: Array.isArray(c.developmentFocus) ? c.developmentFocus : [],
        maxClients: c.maxClients ? parseInt(String(c.maxClients), 10) : 8,
        hourlyRate: c.hourlyRate ?? null,
        currency: c.currency?.trim() || "NGN",
        avatarUrl: c.avatarUrl?.trim() || null,
        vettingStatus: "APPLIED",
        applicationDate: new Date(),
      },
    });

    created++;
  }

  return Response.json({ created, skipped, errors });
}
