import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCadreEmployerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { professionalId } = await req.json();

    if (!professionalId) {
      return NextResponse.json(
        { error: "Professional ID is required" },
        { status: 400 }
      );
    }

    await prisma.cadreProfessional.update({
      where: { id: professionalId },
      data: {
        profileViews: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile view error:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
}
