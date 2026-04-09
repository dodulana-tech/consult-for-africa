"use client";

import { useState } from "react";
import { MapPin, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  clientName: string;
  commissionType: string;
  commissionValue: number;
  commissionCurrency: "NGN" | "USD";
  territories: string[];
  targetIndustries: string[];
  productType: string;
  agentCount: number;
  maxAgents: number | null;
  startDate: string;
  endDate: string | null;
  hasApplied: boolean;
}

export default function AgentOpportunityList({
  opportunities,
  hasAgentProfile,
  agentStatus,
}: {
  opportunities: Opportunity[];
  hasAgentProfile: boolean;
  agentStatus: string | null;
}) {
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedSet, setAppliedSet] = useState<Set<string>>(
    new Set(opportunities.filter((o) => o.hasApplied).map((o) => o.id))
  );
  const [error, setError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const goToAgentDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/agent-portal/platform-session", {
        method: "POST",
      });
      if (!res.ok) {
        setError("Failed to create agent session. Please try again.");
        return;
      }
      const data = await res.json();
      window.location.href = data.redirect;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleApply = async (opportunityId: string) => {
    setApplying(opportunityId);
    setError(null);

    try {
      // Step 1: Ensure agent profile exists
      if (!hasAgentProfile) {
        const regRes = await fetch("/api/agent-portal/register-from-platform", {
          method: "POST",
        });
        if (!regRes.ok) {
          const data = await regRes.json();
          setError(data.error ?? "Failed to create agent profile.");
          setApplying(null);
          return;
        }
      }

      // Step 2: Apply to the opportunity
      const applyRes = await fetch(`/api/agent-portal/platform-apply/${opportunityId}`, {
        method: "POST",
      });
      if (!applyRes.ok) {
        const data = await applyRes.json();
        setError(data.error ?? "Failed to apply.");
        setApplying(null);
        return;
      }

      setAppliedSet((prev) => new Set([...prev, opportunityId]));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setApplying(null);
    }
  };

  const formatCommission = (o: Opportunity) => {
    const sym = o.commissionCurrency === "NGN" ? "\u20A6" : "$";
    switch (o.commissionType) {
      case "PERCENTAGE":
        return `${o.commissionValue}% per deal`;
      case "RECURRING":
        return `${sym}${o.commissionValue.toLocaleString()}/month recurring`;
      case "TIERED":
        return "Tiered commission";
      default:
        return `${sym}${o.commissionValue.toLocaleString()} per deal`;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={12} />
          Back to staffing opportunities
        </Link>

        {hasAgentProfile && agentStatus === "APPROVED" && (
          <button
            onClick={goToAgentDashboard}
            disabled={dashboardLoading}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            {dashboardLoading ? "Loading..." : "Go to Agent Dashboard"}
          </button>
        )}
      </div>

      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
        >
          {error}
        </div>
      )}

      {opportunities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Tag size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No open agent opportunities right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {opportunities.map((opp) => {
            const isApplied = appliedSet.has(opp.id);
            const isLoading = applying === opp.id;

            return (
              <div
                key={opp.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#0F2744] truncate">{opp.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{opp.clientName}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: "#FEF9E7", color: "#B8860B" }}
                  >
                    {formatCommission(opp)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3 flex-1">
                  {opp.description}
                </p>

                <div className="space-y-1.5 mb-4">
                  {opp.territories.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{opp.territories.join(", ")}</span>
                    </div>
                  )}
                  {opp.targetIndustries.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Tag size={11} className="shrink-0" />
                      <span className="truncate">{opp.targetIndustries.join(", ")}</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-400">
                    {opp.productType.replace(/_/g, " ")}
                  </div>
                  <div className="text-xs text-slate-400">
                    {opp.agentCount}{opp.maxAgents ? ` / ${opp.maxAgents}` : ""} agent{opp.agentCount !== 1 ? "s" : ""}
                  </div>
                </div>

                {isApplied ? (
                  <span
                    className="text-xs font-medium text-center py-2 rounded-lg"
                    style={{ background: "#ECFDF5", color: "#065F46" }}
                  >
                    Applied
                  </span>
                ) : (
                  <button
                    onClick={() => handleApply(opp.id)}
                    disabled={isLoading}
                    className="text-xs font-semibold text-center py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{
                      background: "#0F2744",
                      color: "#FFFFFF",
                    }}
                  >
                    {isLoading ? "Applying..." : "Apply"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
