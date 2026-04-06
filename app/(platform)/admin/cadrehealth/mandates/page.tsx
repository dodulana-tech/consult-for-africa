import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  SOURCING: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-amber-100 text-amber-700",
  INTERVIEWING: "bg-purple-100 text-purple-700",
  OFFER_EXTENDED: "bg-indigo-100 text-indigo-700",
  PLACED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
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
          <h1 className="text-2xl font-bold text-gray-900">Mandates</h1>
          <p className="text-sm text-gray-500">
            {mandates.length} mandate{mandates.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/cadrehealth/mandates/create"
          className="inline-flex items-center justify-center rounded-lg bg-[#0B3C5D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A3350]"
        >
          + Create Mandate
        </Link>
      </div>

      {mandates.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-500">No mandates yet. Create your first one.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Cadre</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Matches</th>
                </tr>
              </thead>
              <tbody>
                {mandates.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/cadrehealth/mandates/${m.id}`}
                        className="font-medium text-[#0B3C5D] hover:underline"
                      >
                        {m.title}
                      </Link>
                      {m.facility?.name && (
                        <div className="text-xs text-gray-400">{m.facility.name}</div>
                      )}
                      {!m.facility && m.facilityName && (
                        <div className="text-xs text-gray-400">{m.facilityName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {getCadreLabel(m.cadre)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[m.locationCity, m.locationState].filter(Boolean).join(", ") || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {m.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {m._count.matches}
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
                className="block rounded-xl border bg-white p-4 hover:border-[#0B3C5D]/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-gray-900">{m.title}</h3>
                    <p className="text-sm text-gray-500">
                      {getCadreLabel(m.cadre)} / {m.type}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[m.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {[m.locationCity, m.locationState].filter(Boolean).join(", ") || "N/A"}
                  </span>
                  <span>{m._count.matches} match{m._count.matches !== 1 ? "es" : ""}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {m.createdAt.toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
