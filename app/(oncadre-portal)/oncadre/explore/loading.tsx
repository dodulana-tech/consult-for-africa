import { HospitalCardSkeleton } from "@/components/cadrehealth/Skeletons";

export default function ExploreLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
        </div>
      </div>

      {/* Search skeleton */}
      <div className="animate-pulse">
        <div className="h-12 w-full rounded-xl bg-gray-200" />
        <div className="mt-3 flex gap-2">
          <div className="h-8 w-24 rounded-full bg-gray-100" />
          <div className="h-8 w-20 rounded-full bg-gray-100" />
          <div className="h-8 w-28 rounded-full bg-gray-100" />
        </div>
      </div>

      {/* Hospital cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <HospitalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
