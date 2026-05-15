import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import PilotsClient from "./PilotsClient";

export const dynamic = "force-dynamic";

const ALLOWED = ["DIRECTOR", "PARTNER", "ADMIN"];

export default async function PilotsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED.includes(session.user.role)) redirect("/dashboard");

  const pilots = await prisma.cadreMandate.findMany({
    where: { isPilot: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      facility: { select: { id: true, name: true } },
      pilotOwner: { select: { id: true, name: true } },
      _count: { select: { matches: true } },
    },
  });

  const owners = await prisma.user.findMany({
    where: { role: { in: ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const serialized = pilots.map((p) => ({
    id: p.id,
    title: p.title,
    facilityName: p.facilityName ?? p.facility?.name ?? null,
    cadre: p.cadre,
    subSpecialty: p.subSpecialty,
    status: p.status,
    locationState: p.locationState,
    locationCity: p.locationCity,
    pilotOwner: p.pilotOwner,
    pilotNotes: p.pilotNotes,
    briefedAt: p.briefedAt?.toISOString() ?? null,
    sourcingStartedAt: p.sourcingStartedAt?.toISOString() ?? null,
    shortlistedAt: p.shortlistedAt?.toISOString() ?? null,
    interviewingAt: p.interviewingAt?.toISOString() ?? null,
    offerExtendedAt: p.offerExtendedAt?.toISOString() ?? null,
    placedAt: p.placedAt?.toISOString() ?? null,
    lostAt: p.lostAt?.toISOString() ?? null,
    lostReason: p.lostReason,
    placementFeeNGN: p.placementFeeNGN ? Number(p.placementFeeNGN) : null,
    placedConsultantId: p.placedConsultantId,
    caseStudyApproved: p.caseStudyApproved,
    caseStudyQuote: p.caseStudyQuote,
    caseStudyContactName: p.caseStudyContactName,
    caseStudyContactTitle: p.caseStudyContactTitle,
    candidateCount: p._count.matches,
    createdAt: p.createdAt.toISOString(),
  }));

  // Funnel summary
  const total = pilots.length;
  const placed = pilots.filter((p) => p.status === "PLACED").length;
  const lost = pilots.filter((p) => p.status === "CANCELLED" || !!p.lostAt).length;
  const active = total - placed - lost;

  const placedPilots = pilots.filter((p) => p.placedAt && p.briefedAt);
  const fillTimes = placedPilots.map(
    (p) => (p.placedAt!.getTime() - p.briefedAt!.getTime()) / (1000 * 60 * 60 * 24),
  );
  const shortlistTimes = pilots
    .filter((p) => p.shortlistedAt && p.briefedAt)
    .map((p) => (p.shortlistedAt!.getTime() - p.briefedAt!.getTime()) / (1000 * 60 * 60 * 24));

  const avg = (arr: number[]) =>
    arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  const summary = {
    total,
    active,
    placed,
    lost,
    placementRate: total > 0 ? Math.round((placed / total) * 100) : 0,
    avgTimeToShortlistDays: avg(shortlistTimes),
    avgTimeToFillDays: avg(fillTimes),
    caseStudiesReady: pilots.filter((p) => p.caseStudyApproved).length,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="White-glove Pilots"
        subtitle={`Hand-managed mandates to prove the network works before opening self-serve postings`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <PilotsClient initialPilots={serialized} owners={owners} summary={summary} />
      </main>
    </div>
  );
}
