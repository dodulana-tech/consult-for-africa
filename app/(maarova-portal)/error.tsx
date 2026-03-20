"use client";

import { useEffect } from "react";

export default function MaarovaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[maarova error]", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#FEF2F2" }}>
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-6">An unexpected error occurred. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#D4A574" }}>Try Again</button>
          <a href="/maarova/portal/dashboard" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600" style={{ background: "#F3F4F6" }}>Dashboard</a>
        </div>
      </div>
    </div>
  );
}
