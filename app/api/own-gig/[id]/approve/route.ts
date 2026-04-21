import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  emailOwnGigApproved,
  emailOwnGigRejected,
  emailOwnGigChangesRequested,
} from "@/lib/email";
import { handler } from "@/lib/api-handler";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Only directors, partners, and admins can review own gigs" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, note } = body as { action: string; note?: string };

  if (!["approve", "reject", "request_changes"].includes(action)) {
    return Response.json({ error: "action must be approve, reject, or request_changes" }, { status: 400 });
  }

  if (action === "reject" && !note) {
    return Response.json({ error: "A note is required when rejecting an own gig" }, { status: 400 });
  }

  const gig = await prisma.engagement.findUnique({
    where: { id },
    include: {
      ownGigOwner: { select: { id: true, name: true, email: true } },
      client: { select: { name: true } },
    },
  });

  if (!gig || !gig.isOwnGig) {
    return Response.json({ error: "Own gig not found" }, { status: 404 });
  }

  if (gig.ownGigApprovalStatus !== "PENDING" && gig.ownGigApprovalStatus !== "NEEDS_CHANGES") {
    return Response.json({ error: "This own gig has already been reviewed" }, { status: 400 });
  }

  const reviewData = {
    ownGigReviewedAt: new Date(),
    ownGigReviewedById: session.user.id,
    ownGigApprovalNote: note ?? null,
  };

  if (action === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.engagement.update({
        where: { id },
        data: {
          ...reviewData,
          ownGigApprovalStatus: "APPROVED",
          status: "PLANNING",
        },
      });

      // Create the assignment for the consultant
      await tx.assignment.create({
        data: {
          engagementId: id,
          consultantId: gig.ownGigOwnerId!,
          role: "Lead Consultant",
          responsibilities: "Own gig lead -- full project delivery",
          status: "ACTIVE",
          startDate: gig.startDate ?? new Date(),
          rateAmount: 0,
          rateCurrency: gig.budgetCurrency ?? "NGN",
          rateType: "FIXED_PROJECT",
        },
      });
    });

    try {
      if (gig.ownGigOwner?.email) {
        await emailOwnGigApproved({
          consultantEmail: gig.ownGigOwner.email,
          consultantName: gig.ownGigOwner.name ?? "Consultant",
          projectName: gig.name,
          clientName: gig.client.name,
          engagementId: id,
          note: note ?? undefined,
        });
      }
    } catch (err) {
      console.error("[own-gig-approve] Failed to send approval email:", err);
    }

    return Response.json({ status: "approved" });
  }

  if (action === "reject") {
    await prisma.engagement.update({
      where: { id },
      data: {
        ...reviewData,
        ownGigApprovalStatus: "REJECTED",
      },
    });

    try {
      if (gig.ownGigOwner?.email) {
        await emailOwnGigRejected({
          consultantEmail: gig.ownGigOwner.email,
          consultantName: gig.ownGigOwner.name ?? "Consultant",
          projectName: gig.name,
          clientName: gig.client.name,
          note: note!,
        });
      }
    } catch (err) {
      console.error("[own-gig-approve] Failed to send rejection email:", err);
    }

    return Response.json({ status: "rejected" });
  }

  // request_changes
  await prisma.engagement.update({
    where: { id },
    data: {
      ...reviewData,
      ownGigApprovalStatus: "NEEDS_CHANGES",
    },
  });

  try {
    if (gig.ownGigOwner?.email) {
      await emailOwnGigChangesRequested({
        consultantEmail: gig.ownGigOwner.email,
        consultantName: gig.ownGigOwner.name ?? "Consultant",
        projectName: gig.name,
        clientName: gig.client.name,
        note: note ?? "",
        engagementId: id,
      });
    }
  } catch (err) {
    console.error("[own-gig-approve] Failed to send changes-requested email:", err);
  }

  return Response.json({ status: "needs_changes" });
});
