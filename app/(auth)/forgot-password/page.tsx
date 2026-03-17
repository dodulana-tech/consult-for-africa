"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";

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
      const res = await fetch("/api/auth/forgot-password", {
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
    <>
      <div className="flex items-center justify-center gap-3 mb-8">
        <Image src="/logo-cfa.png" alt="CFA" width={36} height={36} style={{ mixBlendMode: "multiply" }} />
        <div>
          <p className="font-semibold" style={{ color: "#0F2744" }}>Consult For Africa</p>
          <p className="text-xs" style={{ color: "#D4AF37" }}>Platform</p>
        </div>
      </div>

      <div
        className="rounded-2xl p-8"
        style={{
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 24px rgba(15,39,68,0.07), 0 1px 4px rgba(15,39,68,0.05)",
        }}
      >
        {sent ? (
          <div className="text-center py-4">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-2" style={{ color: "#0F2744" }}>Check your email</h1>
            <p className="text-sm text-gray-500">
              If an account exists for {email}, you will receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium"
              style={{ color: "#0F2744" }}
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1" style={{ color: "#0F2744" }}>Forgot password?</h1>
            <p className="text-sm mb-6 text-gray-500">
              Enter your email and we will send you a reset link.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-600">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@consultforafrica.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition"
                    style={{ border: "1px solid #CBD5E1", background: "#F8FAFC" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2744")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 mt-2"
                style={{ background: "#0F2744", color: "#ffffff" }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
