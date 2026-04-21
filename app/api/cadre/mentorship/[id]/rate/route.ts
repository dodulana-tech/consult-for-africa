import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
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
    const { rating, feedback } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const mentorship = await prisma.cadreMentorship.findUnique({
      where: { id },
      include: { mentorProfile: true },
    });

    if (!mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }

    // Only mentee can rate
    if (mentorship.menteeId !== session.sub) {
      return NextResponse.json({ error: "Only the mentee can rate" }, { status: 403 });
    }

    // Must be completed
    if (mentorship.status !== "COMPLETED") {
      return NextResponse.json({ error: "Can only rate completed mentorships" }, { status: 400 });
    }

    // Cannot rate twice
    if (mentorship.rating !== null) {
      return NextResponse.json({ error: "Already rated" }, { status: 409 });
    }

    // Update mentorship rating and recalculate mentor average
    await prisma.$transaction(async (tx) => {
      await tx.cadreMentorship.update({
        where: { id },
        data: {
          rating,
          feedback: feedback?.trim() || null,
        },
      });

      const profile = mentorship.mentorProfile;
      const newTotalRatings = profile.totalRatings + 1;
      const currentAvg = profile.averageRating
        ? Number(profile.averageRating)
        : 0;
      const newAvg =
        (currentAvg * profile.totalRatings + rating) / newTotalRatings;

      await tx.cadreMentorProfile.update({
        where: { id: mentorship.mentorProfileId },
        data: {
          totalRatings: newTotalRatings,
          averageRating: new Decimal(newAvg.toFixed(2)),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rate mentorship error:", error);
    return NextResponse.json({ error: "Failed to rate mentorship" }, { status: 500 });
  }
});
