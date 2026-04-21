import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { notifyMentorshipAccepted } from "@/lib/cadreHealth/notifications";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const mentorship = await prisma.cadreMentorship.findUnique({
      where: { id },
      include: {
        mentorProfile: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                cadre: true,
                subSpecialty: true,
                photo: true,
              },
            },
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            cadre: true,
            subSpecialty: true,
            photo: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }

    // Only participants can view
    const isMentor = mentorship.mentorProfile.professionalId === session.sub;
    const isMentee = mentorship.menteeId === session.sub;
    if (!isMentor && !isMentee) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json({ mentorship, role: isMentor ? "mentor" : "mentee" });
  } catch (error) {
    console.error("Get mentorship error:", error);
    return NextResponse.json({ error: "Failed to load mentorship" }, { status: 500 });
  }
});

export const PATCH = handler(async function PATCH(
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
    const { action } = body; // accept, decline, complete, cancel

    const mentorship = await prisma.cadreMentorship.findUnique({
      where: { id },
      include: { mentorProfile: true },
    });

    if (!mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }

    const isMentor = mentorship.mentorProfile.professionalId === session.sub;
    const isMentee = mentorship.menteeId === session.sub;

    if (!isMentor && !isMentee) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    switch (action) {
      case "accept": {
        if (!isMentor) {
          return NextResponse.json({ error: "Only the mentor can accept" }, { status: 403 });
        }
        if (mentorship.status !== "REQUESTED") {
          return NextResponse.json({ error: "Can only accept requested mentorships" }, { status: 400 });
        }
        const updated = await prisma.$transaction(async (tx) => {
          const m = await tx.cadreMentorship.update({
            where: { id },
            data: { status: "ACTIVE", acceptedAt: new Date(), lastActivityAt: new Date() },
          });
          await tx.cadreMentorProfile.update({
            where: { id: mentorship.mentorProfileId },
            data: { currentMenteeCount: { increment: 1 } },
          });
          return m;
        });

        // Notify the mentee
        try {
          const mentor = await prisma.cadreProfessional.findUnique({
            where: { id: session.sub },
            select: { firstName: true, lastName: true },
          });
          const mentorName = mentor
            ? `${mentor.firstName} ${mentor.lastName}`
            : "Your mentor";
          await notifyMentorshipAccepted(
            mentorship.menteeId,
            mentorName,
            mentorship.id
          );
        } catch (notifErr) {
          console.error("Failed to send mentorship accepted notification:", notifErr);
        }

        return NextResponse.json({ mentorship: updated });
      }

      case "decline": {
        if (!isMentor) {
          return NextResponse.json({ error: "Only the mentor can decline" }, { status: 403 });
        }
        if (mentorship.status !== "REQUESTED") {
          return NextResponse.json({ error: "Can only decline requested mentorships" }, { status: 400 });
        }
        const updated = await prisma.cadreMentorship.update({
          where: { id },
          data: { status: "DECLINED" },
        });
        return NextResponse.json({ mentorship: updated });
      }

      case "complete": {
        if (!isMentor) {
          return NextResponse.json({ error: "Only the mentor can mark as complete" }, { status: 403 });
        }
        if (mentorship.status !== "ACTIVE") {
          return NextResponse.json({ error: "Can only complete active mentorships" }, { status: 400 });
        }
        const updated = await prisma.$transaction(async (tx) => {
          const m = await tx.cadreMentorship.update({
            where: { id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
          await tx.cadreMentorProfile.update({
            where: { id: mentorship.mentorProfileId },
            data: {
              currentMenteeCount: { decrement: 1 },
              totalMentorships: { increment: 1 },
            },
          });
          return m;
        });
        return NextResponse.json({ mentorship: updated });
      }

      case "cancel": {
        if (mentorship.status !== "REQUESTED" && mentorship.status !== "ACTIVE") {
          return NextResponse.json({ error: "Cannot cancel this mentorship" }, { status: 400 });
        }
        const wasActive = mentorship.status === "ACTIVE";
        const updated = await prisma.$transaction(async (tx) => {
          const m = await tx.cadreMentorship.update({
            where: { id },
            data: { status: "CANCELLED" },
          });
          if (wasActive) {
            await tx.cadreMentorProfile.update({
              where: { id: mentorship.mentorProfileId },
              data: { currentMenteeCount: { decrement: 1 } },
            });
          }
          return m;
        });
        return NextResponse.json({ mentorship: updated });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Update mentorship error:", error);
    return NextResponse.json({ error: "Failed to update mentorship" }, { status: 500 });
  }
});
