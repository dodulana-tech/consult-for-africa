import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";

const PROJECT_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  PLANNING:  { bg: "#EFF6FF", color: "#1D4ED8", label: "Planning" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  ON_HOLD:   { bg: "#F3F4F6", color: "#6B7280", label: "On Hold" },
  AT_RISK:   { bg: "#FEF3C7", color: "#92400E", label: "At Risk" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

const MILESTONE_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  PENDING:     { bg: "#F3F4F6", color: "#6B7280", label: "Pending" },
  IN_PROGRESS: { bg: "#EFF6FF", color: "#1D4ED8", label: "In Progress" },
  COMPLETED:   { bg: "#D1FAE5", color: "#065F46", label: "Completed" },
  DELAYED:     { bg: "#FEF3C7", color: "#92400E", label: "Delayed" },
  SKIPPED:     { bg: "#F3F4F6", color: "#9CA3AF", label: "Skipped" },
};

const DELIVERABLE_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  APPROVED:            { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
  DELIVERED_TO_CLIENT: { bg: "#F0FDF4", color: "#15803D", label: "Delivered" },
};

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      engagementManager: { select: { name: true, email: true } },
      milestones: { orderBy: { order: "asc" } },
      deliverables: {
        where: { status: { in: ["APPROVED", "DELIVERED_TO_CLIENT"] } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  // Verify this project belongs to the authenticated client
  if (project.clientId !== session.clientId) {
    redirect("/client/dashboard");
  }

  const statusStyle =
    PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.PLANNING;

  const milestonesTotal = project.milestones.length;
  const milestonesCompleted = project.milestones.filter(
    (m) => m.status === "COMPLETED"
  ).length;
  const milestoneProgress =
    milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;

  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const now = new Date();
  const totalDays = endDate.getTime() - startDate.getTime();
  const elapsedDays = now.getTime() - startDate.getTime();
  const timeProgress =
    totalDays > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
      : 0;

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
            <span className="text-gray-300 text-sm">/</span>
            <Link
              href="/client/dashboard"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Projects
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <span
              className="text-sm font-medium truncate max-w-[200px]"
              style={{ color: "#0F2744" }}
            >
              {project.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Project header */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1
                  className="text-xl font-bold"
                  style={{ color: "#0F2744" }}
                >
                  {project.name}
                </h1>
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
              {project.description && (
                <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Timeline progress */}
          <div className="mt-6 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                <span>Timeline</span>
                <span>
                  {formatDateShort(startDate)} to {formatDateShort(endDate)}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full w-full overflow-hidden"
                style={{ background: "#e5eaf0" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${timeProgress}%`,
                    background: "#0F2744",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                <span>Milestone progress</span>
                <span className="font-semibold text-gray-700">
                  {milestonesCompleted} / {milestonesTotal} completed
                </span>
              </div>
              <div
                className="h-1.5 rounded-full w-full overflow-hidden"
                style={{ background: "#e5eaf0" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${milestoneProgress}%`,
                    background: "#D4AF37",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* EM Contact */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "#0F2744" }}
          >
            Your Engagement Manager
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ background: "#0F2744" }}
            >
              {project.engagementManager.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "#0F2744" }}
              >
                {project.engagementManager.name}
              </p>
              <a
                href={`mailto:${project.engagementManager.email}`}
                className="text-xs text-gray-500 hover:underline"
              >
                {project.engagementManager.email}
              </a>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "#0F2744" }}
          >
            Milestones
          </h2>
          {project.milestones.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No milestones defined yet.
            </p>
          ) : (
            <div className="space-y-0">
              {project.milestones.map((milestone, idx) => {
                const msStyle =
                  MILESTONE_STATUS_STYLES[milestone.status] ??
                  MILESTONE_STATUS_STYLES.PENDING;
                const isLast = idx === project.milestones.length - 1;

                return (
                  <div key={milestone.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                        style={{
                          background:
                            milestone.status === "COMPLETED"
                              ? "#D4AF37"
                              : milestone.status === "IN_PROGRESS"
                              ? "#0F2744"
                              : "#e5eaf0",
                          border:
                            milestone.status === "IN_PROGRESS"
                              ? "2px solid #0F2744"
                              : "none",
                        }}
                      />
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{ background: "#e5eaf0", minHeight: "24px" }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#0F2744" }}
                          >
                            {milestone.name}
                          </p>
                          {milestone.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {milestone.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Due {formatDateShort(new Date(milestone.dueDate))}
                            {milestone.completionDate &&
                              ` · Completed ${formatDateShort(new Date(milestone.completionDate))}`}
                          </p>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={{
                            background: msStyle.bg,
                            color: msStyle.color,
                          }}
                        >
                          {msStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "#0F2744" }}
          >
            Deliverables
          </h2>
          {project.deliverables.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No approved deliverables yet.
            </p>
          ) : (
            <div className="space-y-2">
              {project.deliverables.map((d) => {
                const dStyle =
                  DELIVERABLE_STATUS_STYLES[d.status] ??
                  DELIVERABLE_STATUS_STYLES.APPROVED;

                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                    style={{ border: "1px solid #e5eaf0", background: "#FAFBFC" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "#0F2744" }}
                      >
                        {d.name}
                      </p>
                      {d.submittedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Submitted {formatDateShort(new Date(d.submittedAt))}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: dStyle.bg,
                          color: dStyle.color,
                        }}
                      >
                        {dStyle.label}
                      </span>
                      {d.fileUrl && (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            background: "#0F2744",
                            color: "#fff",
                          }}
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
