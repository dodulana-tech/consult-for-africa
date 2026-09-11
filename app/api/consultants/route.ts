import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { OFFICE_ROLES } from "@/lib/constants";

/**
 * GET /api/consultants
 * List consultants for dropdowns (NDA Manager, etc.)
 */
export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Office staff carry client work too and are paid for it, so they have to be
  // staffable. They only appear once somebody has given them a consultant
  // profile, which is where the tier and the rate live: no profile, no rate, and
  // nothing to earn upside against. That keeps appearing here a deliberate act
  // rather than something the role hands over.
  const consultants = await prisma.user.findMany({
    where: {
      OR: [
        { role: "CONSULTANT" },
        { role: { in: [...OFFICE_ROLES] }, consultantProfile: { isNot: null } },
      ],
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ consultants });
});
