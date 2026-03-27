/** Reusable skeleton primitives for loading states */

export function SkeletonLine({ width = "w-full", height = "h-3" }: { width?: string; height?: string }) {
  return <div className={`${width} ${height} bg-gray-200 rounded`} />;
}

export function SkeletonCircle({ size = "w-8 h-8" }: { size?: string }) {
  return <div className={`${size} bg-gray-200 rounded-full shrink-0`} />;
}

export function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
      {children ?? (
        <>
          <SkeletonLine width="w-20" />
          <SkeletonLine width="w-16" height="h-7" />
          <SkeletonLine width="w-24" height="h-2" />
        </>
      )}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border space-y-0" style={{ borderColor: "#e5eaf0" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b" style={{ borderColor: "#e5eaf0" }}>
        <SkeletonLine width="w-24" />
        <SkeletonLine width="w-20" />
        <SkeletonLine width="w-16" />
        <SkeletonLine width="w-20" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0" style={{ borderColor: "#e5eaf0" }}>
          <SkeletonLine width="w-28" />
          <SkeletonLine width="w-20" />
          <SkeletonLine width="w-16" />
          <SkeletonLine width="w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTopBar() {
  return (
    <div className="h-14 sm:h-16 border-b flex items-center justify-between px-4 sm:px-6" style={{ borderColor: "#E2E8F0" }}>
      <SkeletonLine width="w-32" height="h-5" />
      <SkeletonCircle />
    </div>
  );
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden animate-pulse">
      <SkeletonTopBar />
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        {children}
      </div>
    </div>
  );
}
