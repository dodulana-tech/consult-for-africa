export default function DashboardLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden animate-pulse">
      <div className="h-16 border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between px-6 h-full">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-7 w-16 bg-gray-200 rounded" />
              <div className="h-2 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border p-6 space-y-4" style={{ borderColor: "#e5eaf0" }}>
          <div className="h-4 w-32 bg-gray-200 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
