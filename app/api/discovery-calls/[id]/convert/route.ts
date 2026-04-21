import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * POST /api/discovery-calls/[id]/convert
 * Convert a discovery call into a Client + Project.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Only Directors, Partners, and Admins can convert discovery calls" }, { status: 403 });
  }

  const { id } = await params;

  const call = await prisma.discoveryCall.findUnique({ where: { id } });
  if (!call) return Response.json({ error: "Not found" }, { status: 404 });

  if (call.convertedToClientId) {
    return Response.json({ error: "This discovery call has already been converted", clientId: call.convertedToClientId }, { status: 409 });
  }

  const body = await req.json();
  const {
    // Client overrides (can adjust before creating)
    clientName,
    clientType,
    primaryContact,
    email,
    phone,
    address,
    // Project details
    projectName,
    serviceType,
    engagementManagerId,
    budgetAmount,
    description,
  } = body;

  const finalClientName = clientName?.trim() || call.organizationName;
  const finalContact = primaryContact?.trim() || call.contactName;
  const finalEmail = email?.trim() || call.contactEmail || "";
  const finalPhone = phone?.trim() || call.contactPhone || "";

  if (!finalEmail) {
    return Response.json({ error: "Client email is required" }, { status: 400 });
  }

  // Map organizationType to ClientType
  const typeMap: Record<string, string> = {
    private_hospital: "PRIVATE_ELITE",
    hospital_group: "PRIVATE_ELITE",
    government: "GOVERNMENT",
    ngo: "DEVELOPMENT",
    startup: "STARTUP",
    sme: "SME",
  };

  const finalType = clientType || typeMap[call.organizationType ?? ""] || "PRIVATE_MIDTIER";

  // Create client
  const client = await prisma.client.create({
    data: {
      name: finalClientName,
      type: finalType,
      primaryContact: finalContact,
      email: finalEmail,
      phone: finalPhone,
      address: address?.trim() || "TBD",
      notes: call.aiSummary
        ? `Converted from discovery call.\n\n${call.aiSummary}`
        : `Converted from discovery call on ${new Date().toLocaleDateString("en-GB")}.`,
    },
  });

  // Create project if service type provided
  let project = null;
  if (serviceType || (call.aiServiceLineMatch.length > 0)) {
    const serviceLineToType: Record<string, string> = {
      "Hospital Turnaround & Financial Recovery": "TURNAROUND",
      "Strategy, Growth & Commercial Performance": "HOSPITAL_OPERATIONS",
      "Clinical Governance & Accreditation": "CLINICAL_GOVERNANCE",
      "Digital Health & Technology Leadership": "DIGITAL_HEALTH",
      "Fractional Leadership & Executive Secondments": "EMBEDDED_LEADERSHIP",
      "Health Systems & Public Sector Advisory": "HEALTH_SYSTEMS",
      "Healthcare HR Management (Maarova)": "HOSPITAL_OPERATIONS",
    };

    const finalServiceType = serviceType
      || serviceLineToType[call.aiServiceLineMatch[0]] || "HOSPITAL_OPERATIONS";

    // Build description from discovery call data
    const descParts = [];
    if (description) descParts.push(description);
    if (call.problemsIdentified.length > 0) {
      descParts.push(`Key problems identified:\n${call.problemsIdentified.map((p) => `- ${p}`).join("\n")}`);
    }
    if (call.goalsStated.length > 0) {
      descParts.push(`Client goals:\n${call.goalsStated.map((g) => `- ${g}`).join("\n")}`);
    }
    if (call.aiSuggestedScope) {
      descParts.push(`Suggested scope:\n${call.aiSuggestedScope}`);
    }

    project = await prisma.engagement.create({
      data: {
        clientId: client.id,
        engagementManagerId: engagementManagerId || session.user.id,
        name: projectName?.trim() || `${finalClientName} Engagement`,
        description: descParts.join("\n\n") || "",
        serviceType: finalServiceType,
        status: "PLANNING",
        budgetAmount: budgetAmount ? parseFloat(String(budgetAmount)) : 0,
        budgetCurrency: "NGN",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Update discovery call with conversion info
  await prisma.discoveryCall.update({
    where: { id },
    data: {
      convertedToClientId: client.id,
      status: "COMPLETED",
    },
  });

  return Response.json({
    client: { id: client.id, name: client.name },
    project: project ? { id: project.id, name: project.name } : null,
  }, { status: 201 });
});
