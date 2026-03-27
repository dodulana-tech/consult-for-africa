import { SkeletonPage, SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function MeetingsLoading() {
  return (
    <SkeletonPage>
      <SkeletonLine width="w-32" height="h-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center justify-between">
              <SkeletonLine width="w-40" height="h-5" />
              <SkeletonLine width="w-20" height="h-5" />
            </div>
            <SkeletonLine width="w-56" />
            <SkeletonLine width="w-32" />
          </SkeletonCard>
        ))}
      </div>
    </SkeletonPage>
  );
}
