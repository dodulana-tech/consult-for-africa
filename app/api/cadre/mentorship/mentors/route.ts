import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cadre = searchParams.get("cadre");
    const area = searchParams.get("area");
    const partnerOrg = searchParams.get("partnerOrg");
    const country = searchParams.get("country");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (cadre) {
      where.mentorCadres = { has: cadre };
    }
    if (area) {
      where.mentorAreas = { has: area };
    }
    if (partnerOrg) {
      where.partnerOrg = partnerOrg;
    }
    if (country) {
      where.countryOfPractice = { contains: country, mode: "insensitive" };
    }

    const [mentors, total] = await Promise.all([
      prisma.cadreMentorProfile.findMany({
        where,
        include: {
          professional: {
            select: {
              firstName: true,
              lastName: true,
              cadre: true,
              subSpecialty: true,
              photo: true,
              yearsOfExperience: true,
            },
          },
        },
        orderBy: [
          { partnerOrgVerified: "desc" },
          { averageRating: "desc" },
          { totalMentorships: "desc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cadreMentorProfile.count({ where }),
    ]);

    return NextResponse.json({
      mentors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("List mentors error:", error);
    return NextResponse.json({ error: "Failed to list mentors" }, { status: 500 });
  }
}
