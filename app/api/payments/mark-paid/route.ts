import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { emailPaymentProcessed } from "@/lib/email";
import { Decimal } from "@prisma/client/runtime/library";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canPay = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canPay) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { entryIds, paymentReference, paymentMethod } = await req.json();
  if (!Array.isArray(entryIds) || entryIds.length === 0) return Response.json({ error: "No entries" }, { status: 400 });

  // IDOR: verify all entries belong to projects this user manages
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    const unauthorised = await prisma.timeEntry.count({
      where: {
        id: { in: entryIds },
        assignment: {
          engagement: { engagementManagerId: { not: session.user.id } },
        },
      },
    });
    if (unauthorised > 0) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.timeEntry.updateMany({
    where: { id: { in: entryIds } },
    data: { status: "PAID" },
  });

  // Get one entry for email details
  const sample = await prisma.timeEntry.findFirst({
    where: { id: { in: entryIds } },
    include: { consultant: { select: { name: true, email: true } } },
  });

  const total = await prisma.timeEntry.aggregate({
    where: { id: { in: entryIds } },
    _sum: { billableAmount: true },
  });

  if (sample) {
    const totalDecimal = total._sum.billableAmount
      ? new Decimal(total._sum.billableAmount as unknown as Decimal)
      : new Decimal(0);
    await emailPaymentProcessed({
      consultantEmail: sample.consultant.email,
      consultantName: sample.consultant.name,
      totalAmount: totalDecimal.toNumber(),
      currency: sample.currency,
      paymentMethod: paymentMethod ?? "Bank Transfer",
      paymentReference: paymentReference ?? "N/A",
    });
  }

  // Update project actualSpent for each affected project
  try {
    const entries = await prisma.timeEntry.findMany({
      where: { id: { in: entryIds }, billableAmount: { not: null } },
      select: { billableAmount: true, assignment: { select: { engagementId: true } } },
    });
    // Group by project using Decimal for precision
    const projectSpend = new Map<string, Decimal>();
    for (const entry of entries) {
      const pid = entry.assignment.engagementId;
      const amount = entry.billableAmount
        ? new Decimal(entry.billableAmount as unknown as Decimal)
        : new Decimal(0);
      const prev = projectSpend.get(pid) ?? new Decimal(0);
      projectSpend.set(pid, prev.add(amount));
    }
    // Increment actualSpent per project
    for (const [projectId, amount] of projectSpend) {
      await prisma.engagement.update({
        where: { id: projectId },
        data: { actualSpent: { increment: amount } },
      });
    }
  } catch (err) {
    console.error("[payments/mark-paid] actualSpent update failed:", err);
  }

  return Response.json({ ok: true, updated: entryIds.length });
});
