"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";

export default function MaarovaForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/maarova/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { setError("Something went wrong."); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#0f1a2a" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/cfa-logo-white.svg" alt="C4A" width={40} height={40} className="rounded" />
            <span className="text-white font-bold text-2xl tracking-tight">Maarova</span>
          </div>
          <p className="text-gray-400 text-sm">Leadership Assessment Portal</p>
        </div>

        <div className="rounded-2xl p-8 space-y-6" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
              <h2 className="text-white text-xl font-semibold mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm">If an account exists for {email}, you will receive a reset link shortly.</p>
              <Link href="/maarova/portal/login" className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium" style={{ color: "#D4A574" }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-white text-xl font-semibold">Forgot password?</h2>
                <p className="text-gray-400 text-sm mt-1">Enter your email and we will send you a reset link.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm" placeholder="you@organisation.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading || !email.trim()} className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-50" style={{ backgroundColor: "#D4A574" }}>
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <div className="text-center">
                <Link href="/maarova/portal/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300">
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
