import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";

// POST: Submit a facility review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Please sign in to submit a review" }, { status: 401 });
    }

    // Only verified professionals can review
    if (session.accountStatus !== "VERIFIED") {
      return NextResponse.json(
        { error: "You must be CadreHealth Verified to submit reviews. Add your license details to get verified." },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const facility = await prisma.cadreFacility.findUnique({ where: { slug } });
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    // Check for existing review
    const existing = await prisma.cadreFacilityReview.findUnique({
      where: {
        professionalId_facilityId: {
          professionalId: session.sub,
          facilityId: facility.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this facility" },
        { status: 409 }
      );
    }

    const body = await req.json();

    const review = await prisma.cadreFacilityReview.create({
      data: {
        professionalId: session.sub,
        facilityId: facility.id,
        overallRating: body.overallRating,
        compensationRating: body.compensationRating || null,
        payTimelinessRating: body.payTimelinessRating || null,
        workloadRating: body.workloadRating || null,
        equipmentRating: body.equipmentRating || null,
        managementRating: body.managementRating || null,
        safetyRating: body.safetyRating || null,
        trainingRating: body.trainingRating || null,
        accommodationRating: body.accommodationRating || null,
        pros: body.pros || null,
        cons: body.cons || null,
        advice: body.advice || null,
        wouldRecommend: body.wouldRecommend ?? null,
        roleAtFacility: body.roleAtFacility || null,
        cadreAtFacility: body.cadreAtFacility || null,
        employmentType: body.employmentType || null,
        workedFromYear: body.workedFromYear || null,
        workedToYear: body.workedToYear || null,
        isCurrentEmployee: body.isCurrentEmployee || false,
      },
    });

    // Recompute facility aggregate ratings
    const allReviews = await prisma.cadreFacilityReview.findMany({
      where: { facilityId: facility.id, isApproved: true },
      select: {
        overallRating: true,
        compensationRating: true,
        payTimelinessRating: true,
        workloadRating: true,
        equipmentRating: true,
        managementRating: true,
        safetyRating: true,
        trainingRating: true,
        accommodationRating: true,
        wouldRecommend: true,
      },
    });

    const avg = (arr: (number | null)[]) => {
      const nums = arr.filter((n): n is number => n !== null);
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    };

    const recommendCount = allReviews.filter((r) => r.wouldRecommend === true).length;
    const recommendTotal = allReviews.filter((r) => r.wouldRecommend !== null).length;

    await prisma.cadreFacility.update({
      where: { id: facility.id },
      data: {
        overallRating: avg(allReviews.map((r) => r.overallRating)),
        compensationRating: avg(allReviews.map((r) => r.compensationRating)),
        payTimelinessRating: avg(allReviews.map((r) => r.payTimelinessRating)),
        workloadRating: avg(allReviews.map((r) => r.workloadRating)),
        equipmentRating: avg(allReviews.map((r) => r.equipmentRating)),
        managementRating: avg(allReviews.map((r) => r.managementRating)),
        safetyRating: avg(allReviews.map((r) => r.safetyRating)),
        trainingRating: avg(allReviews.map((r) => r.trainingRating)),
        accommodationRating: avg(allReviews.map((r) => r.accommodationRating)),
        totalReviews: allReviews.length,
        wouldRecommendPct: recommendTotal > 0 ? (recommendCount / recommendTotal) * 100 : null,
      },
    });

    return NextResponse.json({ id: review.id });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
