"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function MaarovaLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/maarova/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Login failed. Please check your credentials.");
        return;
      }

      router.push("/maarova/portal/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#0f1a2a" }}
    >
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/cfa-logo-white.svg"
              alt="CFA"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-white font-bold text-2xl tracking-tight">
              Maarova
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Leadership Assessment Portal
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 space-y-6"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <div>
            <h2 className="text-white text-xl font-semibold">Sign in</h2>
            <p className="text-gray-400 text-sm mt-1">
              Access your assessment dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-gray-300 text-sm font-medium mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                placeholder="you@organisation.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-gray-300 text-sm font-medium mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/maarova/portal/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "#D4A574" }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#D4A574" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-gray-500 text-xs text-center">
            Contact your organisation administrator if you need access.
          </p>
        </form>

        <p className="text-gray-600 text-xs text-center mt-8">
          Powered by Consult for Africa
        </p>
      </div>
    </div>
  );
}
