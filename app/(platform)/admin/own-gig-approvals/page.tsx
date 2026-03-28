import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { AlertTriangle } from "lucide-react";
import ApprovalActions from "./ApprovalActions";

export default async function OwnGigApprovalsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
  if (!ELEVATED.includes(session.user.role)) redirect("/dashboard");

  const gigs = await prisma.engagement.findMany({
    where: {
      isOwnGig: true,
      ownGigApprovalStatus: { in: ["PENDING", "NEEDS_CHANGES"] },
    },
    include: {
      client: { select: { name: true } },
      ownGigOwner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { ownGigSubmittedAt: "desc" },
  });

  return (
    <>
      <TopBar title="Own Gig Approvals" subtitle="Review and approve consultant-sourced engagements" />

      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {gigs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-300 rounded-xl">
            <p className="text-slate-500 text-sm">No own gigs pending approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gigs.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0F2744] text-base">{g.name}</h3>
                      {g.ownGigConflictFlag && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">
                          <AlertTriangle size={12} /> Conflict
                        </span>
                      )}
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: g.ownGigApprovalStatus === "PENDING" ? "#FEF3C7" : "#FFF7ED",
                          color: g.ownGigApprovalStatus === "PENDING" ? "#92400E" : "#9A3412",
                        }}
                      >
                        {g.ownGigApprovalStatus === "PENDING" ? "Pending" : "Changes Requested"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {g.engagementCode} &middot; {g.client.name}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500 text-right whitespace-nowrap">
                    Submitted {g.ownGigSubmittedAt ? new Date(g.ownGigSubmittedAt).toLocaleDateString() : "N/A"}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Consultant</p>
                    <p className="font-medium text-[#0F2744]">{g.ownGigOwner?.name ?? "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Service Type</p>
                    <p className="font-medium text-[#0F2744]">{g.serviceType?.replace(/_/g, " ") ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Budget</p>
                    <p className="font-medium text-[#0F2744]">
                      {g.budgetCurrency} {Number(g.budgetAmount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Fee</p>
                    <p className="font-medium text-[#0F2744]">
                      {g.ownGigFeeModel === "PERCENTAGE"
                        ? `${Number(g.ownGigFeePct)}%`
                        : g.ownGigFlatMonthlyFee
                          ? `₦${Number(g.ownGigFlatMonthlyFee).toLocaleString()}/mo`
                          : "N/A"}
                    </p>
                  </div>
                </div>

                {g.ownGigConflictNote && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    <strong>Conflict note:</strong> {g.ownGigConflictNote}
                  </div>
                )}

                {g.ownGigApprovalNote && g.ownGigApprovalStatus === "NEEDS_CHANGES" && (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                    <strong>Previous reviewer note:</strong> {g.ownGigApprovalNote}
                  </div>
                )}

                <ApprovalActions
                  engagementId={g.id}
                  hasConflict={g.ownGigConflictFlag}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
