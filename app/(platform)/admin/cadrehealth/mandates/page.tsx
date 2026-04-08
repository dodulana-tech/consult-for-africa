import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import { Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700",
  SOURCING: "bg-blue-50 text-blue-700",
  SHORTLISTED: "bg-amber-50 text-amber-700",
  INTERVIEWING: "bg-purple-50 text-purple-700",
  OFFER_EXTENDED: "bg-indigo-50 text-indigo-700",
  PLACED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-50 text-red-600",
};

export default async function MandatesPage() {
  const mandates = await prisma.cadreMandate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { matches: true } },
      facility: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Mandates
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {mandates.length} mandate{mandates.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/cadrehealth/mandates/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3350] hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Create Mandate
        </Link>
      </div>

      {mandates.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-900">No mandates yet</p>
          <p className="mt-1 text-sm text-gray-500">Create your first recruitment mandate to get started.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Title</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Cadre</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Location</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Matches</th>
                </tr>
              </thead>
              <tbody>
                {mandates.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/cadrehealth/mandates/${m.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: "#0B3C5D" }}
                      >
                        {m.title}
                      </Link>
                      {m.facility?.name && (
                        <div className="mt-0.5 text-xs text-gray-400">{m.facility.name}</div>
                      )}
                      {!m.facility && m.facilityName && (
                        <div className="mt-0.5 text-xs text-gray-400">{m.facilityName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {getCadreLabel(m.cadre)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{m.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {[m.locationCity, m.locationState].filter(Boolean).join(", ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {m.createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex min-w-[28px] items-center justify-center rounded-lg bg-[#0B3C5D]/8 px-2 py-0.5 text-sm font-bold" style={{ color: "#0B3C5D" }}>
                        {m._count.matches}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {mandates.map((m) => (
              <Link
                key={m.id}
                href={`/admin/cadrehealth/mandates/${m.id}`}
                className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#0B3C5D]/20 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">{m.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {getCadreLabel(m.cadre)} / {m.type}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {[m.locationCity, m.locationState].filter(Boolean).join(", ") || "N/A"}
                  </span>
                  <span className="rounded-lg bg-[#0B3C5D]/8 px-2 py-0.5 font-bold" style={{ color: "#0B3C5D" }}>
                    {m._count.matches} match{m._count.matches !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {m.createdAt.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
