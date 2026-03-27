import { SkeletonCard, SkeletonLine, SkeletonTable } from "@/components/shared/Skeleton";

export default function ClientInvoicesLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-32" height="h-7" />
        <SkeletonLine width="w-28" height="h-9" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}
