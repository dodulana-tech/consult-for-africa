import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: mandateId } = await params;

    // Verify the mandate exists and is open/published
    const mandate = await prisma.cadreMandate.findUnique({
      where: { id: mandateId },
    });

    if (!mandate || mandate.status !== "OPEN" || !mandate.isPublished) {
      return NextResponse.json(
        { error: "This position is no longer accepting applications" },
        { status: 404 }
      );
    }

    // Check for existing application
    const existing = await prisma.cadreMandateMatch.findUnique({
      where: {
        mandateId_professionalId: {
          mandateId,
          professionalId: session.sub,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 409 }
      );
    }

    // Create match and increment application count in a transaction
    await prisma.$transaction([
      prisma.cadreMandateMatch.create({
        data: {
          mandateId,
          professionalId: session.sub,
          status: "APPLIED",
        },
      }),
      prisma.cadreMandate.update({
        where: { id: mandateId },
        data: { applicationCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { error: "Application failed. Please try again." },
      { status: 500 }
    );
  }
}
