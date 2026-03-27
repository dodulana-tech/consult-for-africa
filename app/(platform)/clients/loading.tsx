import { SkeletonPage, SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";

export default function ClientsLoading() {
  return (
    <SkeletonPage>
      <SkeletonLine width="w-32" height="h-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonLine width="w-32" height="h-5" />
            <SkeletonLine width="w-48" />
            <SkeletonLine width="w-24" />
          </SkeletonCard>
        ))}
      </div>
    </SkeletonPage>
  );
}
