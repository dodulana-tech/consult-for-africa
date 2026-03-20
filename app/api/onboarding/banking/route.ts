import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;

  const onboarding = await prisma.consultantOnboarding.findUnique({
    where: { userId },
  });

  if (!onboarding) {
    return new Response("No onboarding record found", { status: 404 });
  }

  if (onboarding.status === "ACTIVE" || onboarding.status === "REJECTED") {
    return new Response("Onboarding already completed", { status: 400 });
  }

  const body = await req.json();
  const { bankName, accountNumber, accountName, swiftCode, currency } = body;

  if (!bankName?.trim() || !accountNumber?.trim() || !accountName?.trim()) {
    return new Response("bankName, accountNumber, and accountName are required", { status: 400 });
  }

  await prisma.consultantProfile.update({
    where: { userId },
    data: {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      swiftCode: swiftCode?.trim() || null,
      currency: currency === "USD" ? "USD" : "NGN",
    },
  });

  // Move onboarding to ASSESSMENT_PENDING if still in PROFILE_SETUP
  if (onboarding.status === "PROFILE_SETUP") {
    await prisma.consultantOnboarding.update({
      where: { userId },
      data: { status: "ASSESSMENT_PENDING" },
    });
  }

  return Response.json({ ok: true });
}
