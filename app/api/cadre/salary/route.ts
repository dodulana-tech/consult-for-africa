import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import { handler } from "@/lib/api-handler";

// POST: Submit salary report (give)
export const POST = handler(async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to submit a salary report" }, { status: 401 });
    }

    const body = await req.json();

    const report = await prisma.cadreSalaryReport.create({
      data: {
        professionalId: session.sub,
        facilityId: body.facilityId || null,
        cadre: body.cadre,
        role: body.role,
        facilityType: body.facilityType || null,
        state: body.state,
        city: body.city || null,
        yearsOfExperience: body.yearsOfExperience || null,
        baseSalary: body.baseSalary,
        currency: body.currency || "NGN",
        allowances: body.allowances || null,
        callDutyPay: body.callDutyPay || null,
        locumIncome: body.locumIncome || null,
        totalMonthlyTakeHome: body.totalMonthlyTakeHome || null,
        paidOnTime: body.paidOnTime ?? null,
        averagePayDelayDays: body.averagePayDelayDays || null,
      },
    });

    // Mark that this professional has contributed salary data
    await prisma.cadreProfessional.update({
      where: { id: session.sub },
      data: {
        salaryReportedAt: new Date(),
        profileCompleteness: { increment: 10 },
      },
    });

    return NextResponse.json({ id: report.id });
  } catch (error) {
    console.error("Salary report error:", error);
    return NextResponse.json({ error: "Failed to save salary report" }, { status: 500 });
  }
});

// GET: Fetch aggregated salary data (get) - only if user has contributed
export const GET = handler(async function GET(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }

    // Check if user has contributed salary data (give-to-get)
    const professional = await prisma.cadreProfessional.findUnique({
      where: { id: session.sub },
      select: { salaryReportedAt: true },
    });

    if (!professional?.salaryReportedAt) {
      return NextResponse.json({
        locked: true,
        message: "Share your salary to unlock the salary map. Your data is anonymized.",
      });
    }

    const url = new URL(req.url);
    const cadre = url.searchParams.get("cadre");
    const state = url.searchParams.get("state");
    const facilityType = url.searchParams.get("facilityType");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (cadre) where.cadre = cadre;
    if (state) where.state = state;
    if (facilityType) where.facilityType = facilityType;

    // Aggregate salary data
    const reports = await prisma.cadreSalaryReport.findMany({
      where,
      select: {
        cadre: true,
        role: true,
        facilityType: true,
        state: true,
        city: true,
        yearsOfExperience: true,
        baseSalary: true,
        allowances: true,
        totalMonthlyTakeHome: true,
        paidOnTime: true,
        reportedAt: true,
      },
      orderBy: { reportedAt: "desc" },
      take: 500,
    });

    // Compute aggregates by cadre + state
    const aggregates = new Map<string, { salaries: number[]; paidOnTime: number; total: number }>();

    for (const r of reports) {
      const key = `${r.cadre}|${r.state}`;
      if (!aggregates.has(key)) {
        aggregates.set(key, { salaries: [], paidOnTime: 0, total: 0 });
      }
      const agg = aggregates.get(key)!;
      agg.salaries.push(Number(r.totalMonthlyTakeHome || r.baseSalary));
      if (r.paidOnTime) agg.paidOnTime++;
      agg.total++;
    }

    const summary = Array.from(aggregates.entries()).map(([key, agg]) => {
      const [cadreVal, stateVal] = key.split("|");
      const sorted = agg.salaries.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] || 0;
      return {
        cadre: cadreVal,
        state: stateVal,
        count: agg.total,
        medianSalary: Math.round(median),
        minSalary: Math.round(sorted[0] || 0),
        maxSalary: Math.round(sorted[sorted.length - 1] || 0),
        paidOnTimePct: agg.total > 0 ? Math.round((agg.paidOnTime / agg.total) * 100) : null,
      };
    });

    return NextResponse.json({
      locked: false,
      summary,
      totalReports: reports.length,
    });
  } catch (error) {
    console.error("Salary map error:", error);
    return NextResponse.json({ error: "Failed to load salary data" }, { status: 500 });
  }
});
