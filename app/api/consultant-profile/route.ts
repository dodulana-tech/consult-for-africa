import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { AvailabilityStatus } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) return new Response("Profile not found", { status: 404 });

  return Response.json({
    ...profile,
    hourlyRateUSD: profile.hourlyRateUSD ? Number(profile.hourlyRateUSD) : null,
    monthlyRateNGN: profile.monthlyRateNGN ? Number(profile.monthlyRateNGN) : null,
    averageRating: profile.averageRating ? Number(profile.averageRating) : null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    // Mask sensitive banking data
    accountNumber: profile.accountNumber ? `****${profile.accountNumber.slice(-4)}` : null,
    swiftCode: undefined,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  if (session.user.role !== "CONSULTANT") {
    return new Response("Only consultants can update their own profile", { status: 403 });
  }

  const {
    title, bio, location, isDiaspora,
    expertiseAreas, yearsExperience, hoursPerWeek,
    availabilityStatus,
    hourlyRateUSD, monthlyRateNGN,
    bankName, accountNumber, accountName, swiftCode,
  } = await req.json();

  const validStatuses: AvailabilityStatus[] = ["AVAILABLE", "PARTIALLY_AVAILABLE", "UNAVAILABLE", "ON_LEAVE"];
  if (availabilityStatus && !validStatuses.includes(availabilityStatus)) {
    return new Response("Invalid availability status", { status: 400 });
  }

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (bio !== undefined) data.bio = bio;
  if (location !== undefined) data.location = location;
  if (isDiaspora !== undefined) data.isDiaspora = isDiaspora;
  if (expertiseAreas !== undefined) data.expertiseAreas = expertiseAreas;
  if (yearsExperience !== undefined) data.yearsExperience = parseInt(yearsExperience);
  if (hoursPerWeek !== undefined) data.hoursPerWeek = parseInt(hoursPerWeek) || null;
  if (availabilityStatus !== undefined) data.availabilityStatus = availabilityStatus;
  if (hourlyRateUSD !== undefined) data.hourlyRateUSD = hourlyRateUSD ? parseFloat(hourlyRateUSD) : null;
  if (monthlyRateNGN !== undefined) data.monthlyRateNGN = monthlyRateNGN ? parseFloat(monthlyRateNGN) : null;
  if (bankName !== undefined) data.bankName = bankName || null;
  if (accountNumber !== undefined) data.accountNumber = accountNumber || null;
  if (accountName !== undefined) data.accountName = accountName || null;
  if (swiftCode !== undefined) data.swiftCode = swiftCode || null;

  const updated = await prisma.consultantProfile.update({
    where: { id: profile.id },
    data,
  });

  // Strip sensitive financial data from response
  const { accountNumber: _an, swiftCode: _sw, bankName: _bn, accountName: _acn, ...safeProfile } = updated;

  return Response.json({
    ok: true,
    profile: {
      ...safeProfile,
      hourlyRateUSD: safeProfile.hourlyRateUSD ? Number(safeProfile.hourlyRateUSD) : null,
      monthlyRateNGN: safeProfile.monthlyRateNGN ? Number(safeProfile.monthlyRateNGN) : null,
      averageRating: safeProfile.averageRating ? Number(safeProfile.averageRating) : null,
      // Return masked bank info so UI shows status without exposing full numbers
      hasBankDetails: !!(updated.bankName && updated.accountNumber),
      bankNameMasked: updated.bankName ? `${updated.bankName.slice(0, 3)}***` : null,
      accountNumberMasked: updated.accountNumber ? `****${updated.accountNumber.slice(-4)}` : null,
    },
  });
}
