import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9FAFB" }}>
      <div className="text-center max-w-sm px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "#0F2744" }}
        >
          <span className="text-white font-bold text-2xl">404</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#0F2744" }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
