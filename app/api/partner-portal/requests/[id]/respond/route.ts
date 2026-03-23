import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPartnerPortalSession } from "@/lib/partnerPortalAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPartnerPortalSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: requestId } = await params;

  // Verify request belongs to this partner
  const request = await prisma.partnerStaffingRequest.findFirst({
    where: {
      id: requestId,
      partnerId: session.partnerId,
    },
    include: {
      deployments: {
        select: { id: true, status: true },
      },
    },
  });

  if (!request) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (request.status !== "SHORTLIST_SENT") {
    return new NextResponse("This request is not awaiting your response", { status: 400 });
  }

  let body: {
    deploymentId?: string;
    action?: "ACCEPT" | "DECLINE";
    declineReason?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!body.deploymentId || !body.action) {
    return new NextResponse("deploymentId and action are required", { status: 400 });
  }

  if (!["ACCEPT", "DECLINE"].includes(body.action)) {
    return new NextResponse("action must be ACCEPT or DECLINE", { status: 400 });
  }

  // Verify deployment belongs to this request
  const deployment = request.deployments.find((d) => d.id === body.deploymentId);
  if (!deployment) {
    return new NextResponse("Deployment not found for this request", { status: 404 });
  }

  if (deployment.status !== "PROPOSED") {
    return new NextResponse("This deployment has already been responded to", { status: 400 });
  }

  // Update deployment
  if (body.action === "ACCEPT") {
    await prisma.partnerDeployment.update({
      where: { id: body.deploymentId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
  } else {
    await prisma.partnerDeployment.update({
      where: { id: body.deploymentId },
      data: {
        status: "DECLINED",
        declinedReason: body.declineReason || null,
      },
    });
  }

  // Check if all deployments have been responded to
  const updatedDeployments = await prisma.partnerDeployment.findMany({
    where: { requestId },
    select: { status: true },
  });

  const allResponded = updatedDeployments.every(
    (d) => d.status !== "PROPOSED"
  );

  if (allResponded) {
    await prisma.partnerStaffingRequest.update({
      where: { id: requestId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}
