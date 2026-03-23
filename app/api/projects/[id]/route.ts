import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { emailEMChanged } from "@/lib/email";
import { generateEngagementCode } from "@/lib/engagementCode";
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * PATCH /api/projects/[id]
 * Update project fields including EM reassignment.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const project = await prisma.engagement.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      engagementManagerId: true,
      engagementType: true,
      status: true,
      clientId: true,
      budgetCurrency: true,
      transactionDealSize: true,
      transactionSuccessFeePct: true,
    },
  });

  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  // Only EM of the project or elevated roles can update
  const isProjectEM = project.engagementManagerId === session.user.id;
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isProjectEM && !isElevated) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  // EM reassignment (Director+ only)
  if (body.engagementManagerId !== undefined) {
    if (!isElevated) {
      return Response.json({ error: "Only Directors and above can reassign Engagement Managers" }, { status: 403 });
    }

    const newEM = await prisma.user.findUnique({
      where: { id: body.engagementManagerId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!newEM) return Response.json({ error: "New EM not found" }, { status: 404 });

    const validEMRoles = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];
    if (!validEMRoles.includes(newEM.role)) {
      return Response.json({ error: "User must be an Engagement Manager or above" }, { status: 400 });
    }

    updateData.engagementManagerId = newEM.id;

    // Log the change
    await prisma.engagementUpdate.create({
      data: {
        engagementId: id,
        createdById: session.user.id,
        type: "TEAM_CHANGE",
        content: `Engagement Manager reassigned to ${newEM.name}.`,
      },
    });

    // Get old EM details for notification
    const oldEM = await prisma.user.findUnique({
      where: { id: project.engagementManagerId },
      select: { name: true, email: true },
    });

    // Send email notifications
    if (oldEM) {
      emailEMChanged({
        oldEMEmail: oldEM.email,
        oldEMName: oldEM.name,
        newEMEmail: newEM.email ?? "",
        newEMName: newEM.name,
        projectName: project.name,
        changedByName: session.user.name ?? "Admin",
      }).catch((err) => console.error("[email] EM change notification failed:", err));
    }
  }

  // Other updatable fields
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.description !== undefined) updateData.description = body.description.trim();
  if (body.status !== undefined) {
    const validStatuses = ["PLANNING", "ACTIVE", "ON_HOLD", "AT_RISK", "COMPLETED", "CANCELLED"];
    if (validStatuses.includes(body.status)) updateData.status = body.status;
  }
  if (body.riskLevel !== undefined) {
    const validRisks = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (validRisks.includes(body.riskLevel)) updateData.riskLevel = body.riskLevel;
  }
  if (body.healthScore !== undefined) {
    const score = Math.min(10, Math.max(1, parseInt(String(body.healthScore), 10)));
    if (!isNaN(score)) updateData.healthScore = score;
  }
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
  if (body.budgetSensitivity !== undefined) {
    const valid = ["PREMIUM", "STANDARD", "VALUE", "BUDGET"];
    if (valid.includes(body.budgetSensitivity) || body.budgetSensitivity === null) updateData.budgetSensitivity = body.budgetSensitivity;
  }
  if (body.budgetAmount !== undefined) {
    const amt = parseFloat(String(body.budgetAmount));
    if (!isNaN(amt) && amt >= 0) updateData.budgetAmount = amt;
  }
  if (body.budgetCurrency !== undefined) {
    if (["NGN", "USD"].includes(body.budgetCurrency)) updateData.budgetCurrency = body.budgetCurrency;
  }
  if (body.consultantTierMin !== undefined) updateData.consultantTierMin = body.consultantTierMin || null;
  if (body.consultantTierMax !== undefined) updateData.consultantTierMax = body.consultantTierMax || null;
  if (body.internEligible !== undefined) updateData.internEligible = !!body.internEligible;
  if (body.pricingNotes !== undefined) updateData.pricingNotes = body.pricingNotes?.trim() || null;

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.engagement.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      status: true,
      engagementManagerId: true,
      engagementType: true,
      transactionDealSize: true,
      transactionSuccessFeePct: true,
      transactionSuccessFeeAmount: true,
      clientId: true,
      budgetCurrency: true,
    },
  });

  // Transaction success fee calculation:
  // When a TRANSACTION engagement is marked COMPLETED and deal size + fee pct are set,
  // calculate the success fee and auto-create a DRAFT invoice.
  let successFeeInvoice = null;
  if (
    updated.engagementType === "TRANSACTION" &&
    updated.status === "COMPLETED" &&
    project.status !== "COMPLETED" && // only on transition to COMPLETED
    updated.transactionDealSize &&
    updated.transactionSuccessFeePct
  ) {
    const dealSize = new Decimal(updated.transactionDealSize.toString());
    const feePct = new Decimal(updated.transactionSuccessFeePct.toString());
    const successFeeAmount = dealSize.mul(feePct).div(100);

    // Store the calculated amount on the engagement
    await prisma.engagement.update({
      where: { id },
      data: { transactionSuccessFeeAmount: successFeeAmount },
    });

    // Generate invoice number
    const invoiceNumber = await generateEngagementCode();
    // Replace CFA- prefix with INV- for invoice
    const invNumber = invoiceNumber.replace("CFA-", "INV-SF-");

    // Auto-create a DRAFT success fee invoice
    successFeeInvoice = await prisma.invoice.create({
      data: {
        clientId: updated.clientId,
        engagementId: id,
        invoiceNumber: invNumber,
        subtotal: successFeeAmount,
        tax: 0,
        total: successFeeAmount,
        currency: updated.budgetCurrency,
        status: "DRAFT",
        lineItems: [
          {
            description: `Success fee: ${feePct.toString()}% of ${dealSize.toString()} deal size`,
            amount: Number(successFeeAmount),
          },
        ],
      },
    });
  }

  // Auto-create debrief when engagement transitions to COMPLETED
  if (body.status === "COMPLETED" && project.status !== "COMPLETED") {
    const existingDebrief = await prisma.engagementDebrief.findUnique({ where: { engagementId: id } });
    if (!existingDebrief) {
      await prisma.engagementDebrief.create({
        data: {
          engagementId: id,
          status: "PENDING",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      });
      // Create an update notification
      await prisma.engagementUpdate.create({
        data: {
          engagementId: id,
          createdById: session.user.id,
          type: "MILESTONE_COMPLETED",
          content: "Engagement completed. Debrief has been auto-created and is due in 14 days.",
        },
      });
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Engagement",
    entityId: id,
    entityName: project.name,
    details: { fields: Object.keys(updateData) },
  });

  return Response.json({
    project: updated,
    ...(successFeeInvoice ? { successFeeInvoice } : {}),
  });
}
