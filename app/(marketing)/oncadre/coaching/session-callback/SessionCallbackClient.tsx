"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  reference: string | undefined;
  coachingSession: {
    id: string;
    topic: string;
    status: string;
    mentorProfile: {
      professional: { firstName: string; lastName: string };
    };
  } | null;
};

export default function SessionCallbackClient({ reference, coachingSession }: Props) {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setVerifying(false);
      setError("No payment reference found");
      return;
    }

    if (coachingSession?.status === "PAID") {
      setVerified(true);
      setVerifying(false);
      return;
    }

    fetch("/api/cadre/coaching/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");
        setVerified(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Verification failed"))
      .finally(() => setVerifying(false));
  }, [reference, coachingSession]);

  return (
    <main className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-md mx-auto text-center">
        {verifying ? (
          <>
            <div className="w-12 h-12 mx-auto mb-6 border-4 border-gray-200 border-t-[#D4AF37] rounded-full animate-spin" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Confirming your payment</h1>
            <p className="text-sm text-gray-600">This usually takes a few seconds...</p>
          </>
        ) : verified ? (
          <>
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.15)" }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Session booked</h1>
            {coachingSession && (
              <p className="text-sm text-gray-600 mb-6">
                Your coaching session with{" "}
                <span className="font-semibold">
                  {coachingSession.mentorProfile.professional.firstName}{" "}
                  {coachingSession.mentorProfile.professional.lastName}
                </span>{" "}
                on <span className="font-semibold">{coachingSession.topic}</span> is confirmed. They have been
                notified and will reach out to schedule.
              </p>
            )}
            <div className="space-y-3">
              <Link
                href="/oncadre/mentorship/my"
                className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
              >
                View my sessions
              </Link>
              <Link
                href="/oncadre/dashboard"
                className="block w-full rounded-xl border py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                style={{ borderColor: "#E8EBF0" }}
              >
                Back to dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment verification failed</h1>
            <p className="text-sm text-gray-600 mb-6">{error || "We could not confirm your payment."}</p>
            <Link
              href="/oncadre/mentorship/mentors"
              className="inline-block rounded-xl py-3 px-6 text-sm font-medium text-white"
              style={{ background: "#0B3C5D" }}
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
