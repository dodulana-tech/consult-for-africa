import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import { notifyProfileView } from "@/lib/cadreHealth/notifications";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
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

    // Notify the professional
    try {
      await notifyProfileView(professionalId, session.companyName || undefined);
    } catch (notifErr) {
      console.error("Failed to send profile view notification:", notifErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile view error:", error);
    return NextResponse.json(
      { error: "Failed to record view" },
      { status: 500 }
    );
  }
});
