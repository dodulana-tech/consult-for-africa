import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PlatformNotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6" style={{ background: "#F9FAFB" }}>
      <div className="text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "#0F2744" }}
        >
          <span className="text-white font-bold text-lg">404</span>
        </div>
        <h1 className="text-base font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-400 mb-6">
          This page does not exist or you may not have access to it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#0F2744" }}
        >
          <ArrowLeft size={13} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
