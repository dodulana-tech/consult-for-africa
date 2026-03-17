"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/client-portal/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F8FAFB" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cfa.png" alt="Consult for Africa" className="mx-auto mb-4" style={{ height: 48, width: "auto" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Client Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">Reset your password</p>
        </div>

        <div
          className="rounded-2xl bg-white p-8 shadow-sm"
          style={{ border: "1px solid #e5eaf0" }}
        >
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>
                Check your email
              </h2>
              <p className="text-sm text-gray-500">
                If an account exists for {email}, you will receive a password reset link shortly.
              </p>
              <Link
                href="/client/login"
                className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium"
                style={{ color: "#0F2744" }}
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: "#0F2744" }}
              >
                Forgot password?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email address and we will send you a link to reset your password.
              </p>

              {error && (
                <div
                  className="mb-4 rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@organisation.com"
                      className="w-full rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none transition-colors"
                      style={{
                        border: "1px solid #e5eaf0",
                        color: "#111827",
                        background: "#fff",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5eaf0")}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 mt-2"
                  style={{
                    background: "#0F2744",
                  }}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/client/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "#0F2744" }}
                >
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
