"use client";

import { useEffect } from "react";

export default function OncadrePortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error("CadreHealth portal error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center sm:p-10"
        style={{
          border: "1px solid #E8EBF0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Icon */}
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(239,68,68,0.08)" }}
        >
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          We encountered an unexpected error. This has been logged and our team
          will look into it. You can try again or return to the dashboard.
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-gray-400">
            Error reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#0B3C5D" }}
          >
            Try again
          </button>
          <a
            href="/oncadre/dashboard"
            className="rounded-lg border px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            style={{ borderColor: "#E8EBF0" }}
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
