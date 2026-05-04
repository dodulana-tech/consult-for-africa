import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailMaarovaCircleCoachingOpen } from "@/lib/email";

/**
 * POST /api/admin/maarova-circle/coaching-blast
 * Send the June 2026 "coaching is open" email to all Founding Circle members
 * who opted in and have not been notified yet.
 */
export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recipients = await prisma.maarovaCircleApplication.findMany({
    where: {
      status: { in: ["APPROVED", "COMPLETED"] },
      coachingOptIn: true,
      coachingNotifiedAt: null,
      coachingDiscountCode: { not: null },
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      coachingDiscountCode: true,
    },
  });

  let sent = 0;
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    try {
      await emailMaarovaCircleCoachingOpen({
        email: r.email,
        firstName: r.firstName,
        discountCode: r.coachingDiscountCode!,
      });
      await prisma.maarovaCircleApplication.update({
        where: { id: r.id },
        data: { coachingNotifiedAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error("[coaching-blast]", r.email, err);
    }
    if (i < recipients.length - 1) await new Promise((res) => setTimeout(res, 2000));
  }

  return NextResponse.json({ ok: true, sent, total: recipients.length });
});
