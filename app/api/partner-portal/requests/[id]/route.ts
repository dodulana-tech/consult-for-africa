import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPartnerPortalSession } from "@/lib/partnerPortalAuth";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPartnerPortalSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const request = await prisma.partnerStaffingRequest.findFirst({
    where: {
      id,
      partnerId: session.partnerId,
    },
    include: {
      deployments: true,
    },
  });

  if (!request) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Anonymise consultant data if status is before CONFIRMED
  const isPreConfirm = ["DRAFT", "SUBMITTED", "MATCHING", "SHORTLIST_SENT"].includes(
    request.status
  );

  const deployments = request.deployments.map((dep) => {
    if (isPreConfirm) {
      // Strip identifying consultant data, keep anonymised profile
      return {
        id: dep.id,
        requestId: dep.requestId,
        role: dep.role,
        status: dep.status,
        anonymisedProfile: dep.anonymisedProfile,
        startDate: dep.startDate,
        endDate: dep.endDate,
        hoursPerWeek: dep.hoursPerWeek,
        proposedAt: dep.proposedAt,
        // Omit consultantId, ratePerDay, billingRatePerDay
      };
    }
    return {
      id: dep.id,
      requestId: dep.requestId,
      consultantId: dep.consultantId,
      role: dep.role,
      status: dep.status,
      anonymisedProfile: dep.anonymisedProfile,
      startDate: dep.startDate,
      endDate: dep.endDate,
      hoursPerWeek: dep.hoursPerWeek,
      proposedAt: dep.proposedAt,
      acceptedAt: dep.acceptedAt,
      completedAt: dep.completedAt,
      partnerRating: dep.partnerRating,
      // Still omit internal rates
    };
  });

  return NextResponse.json({
    ...request,
    deployments,
  });
});
