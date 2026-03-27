import { SkeletonPage, SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function OpportunitiesLoading() {
  return (
    <SkeletonPage>
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-40" height="h-6" />
        <SkeletonLine width="w-24" height="h-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <SkeletonLine width="w-24" height="h-5" />
            {Array.from({ length: 3 }).map((_, row) => (
              <SkeletonCard key={row}>
                <SkeletonLine width="w-36" height="h-4" />
                <SkeletonLine width="w-full" />
                <SkeletonLine width="w-20" />
              </SkeletonCard>
            ))}
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
