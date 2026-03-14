import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { emailPaymentProcessed } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canPay = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canPay) return new Response("Forbidden", { status: 403 });

  const { entryIds, paymentReference, paymentMethod } = await req.json();
  if (!Array.isArray(entryIds) || entryIds.length === 0) return new Response("No entries", { status: 400 });

  // IDOR: verify all entries belong to projects this user manages
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isElevated) {
    const unauthorised = await prisma.timeEntry.count({
      where: {
        id: { in: entryIds },
        assignment: {
          project: { engagementManagerId: { not: session.user.id } },
        },
      },
    });
    if (unauthorised > 0) return new Response("Forbidden", { status: 403 });
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
    await emailPaymentProcessed({
      consultantEmail: sample.consultant.email,
      consultantName: sample.consultant.name,
      totalAmount: Number(total._sum.billableAmount ?? 0),
      currency: sample.currency,
      paymentMethod: paymentMethod ?? "Bank Transfer",
      paymentReference: paymentReference ?? "N/A",
    });
  }

  return Response.json({ ok: true, updated: entryIds.length });
}
