import { SkeletonPage, SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function KnowledgeLoading() {
  return (
    <SkeletonPage>
      <SkeletonLine width="w-40" height="h-6" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonLine width="w-48" height="h-4" />
            <SkeletonLine width="w-full" />
            <div className="flex gap-2">
              <SkeletonLine width="w-16" height="h-5" />
              <SkeletonLine width="w-16" height="h-5" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </SkeletonPage>
  );
}
