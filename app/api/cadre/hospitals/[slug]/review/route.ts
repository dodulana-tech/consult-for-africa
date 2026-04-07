import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import { notifyNewReview } from "@/lib/cadreHealth/notifications";

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

        // Core ratings (original 8 + overall)
        overallRating: body.overallRating,
        compensationRating: body.compensationRating || null,
        payTimelinessRating: body.payTimelinessRating || null,
        workloadRating: body.workloadRating || null,
        equipmentRating: body.equipmentRating || null,
        managementRating: body.managementRating || null,
        safetyRating: body.safetyRating || null,
        trainingRating: body.trainingRating || null,
        accommodationRating: body.accommodationRating || null,

        // Extended dimension ratings (v2)
        interCadreRating: body.interCadreRating || null,
        fairnessRating: body.fairnessRating || null,
        harassmentRating: body.harassmentRating || null,
        worklifeRating: body.worklifeRating || null,
        clinicalGovernanceRating: body.clinicalGovernanceRating || null,
        integrityRating: body.integrityRating || null,

        // Detailed sub-question responses (JSON)
        detailedResponses: body.detailedResponses || null,

        // Binary questions
        paidOnTime: body.paidOnTime ?? null,
        salaryDelayMonths: body.salaryDelayMonths || null,
        witnessedInterCadreBullying: body.witnessedInterCadreBullying ?? null,
        witnessedEthnicDiscrimination: body.witnessedEthnicDiscrimination ?? null,
        witnessedReligiousDiscrimination: body.witnessedReligiousDiscrimination ?? null,
        witnessedGenderDiscrimination: body.witnessedGenderDiscrimination ?? null,
        witnessedSexualHarassment: body.witnessedSexualHarassment ?? null,
        witnessedVerbalAbuse: body.witnessedVerbalAbuse ?? null,
        callDuration: body.callDuration || null,
        getPostCallOff: body.getPostCallOff || null,
        wouldBringFamilyHere: body.wouldBringFamilyHere || null,
        wouldRecommendToPatient: body.wouldRecommendToPatient || null,
        situationTrend: body.situationTrend || null,
        bestThing: body.bestThing || null,
        worstThing: body.worstThing || null,

        // Review completeness
        isDetailedReview: body.isDetailedReview || false,

        // Content
        pros: body.pros || null,
        cons: body.cons || null,
        advice: body.advice || null,
        wouldRecommend: body.wouldRecommend ?? null,

        // Context
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
        interCadreRating: true,
        fairnessRating: true,
        harassmentRating: true,
        worklifeRating: true,
        clinicalGovernanceRating: true,
        integrityRating: true,
        wouldRecommend: true,
        paidOnTime: true,
        witnessedInterCadreBullying: true,
        wouldBringFamilyHere: true,
        situationTrend: true,
      },
    });

    const avg = (arr: (number | null)[]) => {
      const nums = arr.filter((n): n is number => n !== null);
      return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    };

    const boolPct = (arr: (boolean | null)[], targetValue: boolean) => {
      const answered = arr.filter((v): v is boolean => v !== null);
      if (answered.length === 0) return null;
      return (answered.filter((v) => v === targetValue).length / answered.length) * 100;
    };

    const choicePct = (arr: (string | null)[], targetValues: string[]) => {
      const answered = arr.filter((v): v is string => v !== null);
      if (answered.length === 0) return null;
      return (answered.filter((v) => targetValues.includes(v)).length / answered.length) * 100;
    };

    const recommendCount = allReviews.filter((r) => r.wouldRecommend === true).length;
    const recommendTotal = allReviews.filter((r) => r.wouldRecommend !== null).length;

    await prisma.cadreFacility.update({
      where: { id: facility.id },
      data: {
        // Original aggregate ratings
        overallRating: avg(allReviews.map((r) => r.overallRating)),
        compensationRating: avg(allReviews.map((r) => r.compensationRating)),
        payTimelinessRating: avg(allReviews.map((r) => r.payTimelinessRating)),
        workloadRating: avg(allReviews.map((r) => r.workloadRating)),
        equipmentRating: avg(allReviews.map((r) => r.equipmentRating)),
        managementRating: avg(allReviews.map((r) => r.managementRating)),
        safetyRating: avg(allReviews.map((r) => r.safetyRating)),
        trainingRating: avg(allReviews.map((r) => r.trainingRating)),
        accommodationRating: avg(allReviews.map((r) => r.accommodationRating)),

        // Extended aggregate ratings (v2)
        interCadreRating: avg(allReviews.map((r) => r.interCadreRating)),
        fairnessRating: avg(allReviews.map((r) => r.fairnessRating)),
        harassmentRating: avg(allReviews.map((r) => r.harassmentRating)),
        worklifeRating: avg(allReviews.map((r) => r.worklifeRating)),
        clinicalGovernanceRating: avg(allReviews.map((r) => r.clinicalGovernanceRating)),
        integrityRating: avg(allReviews.map((r) => r.integrityRating)),

        // Binary aggregates
        paidOnTimePct: boolPct(allReviews.map((r) => r.paidOnTime), true),
        witnessedBullyingPct: boolPct(allReviews.map((r) => r.witnessedInterCadreBullying), true),
        wouldBringFamilyPct: choicePct(allReviews.map((r) => r.wouldBringFamilyHere), ["YES"]),
        situationImprovingPct: choicePct(allReviews.map((r) => r.situationTrend), ["IMPROVING"]),

        totalReviews: allReviews.length,
        wouldRecommendPct: recommendTotal > 0 ? (recommendCount / recommendTotal) * 100 : null,
      },
    });

    // Notify professionals who list this facility as their current workplace
    try {
      const staffAtFacility = await prisma.cadreProfessional.findMany({
        where: {
          currentFacilityId: facility.id,
          id: { not: session.sub }, // Don't notify the reviewer themselves
        },
        select: { id: true },
      });
      await Promise.allSettled(
        staffAtFacility.map((p) =>
          notifyNewReview(p.id, facility.name, facility.slug)
        )
      );
    } catch (notifErr) {
      console.error("Failed to send new review notifications:", notifErr);
    }

    return NextResponse.json({ id: review.id });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
