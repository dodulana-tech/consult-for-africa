import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return new Response("Forbidden", { status: 403 });

  const { id: requestId } = await params;
  const body = await req.json();
  const { consultantIds, billingRatePerDay } = body;

  if (!Array.isArray(consultantIds) || consultantIds.length === 0) {
    return new Response("consultantIds array is required", { status: 400 });
  }

  // Load the staffing request and its partner
  const request = await prisma.partnerStaffingRequest.findUnique({
    where: { id: requestId },
    include: {
      partner: { select: { id: true, name: true, defaultMarkupPct: true } },
    },
  });
  if (!request) return new Response("Staffing request not found", { status: 404 });

  const markupPct = request.partner.defaultMarkupPct
    ? Number(request.partner.defaultMarkupPct)
    : 20; // default 20% markup

  const deployments = [];

  for (const consultantId of consultantIds) {
    // Look up the consultant profile
    const profile = await prisma.consultantProfile.findUnique({
      where: { userId: consultantId },
      include: { user: { select: { name: true } } },
    });

    if (!profile) {
      return new Response(
        `Consultant profile not found for user ${consultantId}`,
        { status: 404 }
      );
    }

    // Calculate rate: use hourlyRateUSD * 8 as daily rate, or monthlyRateNGN / 22
    let consultantDailyRate: number;
    if (profile.hourlyRateUSD) {
      consultantDailyRate = Number(profile.hourlyRateUSD) * 8;
    } else if (profile.monthlyRateNGN) {
      consultantDailyRate = Number(profile.monthlyRateNGN) / 22;
    } else {
      consultantDailyRate = 0;
    }

    const finalBillingRate = billingRatePerDay
      ? Number(billingRatePerDay)
      : consultantDailyRate * (1 + markupPct / 100);

    // Build anonymised profile
    const anonymisedProfile = {
      tier: profile.tier,
      yearsExperience: profile.yearsExperience,
      expertiseAreas: profile.expertiseAreas,
      bioSnippet: profile.bio ? profile.bio.substring(0, 100) : "",
    };

    const deployment = await prisma.partnerDeployment.create({
      data: {
        requestId,
        consultantId,
        role: request.projectName,
        ratePerDay: new Decimal(consultantDailyRate.toFixed(2)),
        billingRatePerDay: new Decimal(finalBillingRate.toFixed(2)),
        rateCurrency: request.budgetCurrency,
        startDate: request.startDate,
        hoursPerWeek: request.hoursPerWeek,
        anonymisedProfile,
        status: "PROPOSED",
      },
    });

    deployments.push({
      ...deployment,
      ratePerDay: Number(deployment.ratePerDay),
      billingRatePerDay: Number(deployment.billingRatePerDay),
      proposedAt: deployment.proposedAt.toISOString(),
      createdAt: deployment.createdAt.toISOString(),
      updatedAt: deployment.updatedAt.toISOString(),
      startDate: deployment.startDate?.toISOString() ?? null,
      endDate: deployment.endDate?.toISOString() ?? null,
      acceptedAt: null,
      completedAt: null,
    });
  }

  // Update request status to SHORTLIST_SENT
  await prisma.partnerStaffingRequest.update({
    where: { id: requestId },
    data: {
      status: "SHORTLIST_SENT",
      matchedAt: new Date(),
      cfaReviewedById: session.user.id,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PartnerStaffingRequest",
    entityId: requestId,
    entityName: request.projectName,
    details: {
      action: "match-consultants",
      consultantCount: consultantIds.length,
      partnerName: request.partner.name,
    },
  });

  return Response.json({
    ok: true,
    deployments,
    requestStatus: "SHORTLIST_SENT",
  });
});
