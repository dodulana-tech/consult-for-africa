import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCadreEmployerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify this mandate belongs to the employer
    const mandate = await prisma.cadreMandate.findFirst({
      where: {
        id,
        facilityId: session.facilityId || undefined,
        facilityName: session.facilityId ? undefined : session.companyName,
      },
      select: { id: true, title: true, cadre: true, type: true, status: true },
    });

    if (!mandate) {
      return NextResponse.json(
        { error: "Mandate not found" },
        { status: 404 }
      );
    }

    const matches = await prisma.cadreMandateMatch.findMany({
      where: { mandateId: id },
      include: {
        professional: {
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
            readinessScoreDomestic: true,
            readinessScoreUK: true,
            readinessScoreUS: true,
            readinessScoreCanada: true,
            readinessScoreGulf: true,
            email: true,
            profileCompleteness: true,
            _count: { select: { credentials: true, qualifications: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ mandate, matches });
  } catch (error) {
    console.error("Employer applicants fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applicants" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCadreEmployerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { matchId, status, notes } = body;

    if (!matchId || !status) {
      return NextResponse.json(
        { error: "matchId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "MATCHED",
      "CONTACTED",
      "INTERESTED",
      "INTERVIEWING",
      "OFFERED",
      "PLACED",
      "DECLINED",
      "WITHDRAWN",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Verify mandate belongs to employer
    const mandate = await prisma.cadreMandate.findFirst({
      where: {
        id,
        facilityId: session.facilityId || undefined,
        facilityName: session.facilityId ? undefined : session.companyName,
      },
      select: { id: true },
    });

    if (!mandate) {
      return NextResponse.json(
        { error: "Mandate not found" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { status };
    if (status === "CONTACTED") updateData.contactedAt = new Date();
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.cadreMandateMatch.update({
      where: { id: matchId },
      data: updateData,
    });

    return NextResponse.json({ success: true, match: updated });
  } catch (error) {
    console.error("Employer applicant status update error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
