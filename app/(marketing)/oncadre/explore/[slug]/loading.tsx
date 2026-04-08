export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0F2744]" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
