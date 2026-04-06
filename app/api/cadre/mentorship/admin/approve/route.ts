import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user?.role ||
      !["ADMIN", "PARTNER", "DIRECTOR"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mentorProfileId, action } = body; // action: "approve" or "reject"

    if (!mentorProfileId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const profile = await prisma.cadreMentorProfile.findUnique({
      where: { id: mentorProfileId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    if (profile.status !== "PENDING") {
      return NextResponse.json({ error: "Profile is not pending approval" }, { status: 400 });
    }

    if (action === "approve") {
      const updated = await prisma.cadreMentorProfile.update({
        where: { id: mentorProfileId },
        data: { status: "ACTIVE" },
      });
      return NextResponse.json({ profile: updated });
    } else if (action === "reject") {
      const updated = await prisma.cadreMentorProfile.update({
        where: { id: mentorProfileId },
        data: { status: "INACTIVE" },
      });
      return NextResponse.json({ profile: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin approve mentor error:", error);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
