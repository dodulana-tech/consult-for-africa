import { SkeletonPage, SkeletonLine, SkeletonCircle } from "@/components/shared/Skeleton";

export default function AiLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full space-y-4">
        <div className="flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <SkeletonCircle size="w-8 h-8" />
            <div className="space-y-2 flex-1">
              <SkeletonLine width="w-full" />
              <SkeletonLine width="w-3/4" />
            </div>
          </div>
          <div className="flex items-start gap-3 justify-end">
            <div className="space-y-2 flex-1 max-w-md">
              <SkeletonLine width="w-full" />
              <SkeletonLine width="w-1/2" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <SkeletonCircle size="w-8 h-8" />
            <div className="space-y-2 flex-1">
              <SkeletonLine width="w-full" />
              <SkeletonLine width="w-5/6" />
              <SkeletonLine width="w-2/3" />
            </div>
          </div>
        </div>
        <div className="border-t pt-4" style={{ borderColor: "#e5eaf0" }}>
          <SkeletonLine width="w-full" height="h-12" />
        </div>
      </div>
    </SkeletonPage>
  );
}
