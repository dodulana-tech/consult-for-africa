import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  try {
    const session = await getCadreEmployerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const mandates = await prisma.cadreMandate.findMany({
      where: {
        facilityId: session.facilityId || undefined,
        facilityName: session.facilityId ? undefined : session.companyName,
      },
      select: {
        id: true,
        title: true,
        cadre: true,
        type: true,
        status: true,
        locationState: true,
        locationCity: true,
        applicationCount: true,
        isPublished: true,
        createdAt: true,
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ mandates });
  } catch (error) {
    console.error("Employer applications list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
});
