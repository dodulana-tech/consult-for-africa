import { redirect } from "next/navigation";
import { getCadreSession } from "@/lib/cadreAuth";
import UpgradeButton from "./UpgradeButton";

export default async function UpgradePage() {
  const session = await getCadreSession();
  if (!session) {
    redirect("/oncadre/login?redirect=/oncadre/coaching/upgrade");
  }

  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-md mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "#D4AF37" }}>
          Upgrade to Pro
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Almost there</h1>
        <div className="mb-8">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold" style={{ color: "#0B3C5D" }}>
              N1,500
            </span>
            <span className="text-sm text-gray-500">/ month</span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Unlimited career advisor messages, career reports, salary benchmarking, and the ability to book paid
            coaching sessions.
          </p>
        </div>
        <UpgradeButton />
        <p className="mt-4 text-xs text-gray-400">
          Secure payment via Paystack. Cancel anytime from your dashboard.
        </p>
      </div>
    </main>
  );
}
