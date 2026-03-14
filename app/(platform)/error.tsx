"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PlatformError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6" style={{ background: "#F9FAFB" }}>
      <div className="text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h1 className="text-base font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-400 mb-6">
          An error occurred while loading this page. Please try again or contact support if the issue persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            <RefreshCw size={13} />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600"
            style={{ background: "#F3F4F6" }}
          >
            Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-[10px] text-gray-300">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
