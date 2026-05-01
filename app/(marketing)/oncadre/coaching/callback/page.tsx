import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}

export default async function SubscriptionCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-md mx-auto text-center">
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: "rgba(212,175,55,0.15)" }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Pro</h1>
        <p className="text-sm text-gray-600 mb-8">
          Your subscription is being activated. This may take a moment as we confirm your payment.
        </p>
        {reference && (
          <p className="text-xs text-gray-400 mb-6">Reference: {reference}</p>
        )}
        <div className="space-y-3">
          <Link
            href="/oncadre/advisor"
            className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
          >
            Open Career Advisor
          </Link>
          <Link
            href="/oncadre/dashboard"
            className="block w-full rounded-xl border py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            style={{ borderColor: "#E8EBF0" }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
