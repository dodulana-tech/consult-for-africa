import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { professionalId } = await req.json();

    if (!professionalId) {
      return NextResponse.json({ error: "Professional ID required" }, { status: 400 });
    }

    const professional = await prisma.cadreProfessional.update({
      where: { id: professionalId },
      data: { accountStatus: "VERIFIED" },
    });

    return NextResponse.json({
      id: professional.id,
      accountStatus: professional.accountStatus,
    });
  } catch (error) {
    console.error("Error verifying professional:", error);
    return NextResponse.json({ error: "Failed to verify professional" }, { status: 500 });
  }
}
