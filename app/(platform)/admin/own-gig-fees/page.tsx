import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import FeeActions from "./FeeActions";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: "#FEF3C7", color: "#92400E" },
  INVOICED: { bg: "#EFF6FF", color: "#1D4ED8" },
  PAID:     { bg: "#D1FAE5", color: "#065F46" },
};

export default async function OwnGigFeesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const fees = await prisma.ownGigPlatformFee.findMany({
    include: {
      engagement: { select: { name: true, engagementCode: true } },
      consultant: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = fees.filter((f) => f.status === "PENDING");
  const totalPending = pending.reduce((s, f) => s + Number(f.feeAmount), 0);
  const totalPaid = fees.filter((f) => f.status === "PAID").reduce((s, f) => s + Number(f.feeAmount), 0);

  return (
    <>
      <TopBar title="Own Gig Platform Fees" subtitle="Track and manage platform revenue from own gig engagements" />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">₦{totalPending.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total collected</p>
            <p className="text-2xl font-bold text-green-700">₦{totalPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total records</p>
            <p className="text-2xl font-bold text-[#0F2744]">{fees.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Consultant</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Project</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Period</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Model</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">No fee records yet</td>
                </tr>
              )}
              {fees.map((f) => {
                const sc = STATUS_COLORS[f.status] ?? STATUS_COLORS.PENDING;
                return (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-[#0F2744] font-medium">{f.consultant.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.engagement.name}
                      {f.engagement.engagementCode && (
                        <span className="ml-1 text-xs text-slate-400">{f.engagement.engagementCode}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(f.periodStart).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{f.feeModel}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#0F2744]">
                      {f.currency} {Number(f.feeAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FeeActions feeId={f.id} engagementId={f.engagementId} currentStatus={f.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
