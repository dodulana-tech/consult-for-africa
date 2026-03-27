import { SkeletonPage, SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function AcademyLoading() {
  return (
    <SkeletonPage>
      <SkeletonLine width="w-32" height="h-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonLine width="w-full" height="h-32" />
            <SkeletonLine width="w-40" height="h-5" />
            <SkeletonLine width="w-full" />
            <div className="flex items-center justify-between">
              <SkeletonLine width="w-20" />
              <SkeletonLine width="w-16" height="h-5" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </SkeletonPage>
  );
}
