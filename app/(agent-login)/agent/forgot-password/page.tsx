"use client";

import { useState } from "react";
import Link from "next/link";

export default function AgentForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/agent-portal/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // show same message regardless
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#F8F9FB" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cfa.png" alt="Consult For Africa" className="mx-auto mb-4" style={{ height: 36 }} />
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div
          className="rounded-2xl bg-white p-8 shadow-sm"
          style={{ border: "1px solid #E8EBF0" }}
        >
          {submitted ? (
            <div>
              <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                If an account exists with that email, we have sent a reset link. Please check your inbox.
              </div>
              <Link
                href="/agent/login"
                className="block text-center text-sm font-semibold hover:underline"
                style={{ color: "#D4AF37" }}
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: "#0F2744" }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                <Link href="/agent/login" className="font-semibold hover:underline" style={{ color: "#D4AF37" }}>
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
