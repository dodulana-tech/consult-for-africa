import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import NewProjectForm from "@/components/platform/NewProjectForm";
import { formatCompactCurrency, budgetUtilization } from "@/lib/utils";
import { ChevronRight, AlertTriangle } from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PLANNING:  { bg: "#EFF6FF", color: "#1D4ED8" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46" },
  ON_HOLD:   { bg: "#F3F4F6", color: "#6B7280" },
  AT_RISK:   { bg: "#FEF3C7", color: "#92400E" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B" },
};

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { role, id: userId } = session.user;
  const isEM = role === "ENGAGEMENT_MANAGER";
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isConsultant = role === "CONSULTANT";

  const projects = await prisma.project.findMany({
    where: isElevated
      ? {}
      : isEM
      ? { engagementManagerId: userId }
      : { assignments: { some: { consultantId: userId } } },
    include: {
      client: { select: { name: true } },
      engagementManager: { select: { name: true } },
      _count: { select: { assignments: true, deliverables: true, milestones: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const active = projects.filter((p) => p.status === "ACTIVE").length;
  const atRisk = projects.filter((p) => p.status === "AT_RISK").length;
  const completed = projects.filter((p) => p.status === "COMPLETED").length;

  const canCreate = isEM || isElevated;

  const [clients, engagementManagers] = canCreate
    ? await Promise.all([
        prisma.client.findMany({ select: { id: true, name: true, currency: true }, where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
        prisma.user.findMany({ where: { role: "ENGAGEMENT_MANAGER" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      ])
    : [[], []];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Projects"
        subtitle={`${projects.length} projects`}
        action={canCreate ? (
          <NewProjectForm
            clients={clients}
            engagementManagers={engagementManagers}
            userRole={role}
            userId={userId}
          />
        ) : undefined}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Active", value: active, color: "#10B981" },
              { label: "At Risk", value: atRisk, color: "#F59E0B" },
              { label: "Completed", value: completed, color: "#3B82F6" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          {/* Project cards */}
          <div className="space-y-3">
            {projects.map((p) => {
              const budgetPct = budgetUtilization(Number(p.actualSpent), Number(p.budgetAmount));
              const statusStyle = STATUS_COLORS[p.status] ?? STATUS_COLORS.PLANNING;
              const isCritical = budgetPct >= 90 || p.status === "AT_RISK";

              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-start gap-4 rounded-xl p-5 group transition-shadow hover:shadow-sm bg-white"
                  style={{ border: `1px solid ${isCritical ? "#FECACA" : "#e5eaf0"}` }}
                >
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
                            {p.status}
                          </span>
                          {isCritical && <AlertTriangle size={12} className="text-amber-500" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.client.name} &middot; EM: {p.engagementManager.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {formatCompactCurrency(Number(p.budgetAmount), p.budgetCurrency)}
                        </p>
                        <p className={`text-xs ${budgetPct >= 90 ? "text-red-500" : budgetPct >= 80 ? "text-amber-500" : "text-gray-400"}`}>
                          {budgetPct}% spent
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{p._count.assignments} consultant{p._count.assignments !== 1 ? "s" : ""}</span>
                      <span>{p._count.deliverables} deliverable{p._count.deliverables !== 1 ? "s" : ""}</span>
                      <span>{p._count.milestones} milestone{p._count.milestones !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Budget bar */}
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(budgetPct, 100)}%`,
                          background: budgetPct >= 90 ? "#EF4444" : budgetPct >= 80 ? "#F59E0B" : "#10B981",
                        }}
                      />
                    </div>
                  </div>

                  <ChevronRight size={14} className="text-gray-300 mt-1 shrink-0 group-hover:text-gray-500 transition-colors" />
                </Link>
              );
            })}

            {projects.length === 0 && (
              <div className="rounded-xl p-12 text-center bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <p className="text-sm text-gray-400">No projects found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
