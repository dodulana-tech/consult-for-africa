/**
 * Dashboard stats for the cadre portal home.
 *
 * Returns:
 * - salaryDensity: how many salary reports in this professional's cadre
 *   (and the breakdown for their state, since salary varies hugely
 *   state-by-state)
 * - reviewDensity: number of hospital reviews available across NG
 * - peersInCadre: total professionals in their cadre on the platform
 *
 * The point is to honestly show the network density so users know
 * what's already useful and what depends on them contributing.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreSession } from "@/lib/cadreAuth";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  const session = await getCadreSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.cadreProfessional.findUnique({
    where: { id: session.sub },
    select: { cadre: true, state: true },
  });
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [salaryReportsInCadre, salaryReportsInState, hospitalReviews, peersInCadre] = await Promise.all([
    prisma.cadreSalaryReport.count({ where: { cadre: me.cadre } }),
    me.state
      ? prisma.cadreSalaryReport.count({ where: { cadre: me.cadre, state: me.state } })
      : Promise.resolve(0),
    prisma.cadreFacilityReview.count(),
    prisma.cadreProfessional.count({ where: { cadre: me.cadre } }),
  ]);

  return NextResponse.json({
    cadre: me.cadre,
    state: me.state,
    salaryReportsInCadre,
    salaryReportsInState,
    hospitalReviews,
    peersInCadre,
  });
});
