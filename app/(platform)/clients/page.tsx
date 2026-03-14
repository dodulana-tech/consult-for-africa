import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import NewClientForm from "@/components/platform/NewClientForm";
import { formatCompactCurrency } from "@/lib/utils";
import { Building2, ChevronRight, Phone, Mail, AlertCircle } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  PRIVATE_ELITE: "Private Elite",
  PRIVATE_MIDTIER: "Private Mid-Tier",
  GOVERNMENT: "Government",
  DEVELOPMENT: "Development",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "#D1FAE5", color: "#065F46" },
  INACTIVE: { bg: "#F3F4F6", color: "#6B7280" },
  OVERDUE_PAYMENT: { bg: "#FEF3C7", color: "#92400E" },
  BLACKLISTED: { bg: "#FEE2E2", color: "#991B1B" },
};

export default async function ClientsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";
  const isConsultant = role === "CONSULTANT";

  // Build scoped client filter
  let clientWhere = {};
  if (isEM) {
    // EM sees clients on their managed projects
    clientWhere = { projects: { some: { engagementManagerId: session.user.id } } };
  } else if (isConsultant) {
    // Consultant sees clients on projects they are assigned to
    clientWhere = { projects: { some: { assignments: { some: { consultantId: session.user.id } } } } };
  }
  // Elevated roles (DIRECTOR/PARTNER/ADMIN) see all — no filter

  const clients = await prisma.client.findMany({
    where: clientWhere,
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
          budgetAmount: true,
          budgetCurrency: true,
        },
      },
      invoices: {
        select: {
          id: true,
          total: true,
          currency: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = clients.filter((c) => c.status === "ACTIVE").length;
  const overdue = clients.filter((c) => c.status === "OVERDUE_PAYMENT").length;
  const totalProjects = clients.reduce((s, c) => s + c.projects.length, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Client Directory"
        subtitle={isConsultant ? "Clients on your engagements" : isEM ? "Your managed clients" : `${clients.length} clients`}
        action={isElevated ? <NewClientForm /> : undefined}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Active Clients", value: active, color: "#10B981" },
              { label: "Overdue Payment", value: overdue, color: "#F59E0B" },
              { label: "Total Projects", value: totalProjects, color: "#3B82F6" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          {/* Client cards */}
          <div className="space-y-3">
            {clients.map((c) => {
              const activeProjects = c.projects.filter((p) =>
                ["PLANNING", "ACTIVE", "AT_RISK"].includes(p.status)
              ).length;
              const totalRevenue = c.invoices
                .filter((i) => i.status === "PAID")
                .reduce((s, i) => s + Number(i.total), 0);
              const unpaidRevenue = c.invoices
                .filter((i) => ["SENT", "OVERDUE"].includes(i.status))
                .reduce((s, i) => s + Number(i.total), 0);
              const currency = c.currency;
              const statusStyle = STATUS_COLORS[c.status] ?? STATUS_COLORS.INACTIVE;

              return (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
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
                            {c.name}
                          </p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={statusStyle}
                          >
                            {c.status.replace("_", " ")}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "#F3F4F6", color: "#6B7280" }}
                          >
                            {TYPE_LABELS[c.type] ?? c.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{c.primaryContact}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {formatCompactCurrency(totalRevenue, currency)} collected
                        </p>
                        {unpaidRevenue > 0 && (
                          <p className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                            <AlertCircle size={10} />
                            {formatCompactCurrency(unpaidRevenue, currency)} outstanding
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail size={11} />
                        {c.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        {c.phone}
                      </span>
                      <span>
                        {c.projects.length} project{c.projects.length !== 1 ? "s" : ""}
                        {activeProjects > 0 && (
                          <span className="text-emerald-600 ml-1">({activeProjects} active)</span>
                        )}
                      </span>
                      <span>{c.paymentTerms}-day terms</span>
                    </div>
                  </div>

                  <ChevronRight size={14} className="text-gray-300 mt-1 shrink-0 group-hover:text-gray-500 transition-colors" />
                </Link>
              );
            })}

            {clients.length === 0 && (
              <div className="rounded-xl p-12 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No clients yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
