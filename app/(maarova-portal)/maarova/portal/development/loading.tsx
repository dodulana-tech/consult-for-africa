import { SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function MaarovaDevelopmentLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <SkeletonLine width="w-44" height="h-7" />
      <SkeletonLine width="w-72" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center justify-between">
              <SkeletonLine width="w-40" height="h-5" />
              <SkeletonLine width="w-16" height="h-5" />
            </div>
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-full" height="h-2" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
