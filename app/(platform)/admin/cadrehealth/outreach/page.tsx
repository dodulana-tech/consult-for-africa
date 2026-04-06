import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { OutreachBatchButton } from "./OutreachBatchButton";

// ─── CadreHealth: Outreach Dashboard ───

export default async function OutreachDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tier?: string; page?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status;
  const tierFilter = params.tier;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 25;

  // Build filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (statusFilter) where.status = statusFilter;
  if (tierFilter) where.tier = tierFilter;

  // Parallel data fetches
  const [
    totalImported,
    enriched,
    whatsAppSent,
    replied,
    converted,
    unreachable,
    notInterested,
    emigrated,
    retired,
    statusCounts,
    conversations,
    totalConversations,
  ] = await Promise.all([
    prisma.cadreOutreachRecord.count(),
    prisma.cadreOutreachRecord.count({
      where: { status: { in: ["READY", "WHATSAPP_SENT", "WHATSAPP_REPLIED", "SMS_SENT", "EMAIL_SENT", "CONVERTED", "NOT_INTERESTED", "EMIGRATED", "RETIRED"] } },
    }),
    prisma.cadreOutreachRecord.count({ where: { status: { in: ["WHATSAPP_SENT", "WHATSAPP_REPLIED", "SMS_SENT", "EMAIL_SENT", "CONVERTED"] } } }),
    prisma.cadreOutreachRecord.count({ where: { status: "WHATSAPP_REPLIED" } }),
    prisma.cadreOutreachRecord.count({ where: { status: "CONVERTED" } }),
    prisma.cadreOutreachRecord.count({ where: { status: "UNREACHABLE" } }),
    prisma.cadreOutreachRecord.count({ where: { status: "NOT_INTERESTED" } }),
    prisma.cadreOutreachRecord.count({ where: { status: "EMIGRATED" } }),
    prisma.cadreOutreachRecord.count({ where: { status: "RETIRED" } }),
    prisma.cadreOutreachRecord.groupBy({ by: ["status"], _count: true }),
    prisma.cadreOutreachRecord.findMany({
      where,
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy: { lastContactedAt: { sort: "desc", nulls: "last" } },
      select: {
        id: true,
        status: true,
        tier: true,
        lastContactedAt: true,
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            cadre: true,
            subSpecialty: true,
            state: true,
            whatsAppMessages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                content: true,
                direction: true,
                createdAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.cadreOutreachRecord.count({ where }),
  ]);

  const totalPages = Math.ceil(totalConversations / pageSize);
  const pendingReady = await prisma.cadreOutreachRecord.count({ where: { status: "READY" } });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outreach Pipeline</h1>
          <p className="text-gray-500">
            WhatsApp outreach to healthcare professionals
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/cadrehealth"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
          <OutreachBatchButton pendingCount={pendingReady} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Imported" value={totalImported} />
        <StatCard label="Enriched" value={enriched} />
        <StatCard label="WhatsApp Sent" value={whatsAppSent} />
        <StatCard label="Replied" value={replied} accent="emerald" />
        <StatCard label="Converted" value={converted} accent="blue" />
        <StatCard label="Unreachable" value={unreachable} accent="red" />
      </div>

      {/* Funnel visualization */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Conversion Funnel</h2>
        <div className="space-y-3">
          <FunnelBar label="Imported" count={totalImported} total={totalImported} color="bg-gray-400" />
          <FunnelBar label="Enriched" count={enriched} total={totalImported} color="bg-slate-500" />
          <FunnelBar label="WhatsApp Sent" count={whatsAppSent} total={totalImported} color="bg-blue-500" />
          <FunnelBar label="Replied" count={replied} total={totalImported} color="bg-emerald-500" />
          <FunnelBar label="Converted" count={converted} total={totalImported} color="bg-[#0B3C5D]" />
        </div>
        <div className="mt-4 flex gap-6 text-xs text-gray-500">
          <span>Not interested: {notInterested}</span>
          <span>Emigrated: {emigrated}</span>
          <span>Retired: {retired}</span>
          <span>Unreachable: {unreachable}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterLink href="/admin/cadrehealth/outreach" label="All" active={!statusFilter && !tierFilter} />
        {statusCounts.map((s) => (
          <FilterLink
            key={s.status}
            href={`/admin/cadrehealth/outreach?status=${s.status}`}
            label={`${formatStatus(s.status)} (${s._count})`}
            active={statusFilter === s.status}
          />
        ))}
      </div>

      {/* Tier filter */}
      <div className="flex gap-2">
        <span className="text-sm text-gray-500 self-center">Tier:</span>
        <FilterLink href="/admin/cadrehealth/outreach" label="All" active={!tierFilter} />
        {["A", "B", "C"].map((t) => (
          <FilterLink
            key={t}
            href={`/admin/cadrehealth/outreach?tier=${t}${statusFilter ? `&status=${statusFilter}` : ""}`}
            label={`Tier ${t}`}
            active={tierFilter === t}
          />
        ))}
      </div>

      {/* Conversations table */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">
          Conversations ({totalConversations})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Professional</th>
                <th className="hidden pb-2 font-medium sm:table-cell">Cadre</th>
                <th className="hidden pb-2 font-medium md:table-cell">State</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="hidden pb-2 font-medium lg:table-cell">Tier</th>
                <th className="pb-2 font-medium">Last Message</th>
                <th className="hidden pb-2 font-medium sm:table-cell">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => {
                const lastMsg = c.professional.whatsAppMessages[0];
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/admin/cadrehealth/${c.professional.id}`}
                        className="font-medium text-[#0B3C5D] hover:underline"
                      >
                        {c.professional.firstName} {c.professional.lastName}
                      </Link>
                      <div className="text-xs text-gray-400 sm:hidden">
                        {c.professional.cadre.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="hidden py-3 text-gray-600 sm:table-cell">
                      {c.professional.cadre.replace(/_/g, " ")}
                    </td>
                    <td className="hidden py-3 text-gray-600 md:table-cell">
                      {c.professional.state || "N/A"}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="hidden py-3 text-gray-600 lg:table-cell">
                      {c.tier ? `Tier ${c.tier}` : "-"}
                    </td>
                    <td className="max-w-[200px] truncate py-3 text-gray-600">
                      {lastMsg ? (
                        <span className={lastMsg.direction === "INBOUND" ? "font-medium" : "text-gray-400"}>
                          {lastMsg.direction === "INBOUND" ? "" : "You: "}
                          {lastMsg.content.slice(0, 60)}
                          {lastMsg.content.length > 60 ? "..." : ""}
                        </span>
                      ) : (
                        <span className="text-gray-300">No messages</span>
                      )}
                    </td>
                    <td className="hidden py-3 text-gray-400 sm:table-cell">
                      {c.lastContactedAt
                        ? c.lastContactedAt.toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                );
              })}
              {conversations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No outreach records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/cadrehealth/outreach?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ""}${tierFilter ? `&tier=${tierFilter}` : ""}`}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/cadrehealth/outreach?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ""}${tierFilter ? `&tier=${tierFilter}` : ""}`}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "blue" | "red";
}) {
  const textColor =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "blue"
        ? "text-[#0B3C5D]"
        : accent === "red"
          ? "text-red-600"
          : "text-gray-900";

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</div>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-sm text-gray-600">{label}</div>
      <div className="flex-1">
        <div className="h-6 w-full rounded-full bg-gray-100">
          <div
            className={`h-6 rounded-full ${color} flex items-center px-2 text-xs font-medium text-white transition-all`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          >
            {count > 0 ? count : ""}
          </div>
        </div>
      </div>
      <div className="w-12 text-right text-sm text-gray-500">
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    ENRICHING: "bg-yellow-100 text-yellow-700",
    READY: "bg-blue-100 text-blue-700",
    WHATSAPP_SENT: "bg-indigo-100 text-indigo-700",
    WHATSAPP_REPLIED: "bg-emerald-100 text-emerald-700",
    SMS_SENT: "bg-purple-100 text-purple-700",
    EMAIL_SENT: "bg-orange-100 text-orange-700",
    CONVERTED: "bg-green-100 text-green-800",
    NOT_INTERESTED: "bg-red-100 text-red-600",
    UNREACHABLE: "bg-gray-200 text-gray-500",
    EMIGRATED: "bg-sky-100 text-sky-700",
    RETIRED: "bg-amber-100 text-amber-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-[#0B3C5D] text-white"
          : "border border-gray-300 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
