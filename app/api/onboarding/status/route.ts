import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const onboarding = await prisma.consultantOnboarding.findUnique({
    where: { userId: session.user.id },
    select: {
      status: true,
      assessmentLevel: true,
      profileCompleted: true,
      assessmentCompleted: true,
      user: {
        select: {
          consultantProfile: {
            select: { bankName: true },
          },
        },
      },
    },
  });

  if (!onboarding) {
    return Response.json({ error: "No onboarding record" }, { status: 404 });
  }

  return Response.json({
    ...onboarding,
    bankingCompleted: !!onboarding.user?.consultantProfile?.bankName,
    user: undefined,
  });
});
