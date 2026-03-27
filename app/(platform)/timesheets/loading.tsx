import { SkeletonPage, SkeletonTable, SkeletonLine } from "@/components/shared/Skeleton";

export default function TimesheetsLoading() {
  return (
    <SkeletonPage>
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-36" height="h-6" />
        <SkeletonLine width="w-28" height="h-9" />
      </div>
      <SkeletonTable rows={8} />
    </SkeletonPage>
  );
}
