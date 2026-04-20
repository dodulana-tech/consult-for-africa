import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { professionalId, recruitmentStage, interviewDate, recruitmentNotes } =
    await req.json();

  if (!professionalId) {
    return NextResponse.json(
      { error: "professionalId is required" },
      { status: 400 }
    );
  }

  const updated = await prisma.cadreProfessional.update({
    where: { id: professionalId },
    data: {
      recruitmentStage: recruitmentStage || null,
      interviewDate: interviewDate ? new Date(interviewDate) : null,
      recruitmentNotes: recruitmentNotes || null,
    },
    select: {
      id: true,
      recruitmentStage: true,
      interviewDate: true,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
