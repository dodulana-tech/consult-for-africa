/**
 * Reusable skeleton loading components for CadreHealth pages.
 * Uses pulsing animation with gray-200/gray-100 pattern.
 */

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`}
    />
  );
}

export function HospitalCardSkeleton() {
  return (
    <div
      className="rounded-2xl bg-white p-6"
      style={{
        border: "1px solid #E8EBF0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Pulse className="h-5 w-48" />
          <Pulse className="mt-2 h-3 w-32" />
        </div>
        <Pulse className="h-10 w-10 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <Pulse className="h-6 w-20 rounded-full" />
        <Pulse className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Pulse className="h-3 w-full" />
            <Pulse className="mt-1 h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div
      className="rounded-2xl bg-white p-6"
      style={{
        border: "1px solid #E8EBF0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <Pulse className="h-2 w-2 rounded-full" />
        <Pulse className="h-3 w-24" />
      </div>
      <Pulse className="mt-3 h-9 w-20" />
      <Pulse className="mt-2 h-3 w-36" />
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div
      className="rounded-2xl bg-white p-6"
      style={{
        border: "1px solid #E8EBF0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pulse className="h-10 w-10 rounded-full" />
          <div>
            <Pulse className="h-4 w-28" />
            <Pulse className="mt-1 h-3 w-20" />
          </div>
        </div>
        <Pulse className="h-6 w-12 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-5/6" />
        <Pulse className="h-3 w-3/4" />
      </div>
      <div className="mt-4 flex gap-4">
        {[1, 2, 3].map((i) => (
          <Pulse key={i} className="h-3 w-16" />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Pulse className={`h-4 ${i === 0 ? "w-32" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}

export function SalaryTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[#E8EBF0] bg-white"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E8EBF0] bg-[#F8F9FB]">
            {["Grade", "Basic Salary", "Housing", "Transport", "Hazard", "Total Gross"].map(
              (h) => (
                <th
                  key={h}
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E8EBF0]">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={6} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
