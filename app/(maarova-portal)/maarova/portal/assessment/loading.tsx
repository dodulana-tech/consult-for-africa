import { SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function MaarovaAssessmentLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <SkeletonLine width="w-44" height="h-7" />
      <SkeletonLine width="w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonLine width="w-32" height="h-5" />
            <SkeletonLine width="w-full" />
            <div className="flex items-center justify-between">
              <SkeletonLine width="w-20" />
              <SkeletonLine width="w-16" height="h-6" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
