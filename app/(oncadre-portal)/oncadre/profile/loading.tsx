export default function ProfileLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header section */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-200" />
        <div>
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-28 rounded bg-gray-100" />
        </div>
      </div>

      {/* Profile sections */}
      {[1, 2, 3, 4].map((section) => (
        <div
          key={section}
          className="rounded-2xl bg-white p-6"
          style={{
            border: "1px solid #E8EBF0",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
