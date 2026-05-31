import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailMaarovaCircleApproved } from "@/lib/email";

/**
 * POST /api/admin/maarova-circle/[id]/resend-approval
 *
 * Re-sends the Founding Circle approval email for an already-APPROVED
 * application, reusing the stored inviteToken and discount code. Used when the
 * original send failed (SMTP issue) or the recipient lost the email.
 */
export const POST = handler(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const application = await prisma.maarovaCircleApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (application.status !== "APPROVED") {
    return NextResponse.json({ error: "Application is not approved" }, { status: 400 });
  }
  if (!application.inviteToken || !application.coachingDiscountCode) {
    return NextResponse.json(
      { error: "Application is missing its invite token or discount code" },
      { status: 400 },
    );
  }

  try {
    await emailMaarovaCircleApproved({
      email: application.email,
      firstName: application.firstName,
      inviteToken: application.inviteToken,
      discountCode: application.coachingDiscountCode,
    });
  } catch (err) {
    console.error("[resend-approval] email failed:", err);
    return NextResponse.json(
      { error: "Email send failed. Check SMTP and try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
});
