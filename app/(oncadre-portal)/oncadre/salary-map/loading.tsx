import { SalaryTableSkeleton } from "@/components/cadrehealth/Skeletons";

export default function SalaryMapLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-5 animate-pulse"
            style={{ border: "1px solid #E8EBF0" }}
          >
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="mt-2 h-7 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <SalaryTableSkeleton rows={8} />
    </div>
  );
}
