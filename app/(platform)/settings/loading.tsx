import { SkeletonPage, SkeletonLine } from "@/components/shared/Skeleton";

export default function SettingsLoading() {
  return (
    <SkeletonPage>
      <SkeletonLine width="w-32" height="h-6" />
      <div className="bg-white rounded-xl border p-6 space-y-6" style={{ borderColor: "#e5eaf0" }}>
        <div className="space-y-2">
          <SkeletonLine width="w-20" height="h-4" />
          <SkeletonLine width="w-full" height="h-10" />
        </div>
        <div className="space-y-2">
          <SkeletonLine width="w-24" height="h-4" />
          <SkeletonLine width="w-full" height="h-10" />
        </div>
        <div className="space-y-2">
          <SkeletonLine width="w-16" height="h-4" />
          <SkeletonLine width="w-full" height="h-10" />
        </div>
        <div className="space-y-2">
          <SkeletonLine width="w-28" height="h-4" />
          <SkeletonLine width="w-full" height="h-24" />
        </div>
        <SkeletonLine width="w-24" height="h-10" />
      </div>
    </SkeletonPage>
  );
}
