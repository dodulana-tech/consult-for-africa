import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import StatusBadge from "@/components/platform/StatusBadge";
import { formatDate, timeAgo } from "@/lib/utils";
import { FileCheck, Star, ChevronRight, AlertTriangle, Clock } from "lucide-react";

type SearchParams = Promise<{
  urgency?: string;
  assignment?: string;
  sort?: string;
}>;

const URGENCY_OPTIONS = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "due_soon", label: "Due in 7 days" },
  { id: "on_track", label: "On track" },
  { id: "no_due_date", label: "No due date" },
] as const;

const ASSIGNMENT_OPTIONS = [
  { id: "all", label: "All" },
  { id: "assigned", label: "Assigned" },
  { id: "unassigned", label: "Unassigned" },
] as const;

const SORT_OPTIONS = [
  { id: "status", label: "By status" },
  { id: "due", label: "Due soonest" },
  { id: "overdue", label: "Most overdue" },
  { id: "recent", label: "Recently submitted" },
] as const;

function classifyUrgency(due: Date | null, now: Date): "overdue" | "due_soon" | "on_track" | "no_due_date" {
  if (!due) return "no_due_date";
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "due_soon";
  return "on_track";
}

export default async function DeliverablesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const urgencyFilter = (sp.urgency ?? "all") as typeof URGENCY_OPTIONS[number]["id"];
  const assignmentFilter = (sp.assignment ?? "all") as typeof ASSIGNMENT_OPTIONS[number]["id"];
  const sort = (sp.sort ?? "status") as typeof SORT_OPTIONS[number]["id"];

  const { role, id: userId } = session.user;
  const isElevated = ["ASSOCIATE_DIRECTOR", "DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";
  const isConsultant = role === "CONSULTANT";
  const canManage = isEM || isElevated;

  const deliverableWhere = isElevated
    ? {}
    : isEM
    ? { engagement: { engagementManagerId: userId } }
    : { assignment: { consultantId: userId } };

  const allDeliverables = await prisma.deliverable.findMany({
    where: deliverableWhere,
    include: {
      engagement: { select: { id: true, name: true } },
      assignment: {
        include: { consultant: { select: { name: true } } },
      },
    },
  });

  const now = new Date();

  // Apply filters
  const filtered = allDeliverables.filter((d) => {
    const urg = classifyUrgency(d.dueDate, now);
    const isFinal = d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT";
    if (urgencyFilter !== "all") {
      if (urgencyFilter === "overdue" && (urg !== "overdue" || isFinal)) return false;
      if (urgencyFilter === "due_soon" && (urg !== "due_soon" || isFinal)) return false;
      if (urgencyFilter === "on_track" && urg !== "on_track") return false;
      if (urgencyFilter === "no_due_date" && urg !== "no_due_date") return false;
    }
    if (assignmentFilter === "assigned" && !d.assignment) return false;
    if (assignmentFilter === "unassigned" && d.assignment) return false;
    return true;
  });

  // Apply sort
  const statusOrder: Record<string, number> = {
    SUBMITTED: 1,
    IN_REVIEW: 2,
    NEEDS_REVISION: 3,
    DRAFT: 4,
    APPROVED: 5,
    DELIVERED_TO_CLIENT: 6,
  };
  filtered.sort((a, b) => {
    if (sort === "due") {
      const aT = a.dueDate ? a.dueDate.getTime() : Infinity;
      const bT = b.dueDate ? b.dueDate.getTime() : Infinity;
      return aT - bT;
    }
    if (sort === "overdue") {
      const aOver = a.dueDate && a.dueDate < now ? a.dueDate.getTime() : Infinity;
      const bOver = b.dueDate && b.dueDate < now ? b.dueDate.getTime() : Infinity;
      return aOver - bOver;
    }
    if (sort === "recent") {
      const aT = a.submittedAt ? a.submittedAt.getTime() : a.createdAt.getTime();
      const bT = b.submittedAt ? b.submittedAt.getTime() : b.createdAt.getTime();
      return bT - aT;
    }
    // by status
    const sA = statusOrder[a.status] ?? 99;
    const sB = statusOrder[b.status] ?? 99;
    if (sA !== sB) return sA - sB;
    return (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0);
  });

  // Counts for filter chips (computed against pre-filter set)
  const counts = {
    urgency: {
      all: allDeliverables.length,
      overdue: allDeliverables.filter((d) => {
        const isFinal = d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT";
        return classifyUrgency(d.dueDate, now) === "overdue" && !isFinal;
      }).length,
      due_soon: allDeliverables.filter((d) => {
        const isFinal = d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT";
        return classifyUrgency(d.dueDate, now) === "due_soon" && !isFinal;
      }).length,
      on_track: allDeliverables.filter((d) => classifyUrgency(d.dueDate, now) === "on_track").length,
      no_due_date: allDeliverables.filter((d) => !d.dueDate).length,
    },
    assignment: {
      all: allDeliverables.length,
      assigned: allDeliverables.filter((d) => d.assignment).length,
      unassigned: allDeliverables.filter((d) => !d.assignment).length,
    },
  };

  // Top stats (always against full set)
  const pendingCount = allDeliverables.filter(
    (d) => d.status === "SUBMITTED" || d.status === "IN_REVIEW",
  ).length;
  const approvedCount = allDeliverables.filter(
    (d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT",
  ).length;
  const draftCount = allDeliverables.filter((d) => d.status === "DRAFT").length;
  const revisionCount = allDeliverables.filter((d) => d.status === "NEEDS_REVISION").length;

  const groups =
    sort === "status"
      ? [
          {
            label: "Pending Review",
            accent: "#F59E0B",
            items: filtered.filter((d) => d.status === "SUBMITTED" || d.status === "IN_REVIEW"),
          },
          {
            label: "Needs Revision",
            accent: "#EF4444",
            items: filtered.filter((d) => d.status === "NEEDS_REVISION"),
          },
          {
            label: "Draft",
            accent: "#9CA3AF",
            items: filtered.filter((d) => d.status === "DRAFT"),
          },
          {
            label: "Approved",
            accent: "#10B981",
            items: filtered.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT"),
          },
        ].filter((g) => g.items.length > 0)
      : [{ label: SORT_OPTIONS.find((s) => s.id === sort)?.label ?? "Results", accent: "#0F2744", items: filtered }];

  function buildHref(updates: Partial<{ urgency: string; assignment: string; sort: string }>) {
    const next = new URLSearchParams();
    const u = updates.urgency ?? urgencyFilter;
    const a = updates.assignment ?? assignmentFilter;
    const s = updates.sort ?? sort;
    if (u !== "all") next.set("urgency", u);
    if (a !== "all") next.set("assignment", a);
    if (s !== "status") next.set("sort", s);
    const qs = next.toString();
    return qs ? `/deliverables?${qs}` : "/deliverables";
  }

  const filtersActive = urgencyFilter !== "all" || assignmentFilter !== "all" || sort !== "status";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Deliverables"
        subtitle={isConsultant ? "Your submitted work" : "Review and manage consultant work"}
      />
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-3xl space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* Filters */}
          <div
            className="rounded-xl p-3 sm:p-4 space-y-3"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <FilterRow
              label="Urgency"
              options={URGENCY_OPTIONS.map((o) => ({
                ...o,
                count: counts.urgency[o.id as keyof typeof counts.urgency],
              }))}
              activeId={urgencyFilter}
              buildHref={(id) => buildHref({ urgency: id })}
            />
            {canManage && (
              <FilterRow
                label="Assignment"
                options={ASSIGNMENT_OPTIONS.map((o) => ({
                  ...o,
                  count: counts.assignment[o.id as keyof typeof counts.assignment],
                }))}
                activeId={assignmentFilter}
                buildHref={(id) => buildHref({ assignment: id })}
              />
            )}
            <FilterRow
              label="Sort"
              options={SORT_OPTIONS.map((o) => ({ ...o, count: undefined }))}
              activeId={sort}
              buildHref={(id) => buildHref({ sort: id })}
            />
            {filtersActive && (
              <div className="pt-1">
                <Link href="/deliverables" className="text-[11px] text-gray-500 hover:text-gray-900 underline">
                  Clear filters
                </Link>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <FileCheck size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {filtersActive ? "No deliverables match your filters." : "No deliverables yet."}
              </p>
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
                    const reviewLink = canManage ? `/deliverables/${d.id}` : `/deliverables/${d.id}/submit`;
                    const isOverdue =
                      d.dueDate &&
                      new Date(d.dueDate) < now &&
                      d.status !== "APPROVED" &&
                      d.status !== "DELIVERED_TO_CLIENT";
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
                            {isOverdue && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 flex items-center gap-0.5">
                                <AlertTriangle size={9} /> Overdue
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900 text-sm group-hover:text-[#0F2744]">{d.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                            <span>{d.engagement.name}</span>
                            {d.assignment && (
                              <>
                                <span>·</span>
                                <span>{d.assignment.consultant.name}</span>
                              </>
                            )}
                            {!d.assignment && canManage && (
                              <>
                                <span>·</span>
                                <span className="text-amber-500">Unassigned</span>
                              </>
                            )}
                            {d.dueDate && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock size={9} /> Due {formatDate(new Date(d.dueDate))}
                                </span>
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

function FilterRow({
  label,
  options,
  activeId,
  buildHref,
}: {
  label: string;
  options: { id: string; label: string; count?: number }[];
  activeId: string;
  buildHref: (id: string) => string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mr-1">{label}</span>
      {options.map((o) => {
        const active = o.id === activeId;
        return (
          <Link
            key={o.id}
            href={buildHref(o.id)}
            className="text-xs rounded-lg px-2.5 py-1 font-medium transition"
            style={{
              background: active ? "#0F2744" : "#F4F6F9",
              color: active ? "#FFFFFF" : "#374151",
              border: active ? "1px solid #0F2744" : "1px solid transparent",
            }}
          >
            {o.label}
            {o.count !== undefined && (
              <span className="ml-1.5" style={{ color: active ? "rgba(255,255,255,0.6)" : "#9CA3AF" }}>
                {o.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
