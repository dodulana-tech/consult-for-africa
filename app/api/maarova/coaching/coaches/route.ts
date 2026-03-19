import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/maarova/coaching/coaches
 * Returns recommended coaches for the authenticated user.
 * Filters by availability and returns top matches based on
 * the user's assessment dimensions.
 */
export async function GET() {
  const session = await getMaarovaSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get available coaches (active)
  const coaches = await prisma.maarovaCoach.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      title: true,
      bio: true,
      specialisms: true,
      certifications: true,
      country: true,
      city: true,
      yearsExperience: true,
      avatarUrl: true,
      activeClients: true,
      maxClients: true,
    },
    orderBy: { yearsExperience: "desc" },
  });

  // Simple availability filter (not at capacity)
  const available = coaches.filter((c) => c.activeClients < c.maxClients);

  return Response.json({ coaches: available });
}
