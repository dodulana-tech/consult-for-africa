import { SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function FounderMetricsLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <SkeletonLine width="w-36" height="h-7" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard>
          <SkeletonLine width="w-32" height="h-5" />
          <SkeletonLine width="w-full" height="h-52" />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine width="w-28" height="h-5" />
          <SkeletonLine width="w-full" height="h-52" />
        </SkeletonCard>
      </div>
      <SkeletonCard>
        <SkeletonLine width="w-40" height="h-5" />
        <SkeletonLine width="w-full" height="h-44" />
      </SkeletonCard>
    </div>
  );
}
