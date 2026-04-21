import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const {
    status,
    title,
    description,
    productType,
    serviceCategory,
    clientName,
    commissionType,
    commissionValue,
    commissionTiers,
    territories,
    targetIndustries,
    targetDescription,
    expectedDealValueMin,
    expectedDealValueMax,
    startDate,
    endDate,
    maxAgents,
    notes,
    pitchDeckUrl,
    briefingDocUrl,
  } = body;

  const data: Record<string, unknown> = {};

  if (status !== undefined) data.status = status;
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (productType !== undefined) data.productType = productType;
  if (serviceCategory !== undefined) data.serviceCategory = serviceCategory;
  if (clientName !== undefined) data.clientName = clientName;
  if (commissionType !== undefined) data.commissionType = commissionType;
  if (commissionValue !== undefined) data.commissionValue = parseFloat(commissionValue);
  if (commissionTiers !== undefined) data.commissionTiers = commissionTiers;
  if (territories !== undefined) data.territories = territories;
  if (targetIndustries !== undefined) data.targetIndustries = targetIndustries;
  if (targetDescription !== undefined) data.targetDescription = targetDescription;
  if (expectedDealValueMin !== undefined) {
    data.expectedDealValueMin = expectedDealValueMin ? parseFloat(expectedDealValueMin) : null;
  }
  if (expectedDealValueMax !== undefined) {
    data.expectedDealValueMax = expectedDealValueMax ? parseFloat(expectedDealValueMax) : null;
  }
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (maxAgents !== undefined) data.maxAgents = maxAgents ? parseInt(maxAgents) : null;
  if (notes !== undefined) data.notes = notes;
  if (pitchDeckUrl !== undefined) data.pitchDeckUrl = pitchDeckUrl;
  if (briefingDocUrl !== undefined) data.briefingDocUrl = briefingDocUrl;

  const updated = await prisma.agentOpportunity.update({
    where: { id },
    data,
  });

  return Response.json(updated);
});
