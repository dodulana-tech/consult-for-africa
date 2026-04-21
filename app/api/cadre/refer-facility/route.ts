import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      facilityName,
      contactName,
      contactEmail,
      contactPhone,
      facilityType,
      state,
      city,
      needType,
      notes,
    } = body;

    if (!facilityName?.trim()) {
      return NextResponse.json(
        { error: "Facility name is required." },
        { status: 400 }
      );
    }

    if (!needType) {
      return NextResponse.json(
        { error: "Need type is required." },
        { status: 400 }
      );
    }

    const referral = await prisma.cadreFacilityReferral.create({
      data: {
        referredById: session.sub,
        facilityName: facilityName.trim(),
        contactName: contactName?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        facilityType: facilityType || null,
        state: state || null,
        city: city?.trim() || null,
        needType,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    console.error("Facility referral error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const GET = handler(async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referrals = await prisma.cadreFacilityReferral.findMany({
      where: { referredById: session.sub },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("Facility referral fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
