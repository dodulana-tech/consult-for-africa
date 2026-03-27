import { SkeletonCard, SkeletonLine, SkeletonTable } from "@/components/shared/Skeleton";

export default function ClientDashboardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <SkeletonLine width="w-44" height="h-7" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard>
        <SkeletonLine width="w-36" height="h-5" />
        <SkeletonLine width="w-full" height="h-40" />
      </SkeletonCard>
      <SkeletonTable rows={4} />
    </div>
  );
}
