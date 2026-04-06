import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mentorProfileId, topic, message } = body;

    if (!mentorProfileId || !topic?.trim()) {
      return NextResponse.json(
        { error: "Mentor profile and topic are required" },
        { status: 400 }
      );
    }

    // Validate mentor exists and is active
    const mentorProfile = await prisma.cadreMentorProfile.findUnique({
      where: { id: mentorProfileId },
    });
    if (!mentorProfile || mentorProfile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Mentor not found or unavailable" }, { status: 404 });
    }

    // Cannot mentor yourself
    if (mentorProfile.professionalId === session.sub) {
      return NextResponse.json({ error: "You cannot request mentorship from yourself" }, { status: 400 });
    }

    // Check capacity
    if (mentorProfile.currentMenteeCount >= mentorProfile.maxMentees) {
      return NextResponse.json(
        { error: "This mentor has reached their maximum number of mentees" },
        { status: 409 }
      );
    }

    // Check for existing active/requested mentorship with same mentor
    const existing = await prisma.cadreMentorship.findFirst({
      where: {
        mentorProfileId,
        menteeId: session.sub,
        status: { in: ["REQUESTED", "ACTIVE"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have an active or pending mentorship with this mentor" },
        { status: 409 }
      );
    }

    const mentorship = await prisma.cadreMentorship.create({
      data: {
        mentorProfileId,
        menteeId: session.sub,
        topic: topic.trim(),
        message: message?.trim() || null,
        status: "REQUESTED",
      },
    });

    return NextResponse.json({ mentorship }, { status: 201 });
  } catch (error) {
    console.error("Request mentorship error:", error);
    return NextResponse.json({ error: "Failed to request mentorship" }, { status: 500 });
  }
}
