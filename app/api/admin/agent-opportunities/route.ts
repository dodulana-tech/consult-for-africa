import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateOpportunityCode } from "@/lib/agentCodes";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title, description, productType, serviceCategory, clientId, clientName,
    engagementId, trackId, territories, targetIndustries, targetDescription,
    commissionType, commissionValue, commissionCurrency, commissionTiers, recurringMonths,
    expectedDealValueMin, expectedDealValueMax, startDate, endDate, maxAgents,
    pitchDeckUrl, briefingDocUrl, notes, status,
  } = body;

  if (!title?.trim() || !description?.trim() || !productType?.trim() || !clientName?.trim() || !commissionType || commissionValue == null || !startDate) {
    return Response.json({ error: "Title, description, product type, client name, commission, and start date are required." }, { status: 400 });
  }

  const opportunityCode = await generateOpportunityCode();

  const opportunity = await prisma.agentOpportunity.create({
    data: {
      opportunityCode,
      title: title.trim(),
      description: description.trim(),
      productType: productType.trim(),
      serviceCategory: serviceCategory?.trim() || null,
      clientId: clientId || null,
      clientName: clientName.trim(),
      engagementId: engagementId || null,
      trackId: trackId || null,
      territories: Array.isArray(territories) ? territories : [],
      targetIndustries: Array.isArray(targetIndustries) ? targetIndustries : [],
      targetDescription: targetDescription?.trim() || null,
      commissionType,
      commissionValue: parseFloat(commissionValue),
      commissionCurrency: commissionCurrency || "NGN",
      commissionTiers: commissionTiers || null,
      recurringMonths: recurringMonths ? parseInt(recurringMonths) : null,
      expectedDealValueMin: expectedDealValueMin ? parseFloat(expectedDealValueMin) : null,
      expectedDealValueMax: expectedDealValueMax ? parseFloat(expectedDealValueMax) : null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      maxAgents: maxAgents ? parseInt(maxAgents) : null,
      pitchDeckUrl: pitchDeckUrl || null,
      briefingDocUrl: briefingDocUrl || null,
      notes: notes?.trim() || null,
      status: status || "DRAFT",
      createdById: session.user.id,
    },
  });

  return Response.json(opportunity);
});
