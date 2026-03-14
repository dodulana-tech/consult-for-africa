import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PLANNING:  { bg: "#EFF6FF", color: "#1D4ED8", label: "Planning" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  ON_HOLD:   { bg: "#F3F4F6", color: "#6B7280", label: "On Hold" },
  AT_RISK:   { bg: "#FEF3C7", color: "#92400E", label: "At Risk" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

export default async function ClientDashboardPage() {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const projects = await prisma.project.findMany({
    where: { clientId: session.clientId },
    include: {
      engagementManager: { select: { name: true, email: true } },
      milestones: { select: { status: true }, orderBy: { order: "asc" } },
      deliverables: {
        select: { status: true },
        where: { status: { in: ["APPROVED", "DELIVERED_TO_CLIENT"] } },
      },
      _count: {
        select: { deliverables: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: { name: true },
  });

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#0F2744" }}
            >
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Client Portal
            </span>
            {client && (
              <>
                <span className="text-gray-300 text-sm">/</span>
                <span className="text-sm text-gray-600">{client.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Your Projects
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length} active engagement{projects.length !== 1 ? "s" : ""} with Consult For Africa
          </p>
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div
            className="rounded-2xl bg-white p-12 text-center"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <p className="text-gray-400 text-sm">No projects found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const milestonesTotal = project.milestones.length;
              const milestonesCompleted = project.milestones.filter(
                (m) => m.status === "COMPLETED"
              ).length;
              const milestoneProgress =
                milestonesTotal > 0
                  ? Math.round((milestonesCompleted / milestonesTotal) * 100)
                  : 0;

              const totalDeliverables = project._count.deliverables;
              const approvedDeliverables = project.deliverables.length;

              const statusStyle =
                STATUS_STYLES[project.status] ?? STATUS_STYLES.PLANNING;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl p-6"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2
                          className="text-base font-semibold"
                          style={{ color: "#0F2744" }}
                        >
                          {project.name}
                        </h2>
                        <span
                          className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Engagement Manager: {project.engagementManager.name}
                      </p>
                    </div>
                    <Link
                      href={`/client/projects/${project.id}`}
                      className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      style={{
                        background: "#0F2744",
                        color: "#fff",
                      }}
                    >
                      View Project
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {/* Milestone progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 font-medium">
                          Milestones
                        </span>
                        <span className="text-xs text-gray-700 font-semibold">
                          {milestonesCompleted} / {milestonesTotal}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full w-full overflow-hidden"
                        style={{ background: "#e5eaf0" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${milestoneProgress}%`,
                            background: "#D4AF37",
                          }}
                        />
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Deliverables approved</span>
                      <span className="font-semibold text-gray-700">
                        {approvedDeliverables} / {totalDeliverables}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
