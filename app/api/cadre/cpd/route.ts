import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
  "CONFERENCE",
  "WORKSHOP",
  "ONLINE_COURSE",
  "PUBLICATION",
  "TEACHING",
  "CLINICAL_AUDIT",
  "SELF_STUDY",
];

export async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await prisma.cadreCPDEntry.findMany({
      where: { professionalId: session.sub },
      orderBy: { dateCompleted: "desc" },
    });

    // Compute summary: total points this cycle (Jan 1 to Dec 31 of current year)
    const cycleStart = new Date(new Date().getFullYear(), 0, 1);
    const cycleEnd = new Date(new Date().getFullYear(), 11, 31);
    const cycleEntries = entries.filter(
      (e) => e.dateCompleted >= cycleStart && e.dateCompleted <= cycleEnd
    );
    const totalPoints = cycleEntries.reduce(
      (sum, e) => sum + Number(e.points),
      0
    );

    // Standard CPD target: varies by body, use 25 as default
    const targetPoints = 25;
    const daysUntilRenewal = Math.max(
      0,
      Math.ceil(
        (cycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );

    return NextResponse.json({
      entries,
      summary: {
        totalPoints,
        targetPoints,
        daysUntilRenewal,
        cycleYear: new Date().getFullYear(),
      },
    });
  } catch (error) {
    console.error("CPD fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CPD entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { activity, category, provider, points, dateCompleted, certificateUrl } =
      body;

    if (!activity || !category || !points || !dateCompleted) {
      return NextResponse.json(
        { error: "Activity, category, points, and date are required" },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid CPD category" },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(points)) || parseFloat(points) <= 0) {
      return NextResponse.json(
        { error: "Points must be a positive number" },
        { status: 400 }
      );
    }

    const entry = await prisma.cadreCPDEntry.create({
      data: {
        professionalId: session.sub,
        activity: activity.trim(),
        category,
        provider: provider?.trim() || null,
        points: parseFloat(points),
        dateCompleted: new Date(dateCompleted),
        certificateUrl: certificateUrl || null,
      },
    });

    // Recompute completeness
    await recomputeCompleteness(session.sub);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("CPD creation error:", error);
    return NextResponse.json(
      { error: "Failed to log CPD activity" },
      { status: 500 }
    );
  }
}

async function recomputeCompleteness(professionalId: string) {
  const prof = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    include: {
      credentials: true,
      qualifications: true,
      cpdEntries: true,
      workHistory: true,
    },
  });
  if (!prof) return;

  let completeness = 20;
  if (prof.phone) completeness += 5;
  if (prof.cadre) completeness += 5;
  if (prof.subSpecialty) completeness += 5;
  if (prof.yearsOfExperience) completeness += 5;
  if (prof.state || prof.isDiaspora) completeness += 5;
  if (prof.credentials.length > 0) completeness += 15;
  if (prof.qualifications.length > 0) completeness += 15;
  if (prof.cpdEntries.length > 0) completeness += 10;
  if (prof.workHistory.length > 0) completeness += 10;
  if (prof.salaryReportedAt) completeness += 5;

  await prisma.cadreProfessional.update({
    where: { id: professionalId },
    data: { profileCompleteness: Math.min(completeness, 100) },
  });
}
