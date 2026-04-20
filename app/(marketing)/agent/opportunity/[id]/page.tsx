import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, DollarSign, Users, Clock, Briefcase, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function formatCommission(type: string, value: number): string {
  if (type === "PERCENTAGE") return `Up to ${value}% commission`;
  if (type === "FIXED_PER_DEAL") {
    return `N${value.toLocaleString()} per deal`;
  }
  if (type === "TIERED") return "Tiered commission";
  if (type === "RECURRING") return `${value}% recurring`;
  return `${value}%`;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `N${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `N${(amount / 1_000).toFixed(0)}K`;
  return `N${amount.toLocaleString()}`;
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const opp = await prisma.agentOpportunity.findUnique({
    where: { id },
    include: {
      _count: { select: { assignments: true } },
    },
  });

  if (!opp || (opp.status !== "OPEN" && opp.status !== "ASSIGNED")) notFound();

  return (
    <div className="min-h-screen" style={{ background: "#F8F9FB" }}>
      {/* Nav */}
      <nav className="bg-white" style={{ borderBottom: "1px solid #E8EBF0" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 28 }} />
            <span className="text-sm font-bold" style={{ color: "#0F2744" }}>Consult For Africa</span>
          </Link>
          <Link
            href="/agent/register"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "#0B3C5D" }}
          >
            Become an Agent
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link
          href="/agent#opportunities"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Opportunities
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(212,175,55,0.1)", color: "#9a7d1a", border: "1px solid rgba(212,175,55,0.25)" }}>
                  {formatCommission(opp.commissionType, Number(opp.commissionValue))}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {opp.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
                {opp.title}
              </h1>
              <p className="mt-2 text-sm text-gray-500">{opp.clientName}</p>
            </div>

            {/* Description */}
            <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: "#0F2744" }}>About This Opportunity</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{opp.description}</p>
            </div>

            {/* Target */}
            {opp.targetDescription && (
              <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: "#0F2744" }}>Who You Should Target</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{opp.targetDescription}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {opp.territories.length > 0 && (
                <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Territories</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opp.territories.map(t => (
                      <span key={t} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "#0B3C5D08", color: "#0B3C5D" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {opp.targetIndustries.length > 0 && (
                <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Target Industries</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opp.targetIndustries.map(t => (
                      <span key={t} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "#D4AF3710", color: "#9a7d1a" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Materials */}
            {(opp.pitchDeckUrl || opp.briefingDocUrl) && (
              <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
                <h2 className="text-sm font-bold mb-3" style={{ color: "#0F2744" }}>Sales Materials</h2>
                <p className="text-xs text-gray-400 mb-3">Available after you are approved as an agent.</p>
                <div className="flex gap-3">
                  {opp.pitchDeckUrl && <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">Pitch Deck</span>}
                  {opp.briefingDocUrl && <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">Briefing Document</span>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA Card */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#0F2744" }}>
              <h3 className="text-base font-bold text-white mb-2">Ready to earn?</h3>
              <p className="text-xs text-white/60 mb-5">
                Apply to become a C4A sales agent and start selling {opp.clientName} products.
              </p>
              <Link
                href={`/agent/register?opportunity=${opp.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition hover:opacity-90"
                style={{ background: "#D4AF37", color: "#0F2744" }}
              >
                Apply Now <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-[10px] text-white/40 text-center">
                Free to join. No upfront costs.
              </p>
            </div>

            {/* Quick stats */}
            <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4" style={{ border: "1px solid #E8EBF0" }}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5" style={{ background: "#D4AF3710" }}>
                  <DollarSign className="h-4 w-4" style={{ color: "#D4AF37" }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Commission</p>
                  <p className="text-sm font-bold" style={{ color: "#0F2744" }}>
                    {formatCommission(opp.commissionType, Number(opp.commissionValue))}
                  </p>
                </div>
              </div>

              {(opp.expectedDealValueMin || opp.expectedDealValueMax) && (
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2.5 bg-blue-50">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Deal Value Range</p>
                    <p className="text-sm font-bold" style={{ color: "#0F2744" }}>
                      {opp.expectedDealValueMin ? formatCurrency(Number(opp.expectedDealValueMin)) : "N/A"}
                      {" - "}
                      {opp.expectedDealValueMax ? formatCurrency(Number(opp.expectedDealValueMax)) : "N/A"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5 bg-emerald-50">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Agents</p>
                  <p className="text-sm font-bold" style={{ color: "#0F2744" }}>
                    {opp._count.assignments} active
                    {opp.maxAgents ? ` / ${opp.maxAgents} max` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5 bg-gray-100">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="text-sm font-bold" style={{ color: "#0F2744" }}>
                    {opp.endDate
                      ? `Until ${new Date(opp.endDate).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}`
                      : "Ongoing"}
                  </p>
                </div>
              </div>
            </div>

            {/* Product type */}
            <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <p className="text-xs text-gray-400">Product Type</p>
              <p className="text-sm font-bold mt-1" style={{ color: "#0F2744" }}>{opp.productType}</p>
              {opp.serviceCategory && (
                <>
                  <p className="text-xs text-gray-400 mt-3">Category</p>
                  <p className="text-sm font-medium mt-1 text-gray-700">{opp.serviceCategory}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
