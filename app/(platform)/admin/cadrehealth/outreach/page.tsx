import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { OutreachBatchButton } from "./OutreachBatchButton";
import {
  Download,
  Sparkles,
  Send,
  MessageCircle,
  UserCheck,
  XCircle,
  ArrowLeft,
} from "lucide-react";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (statusFilter) where.status = statusFilter;
  if (tierFilter) where.tier = tierFilter;

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
      {/* Hero Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #0F2744 0%, #0B3C5D 60%, #1a5a8a 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 80% 20%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(26,157,217,0.1) 0%, transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Outreach Pipeline
            </h1>
            <p className="mt-1 text-sm text-white/60">
              WhatsApp outreach to healthcare professionals
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/cadrehealth"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              style={{ backdropFilter: "blur(8px)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <OutreachBatchButton pendingCount={pendingReady} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Imported" value={totalImported} icon={<Download className="h-5 w-5" />} iconBg="bg-gray-100" iconColor="text-gray-500" accent="#6B7280" />
        <StatCard label="Enriched" value={enriched} icon={<Sparkles className="h-5 w-5" />} iconBg="bg-[#0B3C5D]/8" iconColor="text-[#0B3C5D]" accent="#0B3C5D" />
        <StatCard label="WhatsApp Sent" value={whatsAppSent} icon={<Send className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" accent="#2563EB" />
        <StatCard label="Replied" value={replied} icon={<MessageCircle className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" accent="#059669" />
        <StatCard label="Converted" value={converted} icon={<UserCheck className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-700" accent="#047857" />
        <StatCard label="Unreachable" value={unreachable} icon={<XCircle className="h-5 w-5" />} iconBg="bg-red-50" iconColor="text-red-500" accent="#EF4444" />
      </div>

      {/* Funnel visualization */}
      <div
        className="rounded-2xl border border-white/60 p-6 shadow-sm"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
        }}
      >
        <h2 className="mb-1 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Conversion Funnel
        </h2>
        <p className="mb-5 text-xs text-gray-400">End-to-end outreach performance</p>
        <div className="space-y-3">
          <FunnelBar label="Imported" count={totalImported} total={totalImported} color="#9CA3AF" />
          <FunnelBar label="Enriched" count={enriched} total={totalImported} color="#64748B" />
          <FunnelBar label="WhatsApp Sent" count={whatsAppSent} total={totalImported} color="#3B82F6" />
          <FunnelBar label="Replied" count={replied} total={totalImported} color="#10B981" />
          <FunnelBar label="Converted" count={converted} total={totalImported} color="#0B3C5D" />
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            Not interested: {notInterested}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            Emigrated: {emigrated}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Retired: {retired}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-300" />
            Unreachable: {unreachable}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tier:</span>
          <div className="flex gap-2">
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
        </div>
      </div>

      {/* Conversations table */}
      <div
        className="overflow-hidden rounded-2xl border border-white/60 shadow-sm"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
        }}
      >
        <div className="border-b border-gray-100/80 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Conversations ({totalConversations})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100/80 text-left" style={{ background: "rgba(15,39,68,0.03)" }}>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Professional</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Cadre</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">State</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Tier</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Last Message</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => {
                const lastMsg = c.professional.whatsAppMessages[0];
                return (
                  <tr key={c.id} className="border-b border-gray-50/80 transition-colors last:border-0 hover:bg-white/60">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/cadrehealth/${c.professional.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: "#0B3C5D" }}
                      >
                        {c.professional.firstName} {c.professional.lastName}
                      </Link>
                      <div className="mt-0.5 text-xs text-gray-400 sm:hidden">
                        {c.professional.cadre.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                      {c.professional.cadre.replace(/_/g, " ")}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 md:table-cell">
                      {c.professional.state || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      {c.tier ? (
                        <span
                          className="inline-flex rounded-lg px-2 py-0.5 text-xs font-bold"
                          style={{ background: "rgba(11,60,93,0.06)", color: "#0B3C5D" }}
                        >
                          {c.tier}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-gray-600">
                      {lastMsg ? (
                        <span className={lastMsg.direction === "INBOUND" ? "font-medium text-gray-900" : "text-gray-400"}>
                          {lastMsg.direction === "INBOUND" ? "" : "You: "}
                          {lastMsg.content.slice(0, 60)}
                          {lastMsg.content.length > 60 ? "..." : ""}
                        </span>
                      ) : (
                        <span className="text-gray-300">No messages</span>
                      )}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-400 sm:table-cell">
                      {c.lastContactedAt
                        ? c.lastContactedAt.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Never"}
                    </td>
                  </tr>
                );
              })}
              {conversations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    No outreach records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100/80 px-6 py-4">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/cadrehealth/outreach?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ""}${tierFilter ? `&tier=${tierFilter}` : ""}`}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/cadrehealth/outreach?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ""}${tierFilter ? `&tier=${tierFilter}` : ""}`}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
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

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  accent: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/60 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px) saturate(200%)",
        WebkitBackdropFilter: "blur(16px) saturate(200%)",
      }}
    >
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 rounded-tl-full opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
        style={{ background: accent }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          <div className={`rounded-xl p-2.5 ${iconBg} ${iconColor}`}>{icon}</div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          {value}
        </p>
      </div>
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
      <div className="w-28 shrink-0 text-sm font-medium text-gray-600">{label}</div>
      <div className="flex-1">
        <div
          className="h-8 w-full overflow-hidden rounded-xl"
          style={{ background: "rgba(15,39,68,0.04)" }}
        >
          <div
            className="flex h-8 items-center rounded-xl px-3 text-xs font-bold text-white transition-all"
            style={{
              width: `${Math.max(pct, 2)}%`,
              background: `linear-gradient(90deg, ${color}, ${color}dd)`,
              boxShadow: count > 0 ? `0 2px 8px ${color}30` : "none",
            }}
          >
            {count > 0 ? count.toLocaleString() : ""}
          </div>
        </div>
      </div>
      <div className="w-12 text-right text-sm font-medium text-gray-500">
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
    ENRICHING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    READY: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    WHATSAPP_SENT: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    WHATSAPP_REPLIED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    SMS_SENT: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    EMAIL_SENT: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    CONVERTED: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    NOT_INTERESTED: "bg-red-50 text-red-600 ring-1 ring-red-200",
    UNREACHABLE: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
    EMIGRATED: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    RETIRED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? "bg-gray-100 text-gray-600 ring-1 ring-gray-200"}`}
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
      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-[#0B3C5D] text-white shadow-sm"
          : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
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
