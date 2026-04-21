import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import { handler } from "@/lib/api-handler";

// GET: Facility detail with reviews (give-to-get)
export const GET = handler(async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getCadreSession();

    const facility = await prisma.cadreFacility.findUnique({
      where: { slug },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            overallRating: true,
            compensationRating: true,
            payTimelinessRating: true,
            workloadRating: true,
            equipmentRating: true,
            managementRating: true,
            safetyRating: true,
            trainingRating: true,
            accommodationRating: true,
            pros: true,
            cons: true,
            advice: true,
            wouldRecommend: true,
            cadreAtFacility: true,
            employmentType: true,
            workedFromYear: true,
            workedToYear: true,
            isCurrentEmployee: true,
            helpfulCount: true,
            createdAt: true,
            // Never expose professionalId - reviews are anonymous
          },
        },
        _count: {
          select: { reviews: true, salaryReports: true },
        },
      },
    });

    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    // Give-to-get: check if user has submitted a review anywhere
    let hasContributed = false;
    if (session) {
      const reviewCount = await prisma.cadreFacilityReview.count({
        where: { professionalId: session.sub },
      });
      hasContributed = reviewCount > 0;
    }

    // If not contributed, blur review text but show ratings
    const reviews = facility.reviews.map((r) => ({
      ...r,
      pros: hasContributed ? r.pros : null,
      cons: hasContributed ? r.cons : null,
      advice: hasContributed ? r.advice : null,
    }));

    return NextResponse.json({
      facility: {
        ...facility,
        reviews,
      },
      hasContributed,
      isLoggedIn: !!session,
    });
  } catch (error) {
    console.error("Facility detail error:", error);
    return NextResponse.json({ error: "Failed to load facility" }, { status: 500 });
  }
});
