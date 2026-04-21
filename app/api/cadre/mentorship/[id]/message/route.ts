import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: "Message too long (max 5000 characters)" }, { status: 400 });
    }

    const mentorship = await prisma.cadreMentorship.findUnique({
      where: { id },
      include: { mentorProfile: true },
    });

    if (!mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }

    // Only participants can message
    const isMentor = mentorship.mentorProfile.professionalId === session.sub;
    const isMentee = mentorship.menteeId === session.sub;
    if (!isMentor && !isMentee) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Must be active
    if (mentorship.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Can only send messages in active mentorships" },
        { status: 400 }
      );
    }

    const [message] = await Promise.all([
      prisma.cadreMentorshipMessage.create({
        data: {
          mentorshipId: id,
          senderId: session.sub,
          content: content.trim(),
        },
      }),
      prisma.cadreMentorship.update({
        where: { id },
        data: { lastActivityAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
});
