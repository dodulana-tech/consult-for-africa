import { SkeletonCard, SkeletonLine, SkeletonTable } from "@/components/shared/Skeleton";

export default function MaarovaDashboardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <SkeletonLine width="w-48" height="h-7" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={4} />
    </div>
  );
}
