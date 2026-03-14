import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import StatusBadge from "@/components/platform/StatusBadge";
import { formatDate, timeAgo } from "@/lib/utils";
import { FileCheck, Star, ChevronRight } from "lucide-react";

export default async function DeliverablesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { role, id: userId } = session.user;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";
  const isConsultant = role === "CONSULTANT";

  const deliverableWhere = isElevated
    ? {}
    : isEM
    ? { project: { engagementManagerId: userId } }
    : { assignment: { consultantId: userId } };

  const deliverables = await prisma.deliverable.findMany({
    where: deliverableWhere,
    include: {
      project: { select: { id: true, name: true } },
      assignment: {
        include: { consultant: { select: { name: true } } },
      },
    },
    orderBy: [
      { status: "asc" },
      { submittedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  const pendingCount = deliverables.filter(
    (d) => d.status === "SUBMITTED" || d.status === "IN_REVIEW"
  ).length;
  const approvedCount = deliverables.filter(
    (d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT"
  ).length;
  const draftCount = deliverables.filter((d) => d.status === "DRAFT").length;
  const revisionCount = deliverables.filter((d) => d.status === "NEEDS_REVISION").length;

  const groups = [
    {
      label: "Pending Review",
      status: ["SUBMITTED", "IN_REVIEW"],
      accent: "#F59E0B",
      items: deliverables.filter((d) => d.status === "SUBMITTED" || d.status === "IN_REVIEW"),
    },
    {
      label: "Needs Revision",
      status: ["NEEDS_REVISION"],
      accent: "#EF4444",
      items: deliverables.filter((d) => d.status === "NEEDS_REVISION"),
    },
    {
      label: "Draft",
      status: ["DRAFT"],
      accent: "#9CA3AF",
      items: deliverables.filter((d) => d.status === "DRAFT"),
    },
    {
      label: "Approved",
      status: ["APPROVED", "DELIVERED_TO_CLIENT"],
      accent: "#10B981",
      items: deliverables.filter(
        (d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT"
      ),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Deliverables"
        subtitle={isConsultant ? "Your submitted work" : "Review and manage consultant work"}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pending Review", count: pendingCount, color: "#F59E0B" },
              { label: "Needs Revision", count: revisionCount, color: "#EF4444" },
              { label: "Draft", count: draftCount, color: "#9CA3AF" },
              { label: "Approved", count: approvedCount, color: "#10B981" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{ background: "#fff", border: "1px solid #e5eaf0" }}
              >
                <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="h-1 rounded-full mt-2" style={{ background: s.color, width: "32px" }} />
              </div>
            ))}
          </div>

          {deliverables.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <FileCheck size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No deliverables yet.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: group.accent }} />
                  <h2 className="text-sm font-semibold text-gray-700">{group.label}</h2>
                  <span className="text-xs text-gray-400">({group.items.length})</span>
                </div>
                <div className="space-y-2">
                  {group.items.map((d) => {
                    const reviewLink = isEM ? `/deliverables/${d.id}` : `/deliverables/${d.id}/submit`;
                    return (
                      <Link
                        key={d.id}
                        href={reviewLink}
                        className="flex items-start justify-between gap-4 rounded-xl p-4 transition-shadow hover:shadow-sm group"
                        style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <StatusBadge status={d.status} />
                            {d.version > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                                v{d.version}
                              </span>
                            )}
                            {d.reviewScore && (
                              <span className="text-xs text-amber-600 flex items-center gap-0.5">
                                <Star size={10} className="text-amber-400" />
                                {d.reviewScore}/10
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900 text-sm group-hover:text-[#0F2744]">
                            {d.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                            <span>{d.project.name}</span>
                            {d.assignment && (
                              <>
                                <span>·</span>
                                <span>{d.assignment.consultant.name}</span>
                              </>
                            )}
                            {d.submittedAt && (
                              <>
                                <span>·</span>
                                <span>{timeAgo(d.submittedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1 group-hover:text-gray-500 transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
