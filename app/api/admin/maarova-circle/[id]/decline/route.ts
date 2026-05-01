import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { emailMaarovaCircleDeclined } from "@/lib/email";

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const declineReason = typeof body.declineReason === "string" ? body.declineReason.trim() : null;

  const application = await prisma.maarovaCircleApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (application.status === "APPROVED" || application.status === "COMPLETED") {
    return NextResponse.json({ error: "Cannot decline approved application" }, { status: 400 });
  }

  await prisma.maarovaCircleApplication.update({
    where: { id },
    data: {
      status: "DECLINED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      declineReason: declineReason || null,
    },
  });

  try {
    await emailMaarovaCircleDeclined({
      email: application.email,
      firstName: application.firstName,
      reason: declineReason,
    });
  } catch (err) {
    console.error("[decline] email failed:", err);
  }

  return NextResponse.json({ ok: true });
});
