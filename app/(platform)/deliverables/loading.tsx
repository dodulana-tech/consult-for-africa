import { SkeletonPage, SkeletonCard, SkeletonTable, SkeletonLine } from "@/components/shared/Skeleton";

export default function DeliverablesLoading() {
  return (
    <SkeletonPage>
      <SkeletonLine width="w-40" height="h-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={6} />
    </SkeletonPage>
  );
}
