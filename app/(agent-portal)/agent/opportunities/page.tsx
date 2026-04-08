import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AgentOpportunitiesPage() {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const opportunities = await prisma.agentOpportunity.findMany({
    where: { status: { in: ["OPEN", "ASSIGNED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { assignments: true } },
      assignments: {
        where: { agentId: session.sub },
        select: { status: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Opportunities
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Browse available sales opportunities
        </p>
      </div>

      {opportunities.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-sm text-gray-400">No opportunities available right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {opportunities.map((opp) => {
            const isApplied = opp.assignments.length > 0;
            const assignmentStatus = opp.assignments[0]?.status;
            return (
              <div
                key={opp.id}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold" style={{ color: "#0F2744" }}>
                      {opp.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">{opp.clientName} / {opp.productType}</p>
                  </div>
                  {isApplied && (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {assignmentStatus === "ACTIVE" ? "Active" : "Applied"}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {opp.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                  {opp.territories.length > 0 && (
                    <span>{opp.territories.join(", ")}</span>
                  )}
                  <span className="font-semibold" style={{ color: "#D4AF37" }}>
                    {opp.commissionType === "PERCENTAGE"
                      ? `${Number(opp.commissionValue)}% commission`
                      : opp.commissionType === "FIXED_PER_DEAL"
                      ? `${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(opp.commissionValue))} per deal`
                      : opp.commissionType.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span>{opp._count.assignments} agent{opp._count.assignments !== 1 ? "s" : ""}</span>
                </div>

                <div className="mt-4">
                  {isApplied ? (
                    <span className="text-xs text-gray-400">
                      {assignmentStatus === "ACTIVE" ? "You are active on this opportunity" : "Application pending review"}
                    </span>
                  ) : (
                    <Link
                      href={`/agent/opportunities/${opp.id}`}
                      className="inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
                      style={{ background: "#0F2744" }}
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
