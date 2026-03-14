"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          <div className="text-center max-w-sm px-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "#EF4444", width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}
            >
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>!</span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              style={{ background: "#0F2744", color: "#fff", padding: "10px 20px", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
