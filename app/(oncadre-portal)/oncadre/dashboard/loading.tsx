import { DashboardCardSkeleton } from "@/components/cadrehealth/Skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome header skeleton */}
      <div
        className="rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
        style={{
          background: "linear-gradient(135deg, #0B3C5D 0%, #0E4D6E 50%, #0B3C5D 100%)",
        }}
      >
        <div className="animate-pulse">
          <div className="h-3 w-20 rounded bg-white/20" />
          <div className="mt-3 h-8 w-56 rounded bg-white/20" />
          <div className="mt-2 h-4 w-36 rounded bg-white/10" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
