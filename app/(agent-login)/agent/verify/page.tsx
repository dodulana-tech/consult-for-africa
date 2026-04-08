"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token provided.");
      return;
    }

    fetch("/api/agent-portal/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          setStatus("error");
          setErrorMsg(text || "Verification failed.");
          return;
        }
        const data = await res.json();
        setStatus(data.alreadyVerified ? "already" : "success");
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center text-sm text-gray-500" style={{ border: "1px solid #E8EBF0" }}>
        Verifying your email...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
        <Link
          href="/agent/login"
          className="block text-center text-sm font-semibold hover:underline"
          style={{ color: "#D4AF37" }}
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
        {status === "already"
          ? "Your email has already been verified."
          : "Your email has been verified successfully."}
      </div>
      <Link
        href="/agent/login"
        className="block text-center text-sm font-semibold hover:underline"
        style={{ color: "#D4AF37" }}
      >
        Sign in to your account
      </Link>
    </div>
  );
}

export default function AgentVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#F8F9FB" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cfa.png" alt="Consult For Africa" className="mx-auto mb-4" style={{ height: 36 }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Email Verification
          </h1>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center text-sm text-gray-500" style={{ border: "1px solid #E8EBF0" }}>
            Loading...
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
