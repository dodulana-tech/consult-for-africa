import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getCadreSession();

    const assessment = await prisma.cadreReadinessAssessment.create({
      data: {
        professionalId: session?.sub || null,
        cadre: body.cadre,
        yearsOfExperience: body.yearsOfExperience,
        hasFullRegistration: body.hasFullRegistration,
        hasPracticingLicense: body.hasPracticingLicense,
        hasCOGS: body.hasCOGS,
        postgraduateLevel: body.postgraduateLevel || null,
        ieltsScore: body.ieltsScore ? parseFloat(body.ieltsScore) : null,
        oetPassed: body.oetPassed || null,
        plab1Passed: body.plab1Passed || null,
        plab2Passed: body.plab2Passed || null,
        usmlePassed: body.usmlePassed || null,
        cpdPointsCurrent: body.cpdPointsCurrent || null,
        cpdPointsRequired: body.cpdPointsRequired || null,
        additionalCerts: body.additionalCerts || [],
        domesticScore: body.scores.domestic,
        ukScore: body.scores.uk,
        usScore: body.scores.us,
        canadaScore: body.scores.canada,
        gulfScore: body.scores.gulf,
        gapAnalysis: body.scores.gaps,
        captureFirstName: body.capture?.firstName || null,
        captureLastName: body.capture?.lastName || null,
        captureEmail: body.capture?.email || null,
        capturePhone: body.capture?.phone || null,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      },
    });

    // Update professional's cached readiness scores if logged in
    if (session?.sub) {
      await prisma.cadreProfessional.update({
        where: { id: session.sub },
        data: {
          readinessScoreDomestic: body.scores.domestic,
          readinessScoreUK: body.scores.uk,
          readinessScoreUS: body.scores.us,
          readinessScoreCanada: body.scores.canada,
          readinessScoreGulf: body.scores.gulf,
          readinessComputedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ id: assessment.id });
  } catch (error) {
    console.error("Readiness assessment save error:", error);
    return NextResponse.json(
      { error: "Failed to save assessment" },
      { status: 500 }
    );
  }
});
