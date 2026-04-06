"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cadre/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#FAFBFC" }}>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/oncadre" className="text-2xl font-bold tracking-tight text-[#0B3C5D]">
            Cadre<span style={{ color: "#D4AF37" }}>Health</span>
          </Link>
        </div>

        {sent ? (
          <div className="rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: "#E8EBF0" }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-center text-xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              If an account exists for <strong>{email}</strong>, we have sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link
              href="/oncadre/login"
              className="mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "#0B3C5D" }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: "#E8EBF0" }}>
            <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter the email address you registered with and we will send you a reset link.
            </p>

            {error && (
              <div
                className="mt-4 rounded-xl px-4 py-3 text-sm text-red-700"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chioma@example.com"
                  required
                  className="w-full rounded-xl bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/20"
                  style={{ border: "1px solid #E8EBF0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", minHeight: "44px" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: "linear-gradient(135deg, #0B3C5D, #0E4D6E)", boxShadow: "0 2px 8px rgba(11,60,93,0.25)", minHeight: "44px" }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link href="/oncadre/login" className="font-semibold text-[#0B3C5D] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
