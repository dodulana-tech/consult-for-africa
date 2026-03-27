import { SkeletonPage, SkeletonCard, SkeletonLine, SkeletonCircle } from "@/components/shared/Skeleton";

export default function ConsultantsLoading() {
  return (
    <SkeletonPage>
      <SkeletonLine width="w-36" height="h-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center gap-3">
              <SkeletonCircle size="w-10 h-10" />
              <div className="space-y-2 flex-1">
                <SkeletonLine width="w-28" height="h-4" />
                <SkeletonLine width="w-20" />
              </div>
            </div>
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-16" />
          </SkeletonCard>
        ))}
      </div>
    </SkeletonPage>
  );
}
