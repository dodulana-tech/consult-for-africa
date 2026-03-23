import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import NewPartnerForm from "@/components/platform/admin/NewPartnerForm";
import { Building2, ChevronRight, Users, Briefcase } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  CONSULTANCY: "Consultancy",
  DEVELOPMENT_AGENCY: "Development Agency",
  NGO: "NGO",
  MULTILATERAL: "Multilateral",
  OTHER: "Other",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PROSPECT: { bg: "#EFF6FF", color: "#1D4ED8" },
  ONBOARDING: { bg: "#FEF3C7", color: "#92400E" },
  ACTIVE: { bg: "#D1FAE5", color: "#065F46" },
  INACTIVE: { bg: "#F3F4F6", color: "#6B7280" },
};

export default async function AdminPartnersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAllowed = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!isAllowed) redirect("/dashboard");

  const partners = await prisma.partnerFirm.findMany({
    include: {
      _count: {
        select: {
          contacts: true,
        },
      },
      staffingRequests: {
        where: {
          status: { in: ["SUBMITTED", "MATCHING", "SHORTLIST_SENT", "CONFIRMED", "ACTIVE"] },
        },
        select: {
          id: true,
          deployments: {
            where: { status: { in: ["ACCEPTED", "ACTIVE"] } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPartners = partners.length;
  const activePartners = partners.filter((p) => p.status === "ACTIVE").length;
  const totalActiveRequests = partners.reduce(
    (sum, p) => sum + p.staffingRequests.length,
    0
  );
  const totalActiveDeployments = partners.reduce(
    (sum, p) =>
      sum + p.staffingRequests.reduce((s, r) => s + r.deployments.length, 0),
    0
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Partner Firms"
        subtitle={`${totalPartners} partner${totalPartners !== 1 ? "s" : ""}`}
        action={<NewPartnerForm />}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Partners", value: totalPartners, color: "#3B82F6" },
              { label: "Active", value: activePartners, color: "#10B981" },
              { label: "Active Requests", value: totalActiveRequests, color: "#F59E0B" },
              { label: "Active Deployments", value: totalActiveDeployments, color: "#8B5CF6" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          {/* Partner cards */}
          <div className="space-y-3">
            {partners.map((p) => {
              const activeRequests = p.staffingRequests.length;
              const activeDeployments = p.staffingRequests.reduce(
                (s, r) => s + r.deployments.length,
                0
              );
              const statusStyle = STATUS_COLORS[p.status] ?? STATUS_COLORS.INACTIVE;

              return (
                <Link
                  key={p.id}
                  href={`/admin/partners/${p.id}`}
                  className="flex items-start gap-4 rounded-xl p-5 group transition-shadow hover:shadow-sm bg-white"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#F0F4FF" }}
                  >
                    <Building2 size={18} style={{ color: "#0F2744" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-[#0F2744]">
                            {p.name}
                          </p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={statusStyle}
                          >
                            {p.status === "PROSPECT" ? "Prospect" : p.status === "ONBOARDING" ? "Onboarding" : p.status === "ACTIVE" ? "Active" : p.status === "INACTIVE" ? "Inactive" : p.status}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "#F3F4F6", color: "#6B7280" }}
                          >
                            {TYPE_LABELS[p.type] ?? p.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.country}{p.city ? `, ${p.city}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {p._count.contacts} contact{p._count.contacts !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase size={11} />
                        {activeRequests} active request{activeRequests !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {activeDeployments} deployment{activeDeployments !== 1 ? "s" : ""}
                      </span>
                      <span>{p.paymentTerms}-day terms</span>
                      {p.defaultMarkupPct && (
                        <span>{Number(p.defaultMarkupPct)}% markup</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={14} className="text-gray-300 mt-1 shrink-0 group-hover:text-gray-500 transition-colors" />
                </Link>
              );
            })}

            {partners.length === 0 && (
              <div className="rounded-xl p-12 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No partner firms yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
