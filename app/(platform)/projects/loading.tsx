export default function ProjectsLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden animate-pulse">
      <div className="h-16 border-b px-6 flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: "#e5eaf0" }}>
            <div className="w-2 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
