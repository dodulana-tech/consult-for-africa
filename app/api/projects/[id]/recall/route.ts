import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailSecondmentRecall } from "@/lib/email";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const DIRECTOR_PLUS = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * POST /api/projects/[id]/recall
 * Initiate recall for a SECONDMENT engagement.
 * Director+ only.
 */
export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!DIRECTOR_PLUS.includes(session.user.role)) {
    return Response.json({ error: "Only Directors and above can initiate a secondment recall" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const { reason, effectiveDate } = body as { reason?: string; effectiveDate?: string };

  if (!reason || !effectiveDate) {
    return Response.json({ error: "reason and effectiveDate are required" }, { status: 400 });
  }

  // Validate date format
  const parsedDate = new Date(effectiveDate);
  if (isNaN(parsedDate.getTime())) {
    return Response.json({ error: "Invalid effectiveDate format" }, { status: 400 });
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, name: true, email: true, primaryContact: true },
      },
    },
  });

  if (!engagement) {
    return Response.json({ error: "Engagement not found" }, { status: 404 });
  }

  if (engagement.engagementType !== "SECONDMENT") {
    return Response.json({ error: "Recall is only available for SECONDMENT engagements" }, { status: 400 });
  }

  if (engagement.status !== "ACTIVE") {
    return Response.json({ error: "Only ACTIVE secondments can be recalled" }, { status: 400 });
  }

  // a) Update engagement status to ON_HOLD
  await prisma.engagement.update({
    where: { id },
    data: { status: "ON_HOLD" },
  });

  // b) Find the secondee's assignment and pause it
  let secondeeUser = null;

  if (engagement.secondeeId) {
    // Look up the secondee user directly
    secondeeUser = await prisma.user.findUnique({
      where: { id: engagement.secondeeId },
      select: { id: true, name: true, email: true },
    });

    // Also pause any active assignment for this secondee
    await prisma.assignment.updateMany({
      where: {
        engagementId: id,
        consultantId: engagement.secondeeId,
        status: "ACTIVE",
      },
      data: { status: "PAUSED" },
    });
  }

  // If no secondee found via secondeeId, find from assignments
  if (!secondeeUser) {
    const assignment = await prisma.assignment.findFirst({
      where: { engagementId: id, status: "ACTIVE" },
      include: { consultant: { select: { id: true, name: true, email: true } } },
    });

    if (assignment) {
      secondeeUser = assignment.consultant;
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: "PAUSED" },
      });
    }
  }

  const formattedDate = parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // c) Send notification email to the secondee
  if (secondeeUser) {
    emailSecondmentRecall({
      recipientEmail: secondeeUser.email,
      recipientName: secondeeUser.name ?? "Consultant",
      engagementName: engagement.name,
      reason,
      effectiveDate: formattedDate,
      isClient: false,
    }).catch((err) => console.error("[email] Secondment recall notification to secondee failed:", err));
  }

  // d) Send notification email to client contact
  if (engagement.client?.email) {
    emailSecondmentRecall({
      recipientEmail: engagement.client.email,
      recipientName: engagement.client.primaryContact ?? engagement.client.name,
      engagementName: engagement.name,
      reason,
      effectiveDate: formattedDate,
      isClient: true,
    }).catch((err) => console.error("[email] Secondment recall notification to client failed:", err));
  }

  // e) Create an EngagementUpdate record
  await prisma.engagementUpdate.create({
    data: {
      engagementId: id,
      createdById: session.user.id,
      type: "GENERAL",
      content: `Secondment recall initiated. Reason: ${reason}. Effective date: ${formattedDate}. Engagement placed on hold.`,
    },
  });

  // f) Return success with recall details
  return Response.json({
    success: true,
    recall: {
      engagementId: id,
      engagementName: engagement.name,
      status: "ON_HOLD",
      reason,
      effectiveDate: formattedDate,
      secondee: secondeeUser
        ? { id: secondeeUser.id, name: secondeeUser.name, email: secondeeUser.email }
        : null,
      client: engagement.client
        ? { id: engagement.client.id, name: engagement.client.name }
        : null,
      initiatedBy: session.user.id,
    },
  });
});
