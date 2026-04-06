import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import type { CadreProfessionalCadre } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getCadreEmployerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cadre = searchParams.get("cadre");
    const subSpecialty = searchParams.get("subSpecialty");
    const state = searchParams.get("state");
    const minYears = searchParams.get("minYears");
    const maxYears = searchParams.get("maxYears");
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      availability: { in: ["ACTIVELY_LOOKING", "OPEN_TO_OFFERS"] },
    };

    if (cadre) where.cadre = cadre as CadreProfessionalCadre;
    if (subSpecialty) where.subSpecialty = { contains: subSpecialty, mode: "insensitive" };
    if (state) where.state = state;
    if (minYears) where.yearsOfExperience = { ...where.yearsOfExperience, gte: parseInt(minYears) };
    if (maxYears) where.yearsOfExperience = { ...where.yearsOfExperience, lte: parseInt(maxYears) };
    if (verifiedOnly) where.accountStatus = "VERIFIED";

    const professionals = await prisma.cadreProfessional.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        cadre: true,
        subSpecialty: true,
        yearsOfExperience: true,
        state: true,
        city: true,
        accountStatus: true,
        availability: true,
        readinessScoreDomestic: true,
        profileCompleteness: true,
        // Explicitly exclude: email, phone, salary, passwordHash
      },
      orderBy: [
        { readinessScoreDomestic: "desc" },
        { profileCompleteness: "desc" },
      ],
      take: 50,
    });

    return NextResponse.json({ professionals });
  } catch (error) {
    console.error("Professional search error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}
